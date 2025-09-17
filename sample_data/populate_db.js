import connectDB from "../config/db.js";
import { configDotenv } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import mongoose from "mongoose";

configDotenv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await connectDB();

const loadJSONFile = (filename) => {
  const filePath = path.join(__dirname, filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

// Function to convert MongoDB extended JSON format
const convertMongoId = (obj) => {
  if (obj && obj.$oid) return new mongoose.Types.ObjectId(obj.$oid);
  return obj;
};

const convertDate = (obj) => {
  if (obj && obj.$date) return new Date(obj.$date);
  return obj;
};

const processDocument = (doc) => {
  const processed = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') {
      processed[key] = convertMongoId(value);
    } else if (key === 'createdAt' || key === 'updatedAt') {
      processed[key] = convertDate(value);
    } else if (key === 'buyer' || key === 'category') {
      processed[key] = convertMongoId(value);
    } else if (key === 'products' && Array.isArray(value)) {
      processed[key] = value.map(p => convertMongoId(p));
    } else {
      processed[key] = value;
    }
  }
  return processed;
};

const populateData = async () => {
  try {
    console.log("Starting database population...\n");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      categoryModel.deleteMany({}),
      userModel.deleteMany({}),
      productModel.deleteMany({}),
      orderModel.deleteMany({})
    ]);

    // Load and insert categories
    console.log("\n1. Loading categories...");
    const categories = loadJSONFile('test.categories.json');
    const processedCategories = categories.map(processDocument);
    const insertedCategories = await categoryModel.insertMany(processedCategories, { ordered: false, rawResult: false });
    console.log(`✓ Inserted ${insertedCategories.length} categories`);

    // Load and insert users
    console.log("\n2. Loading users...");
    const users = loadJSONFile('test.users.json');
    const processedUsers = users.map(processDocument);
    const insertedUsers = await userModel.insertMany(processedUsers, { ordered: false, rawResult: false });
    console.log(`✓ Inserted ${insertedUsers.length} users`);

    // Load and insert products
    console.log("\n3. Loading products...");
    const products = loadJSONFile('test.products.json');
    const processedProducts = products.map(processDocument);
    const insertedProducts = await productModel.insertMany(processedProducts, { ordered: false, rawResult: false });
    console.log(`✓ Inserted ${insertedProducts.length} products`);

    // Load and insert orders
    console.log("\n4. Loading orders...");
    const orders = loadJSONFile('test.orders.json');
    const processedOrders = orders.map(processDocument);
    const insertedOrders = await orderModel.insertMany(processedOrders, { ordered: false, rawResult: false });
    console.log(`✓ Inserted ${insertedOrders.length} orders`);

    console.log("\n✅ Database population completed successfully!");
    console.log(`
Summary:
- Categories: ${insertedCategories.length}
- Users: ${insertedUsers.length}
- Products: ${insertedProducts.length}
- Orders: ${insertedOrders.length}
    `);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error populating database:", error);
    process.exit(1);
  }
};

populateData();