import request from 'supertest';
import express from 'express';
import productRoutes from '../../routes/productRoutes.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/product', productRoutes);

let mongod;

describe('Braintree Token Controller Integration Tests', () => {
  beforeAll(async () => {
    // check environment
    if (!process.env.BRAINTREE_MERCHANT_ID ||
        !process.env.BRAINTREE_PUBLIC_KEY ||
        !process.env.BRAINTREE_PRIVATE_KEY) {
      throw new Error('Braintree credentials not found in environment variables');
    }
  }, 30000);

  describe('GET /api/v1/product/braintree/token', () => {
    it('should successfully generate a client token from Braintree API', async () => {
      const response = await request(app)
        .get('/api/v1/product/braintree/token')
        .expect(200);

      // check response structure
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('clientToken');

      // check non-null token
      expect(typeof response.body.clientToken).toBe('string');
      expect(response.body.clientToken.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens on subsequent calls', async () => {
      const response1 = await request(app)
        .get('/api/v1/product/braintree/token')
        .expect(200);

      const response2 = await request(app)
        .get('/api/v1/product/braintree/token')
        .expect(200);

      // check non null
      expect(response1.body.clientToken).toBeTruthy();
      expect(response2.body.clientToken).toBeTruthy();

      // check different tokens
      expect(response1.body.clientToken).not.toBe(response2.body.clientToken);
    });

    it('should generate tokens that can be decoded and contain expected structure', async () => {
      const response = await request(app)
        .get('/api/v1/product/braintree/token')
        .expect(200);

      const token = response.body.clientToken;
      
      // decode using base-64
      const decodedToken = Buffer.from(token, 'base64').toString('utf-8');

      // decoded token should be proper json
      expect(() => JSON.parse(decodedToken)).not.toThrow();

      const tokenData = JSON.parse(decodedToken);

      // check braintree token-specific fields
      expect(tokenData).toHaveProperty('authorizationFingerprint');
      expect(tokenData).toHaveProperty('version');
      expect(typeof tokenData.version).toBe('number');
      expect(typeof tokenData.authorizationFingerprint).toBe('string');
      expect(tokenData.authorizationFingerprint.length).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent token requests successfully', async () => {
      // while this does look like performance testing, the goal here is to
      // check the validity of individual tokens (and for any potential inter-request leakage)

      // 5 concurrent requests
      const promises = Array(5).fill(null).map(() =>
        request(app).get('/api/v1/product/braintree/token')
      );

      const responses = await Promise.all(promises);

      // all should be valid
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('clientToken');
        expect(response.body.clientToken).toBeTruthy();
      });

      const tokens = responses.map(r => r.body.clientToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it('should return consistent response format across multiple requests', async () => {
      const numRequests = 3;
      const responses = [];

      for (let i = 0; i < numRequests; i++) {
        const response = await request(app)
          .get('/api/v1/product/braintree/token')
          .expect(200);
        responses.push(response);
      }

      // structural check (similar to above tests but checking with concurrency)
      responses.forEach(response => {
        const keys = Object.keys(response.body);
        expect(keys).toContain('clientToken');
        expect(response.body.clientToken).toBeTruthy();
      });
    });
  });
});

// LLMs were used to proofread, debug and fix test cases.
