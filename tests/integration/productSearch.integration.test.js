import request from 'supertest';
import express from 'express';
import productRoutes from '../../routes/productRoutes.js';
import { populateData } from '../../sample_data/populate_db.js';
import productModel from '../../models/productModel.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// express app since we test the routing logic as well
const app = express();
app.use(express.json());
app.use('/api/v1/product', productRoutes);

let mongod;

describe('Product Search Integration Tests', () => {
  beforeAll(async () => {
    // start in-memory DB
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();

    await mongoose.connect(mongoUri);

    // populate in-memory DB with sameple data
    await populateData(mongoUri);
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  });

  describe('GET /api/v1/product/search/:keyword', () => {
    it('should return all matching products from sample data', async () => {
      // doesn't actually test the search controller, but only asserts that our sample data has all the documents needed for this test suite
      const allProducts = await productModel.find({}).select('-photo');
      expect(allProducts.length).toBeGreaterThan(0);

      // check that all the documents used in this test suite exists in DB
      const productNames = allProducts.map(p => p.name);
      expect(productNames).toContain('Laptop');
      expect(productNames).toContain('Smartphone');
      expect(productNames).toContain('Textbook');
      expect(productNames).toContain('Novel');
    });

    it('should return products matching "laptop" in name', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/laptop')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].name).toBe('Laptop');
      expect(response.body[0].description).toBe('A powerful laptop');
      expect(response.body[0]).not.toHaveProperty('photo');
    });

    it('should return products matching "smartphone" in name', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/smartphone')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const names = response.body.map(p => p.name);
      expect(names).toContain('Smartphone');
      expect(response.body[0].description).toBe('A high-end smartphone');
    });

    it('should return products matching "textbook" in name', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/textbook')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].name).toBe('Textbook');
      expect(response.body[0].description).toBe('A comprehensive textbook');
    });

    it('should return products matching keyword in description', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/bestselling')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const allMatch = response.body.every(
        p => p.description.toLowerCase().includes('bestselling') || p.name.toLowerCase().includes('bestselling')
      );
      expect(allMatch).toBe(true);
    });

    it('should return products matching "Singapore" in description', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/singapore')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const product = response.body.find(
        p => p.name === 'The Law of Contract in Singapore'
      );
      expect(product).toBeDefined();
      expect(product.description).toBe('A bestselling book in Singapore');
    });

    it('should return multiple products matching "book"', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/book')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      const names = response.body.map(p => p.name);
      expect(names).toContain('Textbook');
    });

    it('should be case-insensitive when searching', async () => {
      const response1 = await request(app)
        .get('/api/v1/product/search/LAPTOP')
        .expect(200);

      const response2 = await request(app)
        .get('/api/v1/product/search/laptop')
        .expect(200);

      expect(response1.body).toHaveLength(response2.body.length);
      if (response1.body.length > 0) {
        expect(response1.body[0].name).toBe(response2.body[0].name);
      }
    });

    it('should return empty array when no products match', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/nonexistentproductxyz123')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should return empty array for whitespace-only keyword', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/%20%20%20')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(0);
    });

    it('should trim whitespace from keyword before searching', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/  laptop  ')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].name).toBe('Laptop');
    });

    it('should search in both name and description fields', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/novel')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const hasMatch = response.body.every(
        p => p.name.toLowerCase().includes('novel') ||
             p.description.toLowerCase().includes('novel')
      );
      expect(hasMatch).toBe(true);
    });

    it('should not include photo data in response', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/laptop')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      if (response.body.length > 0) {
        expect(response.body[0]).not.toHaveProperty('photo');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('description');
        expect(response.body[0]).toHaveProperty('price');
      }
    });

    it('should return partial matches', async () => {
      const response = await request(app)
        .get('/api/v1/product/search/phone')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const names = response.body.map(p => p.name);
      expect(names).toContain('Smartphone');
    });

    it('should search for exact substring with spaces (not word-by-word)', async () => {
      // Searching "Law of" should match "The Law of Contract" (substring exists)
      const response = await request(app)
        .get('/api/v1/product/search/Law%20of')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const product = response.body.find(p => p.name === 'The Law of Contract in Singapore');
      expect(product).toBeDefined();
    });

    it('should NOT match if words are in different order', async () => {
      // "Contract Law" should NOT match "Law of Contract"
      // because regex looks for exact substring "Contract Law", not individual words
      const response = await request(app)
        .get('/api/v1/product/search/Contract%20Law')
        .expect(200);

      // This should return empty or not match "The Law of Contract in Singapore"
      const product = response.body.find(p => p.name === 'The Law of Contract in Singapore');
      expect(product).toBeUndefined();
    });

    it('should match multi-word phrase as exact substring', async () => {
      // "high-end smartphone" exists in description
      const response = await request(app)
        .get('/api/v1/product/search/high-end%20smartphone')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      const product = response.body.find(p => p.name === 'Smartphone');
      expect(product).toBeDefined();
      expect(product.description).toBe('A high-end smartphone');
    });

    it('should return the same products for same query', async () => {
      const response1 = await request(app)
        .get('/api/v1/product/search/book')
        .expect(200);

      const response2 = await request(app)
        .get('/api/v1/product/search/book')
        .expect(200);

      expect(response1.body.length).toBe(response2.body.length);

      // order doesn't matter, so we sort
      const ids1 = response1.body.map(p => p._id).sort();
      const ids2 = response2.body.map(p => p._id).sort();
      expect(ids1).toEqual(ids2);
    });

    it('should handle database errors gracefully', async () => {
      // close DB connection before request to trigger mongoose error
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/v1/product/search/laptop')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Error In Search Product API');

      // restore connection for the next test
      const mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
    });
  });
});

// LLMs were used to proofread, debug and fix test cases.
