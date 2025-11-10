import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoute.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import userModel from '../../models/userModel.js';
import orderModel from '../../models/orderModel.js';
import productModel from '../../models/productModel.js';
import jwt from 'jsonwebtoken';
import { populateData } from '../../sample_data/populate_db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRoutes);

let mongod;
let testUser1;
let testUser2;
let validTokenUser1;
let orderUser1;

describe('JWT Security Tests - Token Tampering', () => {
  beforeAll(async () => {
    // env var JWT_SECRET
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not found in environment variables');
    }

    // mongo memory sertver
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);

    // sample data
    await populateData(mongoUri);

    const users = await userModel.find({ role: 0 }).limit(2);

    testUser1 = users[0];
    testUser2 = users[1];

    // valid token for user 1
    validTokenUser1 = jwt.sign(
      { _id: testUser1._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // choose any product, then make an one order each for user 1 and user2
    const testProduct = await productModel.findOne({ quantity: { $gte: 1 } });
    if (!testProduct) {
      throw new Error('No product found in sample data');
    }

    orderUser1 = await new orderModel({
      products: [testProduct._id],
      buyer: testUser1._id,
      status: 'Not Process',
      payment: {
        transaction: {
          id: 'test-transaction-1',
          amount: '100.00',
          status: 'settled'
        }
      }
    }).save();

    await new orderModel({
      products: [testProduct._id],
      buyer: testUser2._id,
      status: 'Processing',
      payment: {
        transaction: {
          id: 'test-transaction-2',
          amount: '200.00',
          status: 'settled'
        }
      }
    }).save();
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  });

  describe('JWT Tampering Attack Tests', () => {
    it('should reject a JWT token with tampered user ID in payload (without re-signing signature)', async () => {
      // user1 valid Token
      const tokenParts = validTokenUser1.split('.');

      // tamper the payload (base64) to pretend to be user 2 -> Reinsert tampered payload into original token
      // not re-signing as we won't have access to JWT SECRET  
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      payload._id = testUser2._id.toString();

      const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
 
      const tamperedToken = `${tokenParts[0]}.${tamperedPayload}.${tokenParts[2]}`;

      // access user2's orders
      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', tamperedToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should successfully access orders with a valid, untampered token', async () => {
      // user 1 valid token
      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', validTokenUser1);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const userOrders = response.body;
      expect(userOrders.length).toBeGreaterThan(0);

      // check all orders belong to user 1
      userOrders.forEach(order => {
        expect(order.buyer._id.toString()).toBe(testUser1._id.toString());
      });
    });

    it('should not return other users\' data when using user1\'s token', async () => {
      // User1 tries to access their orders with their valid token
      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', validTokenUser1);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const userOrders = response.body;

      // no user2's orders
      const hasUser2Orders = userOrders.some(
        order => order.buyer._id.toString() === testUser2._id.toString()
      );
      expect(hasUser2Orders).toBe(false);
    });

    it('should reject completely fabricated JWT token', async () => {
      // a fake token with correct user2's ID but signed with random sceret
      const fakePayload = {
        _id: testUser2._id.toString(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      };

      const fakeToken = jwt.sign(fakePayload, 'WRONG_SECRET');

      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', fakeToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject JWT token with modified header algorithm (alg: none attack)', async () => {
      // inject algorithm: none to ensure that middleware is assertive about decoding algorithm  
      const header = {
        alg: 'none',
        typ: 'JWT'
      };

      const payload = {
        _id: testUser2._id.toString(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      };

      const base64Header = Buffer.from(JSON.stringify(header))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const base64Payload = Buffer.from(JSON.stringify(payload))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const noneToken = `${base64Header}.${base64Payload}.`;

      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', noneToken);

      // Should be rejected with 401
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { _id: testUser1._id },
        process.env.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', expiredToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with missing Authorization header', async () => {
      // request with no Authorization: Bearer {JWT}
      const response = await request(app)
        .get('/api/v1/auth/orders');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject malformed JWT token (not three parts)', async () => {
      // try wrong JWT format (2 parts instead of 3, no signature)
      const malformedToken = 'header.payload';

      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', malformedToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject JWT with valid signature but non-existent user ID', async () => {
      // correct JWT secret, but inexistent user ID (very unlikely situation that hacker can get access to our JWT)
      // but this tests our referential integrity between controller and DB.  
      const fakeUserId = new mongoose.Types.ObjectId();
      const tokenWithFakeUser = jwt.sign(
        { _id: fakeUserId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/v1/auth/orders')
        .set('Authorization', tokenWithFakeUser);

        // auth middleware does not check for user existence
        // however, on the controller, if user doesn't exist, it returns empty array
        // No 404 errors to be thrown
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });


  });

  describe('Admin JWT Tampering Attack Tests', () => {
    let regularUser;
    let adminUser;
    let regularUserToken;

    beforeAll(async () => {
      regularUser = await userModel.findOne({ role: 0 });
      if (!regularUser) {
        throw new Error('No regular user found in sample data');
      }

      adminUser = await userModel.findOne({ role: 1 });
      if (!adminUser) {
        throw new Error('No admin user found in sample data');
      }

      regularUserToken = jwt.sign(
        { _id: regularUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    });

    it('should reject when regular user tampers token to use admin user ID without re-signing', async () => {
      // regular user mimics admin privileges by changing their JWT token _id to admin's _id
      const tokenParts = regularUserToken.split('.');

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      payload._id = adminUser._id.toString(); // Change to admin's ID

      const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const tamperedToken = `${tokenParts[0]}.${tamperedPayload}.${tokenParts[2]}`;

      // call admin-only endpoint
      const response = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', tamperedToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject when regular user tampers token to access all orders without re-signing', async () => {
      // Similar tampering (replace token _id with admin _id)
      const tokenParts = regularUserToken.split('.');

      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      payload._id = adminUser._id.toString(); // Change to admin's ID

      const tamperedPayload = Buffer.from(JSON.stringify(payload)).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const tamperedToken = `${tokenParts[0]}.${tamperedPayload}.${tokenParts[2]}`;

      // admin-only endpoint
      const response = await request(app)
        .get('/api/v1/auth/all-orders')
        .set('Authorization', tamperedToken);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should allow legitimate admin access with valid token', async () => {
      // happy path with proper admin token
      const validAdminToken = jwt.sign(
        { _id: adminUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/v1/auth/admin-auth')
        .set('Authorization', validAdminToken);

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });
});

