import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import mongoose from "mongoose";
import fs from "fs";

export const getOrdersByUserEmail = async (email) => {
  const user = await userModel.findOne({ email });
  if (!user) return [];

  const orders = await orderModel
    .find({ buyer: user._id })
    .populate('products', 'name price description')
    .populate('buyer', 'name');

  return orders;
};

export const getUserByEmail = async (email) => {
  return await userModel.findOne({ email });
};


export const connectToTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  // Read URI from file written by server.js
  const mongoUri = fs.readFileSync('.mongo-test-uri', 'utf-8').trim();
  process.env.MONGO_URL = mongoUri;

  // Import and call connectDB
  const { default: connectDB } = await import("../../config/db.js");
  await connectDB();
};

export const closeDBConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

