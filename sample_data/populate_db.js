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
import bcrypt from "bcrypt";

configDotenv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const loadJSONFile = (filename) => {
  const filePath = path.join(__dirname, filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log("Error hashing password:", error);
    throw error;
  }
};

// Function to convert MongoDB extended JSON format
export const convertMongoId = (obj) => {
  if (obj && obj.$oid) return new mongoose.Types.ObjectId(obj.$oid);
  return obj;
};

export const convertDate = (obj) => {
  if (obj && obj.$date) return new Date(obj.$date);
  return obj;
};

export const processDocument = (doc) => {
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
    } else if (key === 'photo' && value && value.data && value.data.$binary) {
      processed[key] = {
        data: Buffer.from(value.data.$binary.base64, 'base64'),
        contentType: value.contentType || 'image/jpeg'
      };
    } else {
      processed[key] = value;
    }
  }
  return processed;
};

export const populateData = async (mongoUri = null) => {
  try {
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log("Connected to test database");
    } else {
      await connectDB();
    }

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
    const hashedPassword = await hashPassword("password");
    console.log("  - Generated bcrypt hash for password: 'password'");

    // Process users and replace their passwords with the new hash
    const processedUsers = await Promise.all(users.map(async (user) => {
      const processed = processDocument(user);
      // Replace the password with our hashed version
      processed.password = hashedPassword;
      return processed;
    }));

    const insertedUsers = await userModel.insertMany(processedUsers, { ordered: false, rawResult: false });
    console.log(`✓ Inserted ${insertedUsers.length} users with password: 'password'`);

    // Load and insert products
    console.log("\n3. Loading products...");
    const products = loadJSONFile('test.products.json');
    const processedProducts = products.map(processDocument);

    let insertedProducts = [];
    try {
      insertedProducts = await productModel.insertMany(processedProducts, { ordered: false });
      console.log(`✓ Inserted ${insertedProducts.length} products`);
    } catch (error) {
      console.log("Error inserting products:", error.message);
      // Try to insert one by one to identify problematic documents
      if (error.writeErrors) {
        console.log(`Failed to insert ${error.writeErrors.length} products`);
        error.writeErrors.forEach((err, idx) => {
          if (idx < 3) { // Show first 3 errors only
            console.log(`  - Error at index ${err.index}: ${err.errmsg}`);
          }
        });
      }
      // Count successful inserts
      if (error.insertedDocs) {
        insertedProducts = error.insertedDocs;
        console.log(`✓ Successfully inserted ${insertedProducts.length} products despite errors`);
      }
    }

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

    return {
      categoriesCount: insertedCategories.length,
      usersCount: insertedUsers.length,
      productsCount: insertedProducts.length,
      ordersCount: insertedOrders.length
    };
  } catch (error) {
    console.error("\n❌ Error populating database:", error);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  populateData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}