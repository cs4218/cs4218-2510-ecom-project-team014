import request from 'supertest';
import express from 'express';
import productRoutes from '../../routes/productRoutes.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import productModel from '../../models/productModel.js';
import { populateData } from '../../sample_data/populate_db.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/v1/product', productRoutes);

let mongod;
let sampleProducts;

describe('NoSql injection tests for search endpoint', () => {
  beforeAll(async () => {
    // memory mongo db
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);

    // sample data from json
    await populateData(mongoUri);

    sampleProducts = await productModel.find({}).select('-photo').limit(3);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  });

  describe('NoSQL injection tests', () => {
    it('should handle normal search queries correctly', async () => {
      // happy path
      const searchKeyword = sampleProducts[0].name;
      const response = await request(app)
        .get(`/api/v1/product/search/${searchKeyword}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain(searchKeyword);
    });

    it('should reject NoSQL injection attempt using $ne operator in URL', async () => {
      // try to get all products
      const payload = encodeURIComponent('{"$ne":""}');
      const response = await request(app)
        .get(`/api/v1/product/search/${payload}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should reject NoSQL injection attempt using $regex with malicious pattern', async () => {
      // Attempt to use $regex injection to match everything
      const payload = encodeURIComponent('{"$regex":".*"}');
      const response = await request(app)
        .get(`/api/v1/product/search/${payload}`);

      // Should treat it as a literal string search
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should not return all products
      expect(response.body.length).toBe(0);
    });

    it('should reject NoSQL injection using $where operator', async () => {
      const payload = encodeURIComponent('{"$where":"this.price > 0"}');
      const response = await request(app)
        .get(`/api/v1/product/search/${payload}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should not return all products with price > 0
      expect(response.body.length).toBe(0);
    });

    it('should reject NoSQL injection attempting to access other collections', async () => {
      // aggregation pipeline on users collection 
      const payload = encodeURIComponent('{"$lookup":{"from":"users"}}');
      const response = await request(app)
        .get(`/api/v1/product/search/${payload}`);

      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should reject NoSQL injection using $gt operator to bypass filters (if any)', async () => {
      const payload = encodeURIComponent('{"$gt":""}');
      const response = await request(app)
        .get(`/api/v1/product/search/${payload}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // not return anything
      expect(response.body.length).toBe(0);
    });

    it('should reject injection attempt with $or operator', async () => {
      const payload = encodeURIComponent('{"$or":[{"price":{"$gt":0}}]}');
      const response = await request(app)
        .get(`/api/v1/product/search/${payload}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should handle regex special characters safely', async () => {
      // Test regex special characters that could be used for injection
      const specialChars = ['.*', '.+', '^.*$', '.*|.*', '(.*)', '[a-z]*'];

      for (const char of specialChars) {
        console.log("regex char is ", char)
        const response = await request(app)
          .get(`/api/v1/product/search/${encodeURIComponent(char)}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        // regex should be treated as literal "*" etc. so no results
        expect(response.body.length).toBe(0);
      }
    });

    it('should not allow JavaScript code execution through search', async () => {
      const jsPayloads = [
        'function(){return true}',
        '${this.price}',
        'this.constructor.constructor("return process")()',
        '"; return true; var x="'
      ];

      for (const payload of jsPayloads) {
        const response = await request(app)
          .get(`/api/v1/product/search/${encodeURIComponent(payload)}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        // JS should be treated as literal string, so no results.
        expect(response.body.length).toBe(0);
      }
    });

    it('should handle ReDoS (Regular Expression Denial of Service) patterns without hanging', async () => {
      // ReDoS patterns that cause regex search to freeze
      const redosPayloads = [
        '(a+)+$',
        '(a|a)*',
        '(a|ab)*',
        '([a-zA-Z]+)*',
        '(e+)+',
        'a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*a*b'
      ];

      for (const payload of redosPayloads) {
        const startTime = Date.now();
        const response = await request(app)
          .get(`/api/v1/product/search/${encodeURIComponent(payload)}`)
          .timeout(2000);

        const duration = Date.now() - startTime;

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        // check it did not freeze (normal query time is much lower than 2000ms in test environment)
        expect(duration).toBeLessThan(2000);
      }
    });
  });
});
