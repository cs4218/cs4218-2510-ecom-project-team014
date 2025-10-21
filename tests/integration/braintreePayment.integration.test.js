import request from 'supertest';
import express from 'express';
import productRoutes from '../../routes/productRoutes.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import productModel from '../../models/productModel.js';
import userModel from '../../models/userModel.js';
import orderModel from '../../models/orderModel.js';
import jwt from 'jsonwebtoken';
import { populateData } from '../../sample_data/populate_db.js';

// Load environment variables
dotenv.config();

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/product', productRoutes);

let mongod;
let testUser;
let testProducts;
let authToken;
let initialQuantities;

describe('Braintree Payment Controller Integration Tests', () => {
  beforeAll(async () => {
    // check credentials in env
    if (!process.env.BRAINTREE_MERCHANT_ID ||
        !process.env.BRAINTREE_PUBLIC_KEY ||
        !process.env.BRAINTREE_PRIVATE_KEY ||
        !process.env.JWT_SECRET) {
      throw new Error('Braintree credentials not found in environment variables');
    }

    // launch in-memory DB
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);

    // populate sample data
    await populateData(mongoUri);

    // we use a non-admin user for these tests
    testUser = await userModel.findOne({ role: 0 });
    if (!testUser) {
      throw new Error('No regular user found in sample data');
    }

    // create jwt for request auth header
    authToken = jwt.sign({ _id: testUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    testProducts = await productModel.find({ quantity: { $gte: 10 } }).limit(3);
    if (testProducts.length < 3) {
      throw new Error('Not enough products with sufficient quantity in sample data');
    }

    // record initial quantities for matching and resetting later on
    initialQuantities = testProducts.map(p => p.quantity);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  });

  beforeEach(async () => {
    // reset product quantites before each payment test
    for (let i = 0; i < testProducts.length; i++) {
      await productModel.updateOne(
        { _id: testProducts[i]._id },
        { quantity: initialQuantities[i] }
      );
    }

    // remove all of this user's orders (to start clean)
    await orderModel.deleteMany({ buyer: testUser._id });
  });

  describe('POST /api/v1/product/braintree/payment', () => {
    const VISA_NONCE = 'fake-valid-nonce';
    const MASTERCARD_NONCE = 'fake-valid-mastercard-nonce';
    const DISCOVER_NONCE = 'fake-valid-discover-nonce';
    const AMEX_NONCE = 'fake-valid-amex-nonce';
    const PAYPAL_NONCE = 'fake-paypal-billing-agreement-nonce';
    const DECLINED_NONCE = 'fake-processor-declined-visa-nonce';

    it('should successfully process payment with Visa card (fake-valid-nonce)', async () => {
      // get correct price from DB
      const dbProduct0 = await productModel.findById(testProducts[0]._id);

      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct0.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[0]._id.toString());

      // check inventory decremented
      const product = await productModel.findById(testProducts[0]._id);
      expect(product.quantity).toBe(initialQuantities[0] - 1);
    }, 30000);

    it('should successfully process payment with MasterCard (fake-valid-mastercard-nonce)', async () => {
      // get correct price from DB
      const dbProduct1 = await productModel.findById(testProducts[1]._id);

      const cart = [
        {
          _id: testProducts[1]._id.toString(),
          quantity: 2,
          price: dbProduct1.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: MASTERCARD_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[1]._id.toString());

      // check inventory decremented
      const product = await productModel.findById(testProducts[1]._id);
      expect(product.quantity).toBe(initialQuantities[1] - 2);
    }, 30000);

    it('should successfully process payment with Discover card', async () => {
      // get correct price from DB
      const dbProduct2 = await productModel.findById(testProducts[2]._id);

      const cart = [
        {
          _id: testProducts[2]._id.toString(),
          quantity: 1,
          price: dbProduct2.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: DISCOVER_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[2]._id.toString());

      // check inventory decremented
      const product = await productModel.findById(testProducts[2]._id);
      expect(product.quantity).toBe(initialQuantities[2] - 1);
    }, 30000);

    it('should successfully process payment with American Express', async () => {
      // get correct price from DB
      const dbProduct0 = await productModel.findById(testProducts[0]._id);

      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct0.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: AMEX_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[0]._id.toString());

      // check inventory decremented
      const product = await productModel.findById(testProducts[0]._id);
      expect(product.quantity).toBe(initialQuantities[0] - 1);
    }, 30000);

    it('should successfully process payment with PayPal (fake-paypal-billing-agreement-nonce)', async () => {
      // get correct price from DBs
      const dbProduct0 = await productModel.findById(testProducts[0]._id);
      const dbProduct1 = await productModel.findById(testProducts[1]._id);

      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct0.price // Correct price from DB
        },
        {
          _id: testProducts[1]._id.toString(),
          quantity: 2,
          price: dbProduct1.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: PAYPAL_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check correct product IDs in order
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(2);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[0]._id.toString());
      expect(orders[0].products[1]._id.toString()).toBe(testProducts[1]._id.toString());

      // check both products decremented correctly
      const product0 = await productModel.findById(testProducts[0]._id);
      const product1 = await productModel.findById(testProducts[1]._id);
      expect(product0.quantity).toBe(initialQuantities[0] - 1);
      expect(product1.quantity).toBe(initialQuantities[1] - 2);
    }, 30000);

    it('should handle declined payment correctly (fake-processor-declined-visa-nonce)', async () => {
      // get correct price from DB
      const dbProduct0 = await productModel.findById(testProducts[0]._id);

      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct0.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: DECLINED_NONCE,
          cart: cart
        });

      expect(response.status).toBe(500);

      // check no order created
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(0);

      // check no change in quantities
      const product = await productModel.findById(testProducts[0]._id);
      expect(product.quantity).toBe(initialQuantities[0]);
    }, 30000);

    it('should reject payment when client sends tampered price (security test)', async () => {
      // malicious client sends low price for expensive product
      const dbProduct = await productModel.findById(testProducts[0]._id);
      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: 1.00 // Tampered price
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      // reject payment
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('Price mismatch');
      expect(response.body.message).toContain(dbProduct.price.toString());

      // check no order created
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(0);

      // check no quantitiy decremented
      const product = await productModel.findById(testProducts[0]._id);
      expect(product.quantity).toBe(initialQuantities[0]);
    }, 30000);

    it('should accept payment when client sends correct price matching DB', async () => {
      // get correct price from DB
      const dbProduct = await productModel.findById(testProducts[0]._id);
      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct.price // Correct price
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[0]._id.toString());

      // check inventory decremented
      const product = await productModel.findById(testProducts[0]._id);
      expect(product.quantity).toBe(initialQuantities[0] - 1);
    }, 30000);

    it('should handle multiple items in cart with correct total calculation', async () => {
      // get correct price from DBs
      const dbProduct0 = await productModel.findById(testProducts[0]._id);
      const dbProduct1 = await productModel.findById(testProducts[1]._id);

      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct0.price // Correct price from DB
        },
        {
          _id: testProducts[1]._id.toString(),
          quantity: 3,
          price: dbProduct1.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // expected transaction amount
      const product0 = await productModel.findById(testProducts[0]._id);
      const product1 = await productModel.findById(testProducts[1]._id);
      const expectedTotal = product0.price * 1 + product1.price * 3;

      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(2);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[0]._id.toString());
      expect(orders[0].products[1]._id.toString()).toBe(testProducts[1]._id.toString());
      expect(parseFloat(orders[0].payment.transaction.amount)).toBeCloseTo(expectedTotal, 2);

      // check inventory decrements
      const product0After = await productModel.findById(testProducts[0]._id);
      const product1After = await productModel.findById(testProducts[1]._id);
      expect(product0After.quantity).toBe(initialQuantities[0] - 1);
      expect(product1After.quantity).toBe(initialQuantities[1] - 3);
    }, 30000);

    it('should reject payment when product is out of stock', async () => {
      // get correct price from DB
      const dbProduct2 = await productModel.findById(testProducts[2]._id);

      // client requests more than stock
      const cart = [
        {
          _id: testProducts[2]._id.toString(),
          quantity: initialQuantities[2] + 10, // More than available
          price: dbProduct2.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('Insufficient stock');

      // check no order was created
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(0);

      // check no stock decrement
      const product = await productModel.findById(testProducts[2]._id);
      expect(product.quantity).toBe(initialQuantities[2]);
    });

    it('should reject payment when product does not exist', async () => {
      const fakeProductId = new mongoose.Types.ObjectId();
      const cart = [
        {
          _id: fakeProductId.toString(),
          quantity: 1,
          price: 99.99
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('not found');

      // check no order
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(0);
    });

    it('should reject payment with empty cart', async () => {
      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: []
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('No items in cart');
    });

    it('should reject payment without authentication', async () => {
      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: 999.99
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        // No Authorization header
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(401);
    });

    it('should handle concurrent payments correctly (race condition test)', async () => {
      // get correct price from DB
      const dbProduct2 = await productModel.findById(testProducts[2]._id);

      // Set product quantity to exactly 5
      await productModel.updateOne(
        { _id: testProducts[2]._id },
        { quantity: 5 }
      );

      const cart = [
        {
          _id: testProducts[2]._id.toString(),
          quantity: 3,
          price: dbProduct2.price // Correct price from DB
        }
      ];

      // Make two concurrent payment requests on the same product
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/v1/product/braintree/payment')
          .set('Authorization', authToken)
          .send({ nonce: VISA_NONCE, cart: cart }),
        request(app)
          .post('/api/v1/product/braintree/payment')
          .set('Authorization', authToken)
          .send({ nonce: MASTERCARD_NONCE, cart: cart })
      ]);

      // With proper stock checking, only ONE should succeed
      const successCount = [response1, response2].filter(r => r.status === 200).length;

      // Assert correct behavior: exactly one payment should succeed
      expect(successCount).toBe(1);

      // One request should succeed (200), one should fail (400 - insufficient stock)
      const failCount = [response1, response2].filter(r => r.status === 400).length;
      expect(failCount).toBe(1);

      // Verify inventory is correct: 5 - 3 = 2
      const product = await productModel.findById(testProducts[2]._id);
      expect(product.quantity).toBe(2);
    }, 40000);

    it('should handle payment with quantity defaulting to 1 when not specified', async () => {
      // get correct price from DB
      const dbProduct1 = await productModel.findById(testProducts[1]._id);

      const cart = [
        {
          _id: testProducts[1]._id.toString(),
          // quantity not specified, should default to 1
          price: dbProduct1.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[1]._id.toString());

      // check inventory decremented by 1
      const product = await productModel.findById(testProducts[1]._id);
      expect(product.quantity).toBe(initialQuantities[1] - 1);
    }, 30000);

    it('should process payment and store correct payment details in order', async () => {
      // get correct price from DB
      const dbProduct0 = await productModel.findById(testProducts[0]._id);

      const cart = [
        {
          _id: testProducts[0]._id.toString(),
          quantity: 1,
          price: dbProduct0.price // Correct price from DB
        }
      ];

      const response = await request(app)
        .post('/api/v1/product/braintree/payment')
        .set('Authorization', authToken)
        .send({
          nonce: VISA_NONCE,
          cart: cart
        });

      expect(response.status).toBe(200);

      // check that order is created with the right product
      const orders = await orderModel.find({ buyer: testUser._id });
      expect(orders.length).toBe(1);
      expect(orders[0].products).toHaveLength(1);
      expect(orders[0].products[0]._id.toString()).toBe(testProducts[0]._id.toString());

      // check braintree payment details in the order
      const paymentData = orders[0].payment;
      expect(paymentData).toHaveProperty('success', true);
      expect(paymentData).toHaveProperty('transaction');
      expect(paymentData.transaction).toHaveProperty('id');
      expect(paymentData.transaction).toHaveProperty('amount');
      expect(paymentData.transaction.status).toBe('submitted_for_settlement');

      // check inventory decremented
      const product = await productModel.findById(testProducts[0]._id);
      expect(product.quantity).toBe(initialQuantities[0] - 1);
    }, 30000);
  });
});

// LLMs were used to proofread, debug and fix test cases.
