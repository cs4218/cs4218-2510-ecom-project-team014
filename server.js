// server.js
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from './routes/authRoute.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import cors from "cors";
import { MongoMemoryServer } from 'mongodb-memory-server';
import { populateData } from './sample_data/populate_db.js';
import fs from 'fs';
import colors from "colors"; // if needed
import express from 'express'

dotenv.config();

if (process.env.NODE_ENV === 'test') {
  console.log('\nStarting MongoDB Memory Server for tests...');

  const mongod = await MongoMemoryServer.create();
  await mongod.ensureInstance();
  const mongoUri = mongod.getUri();

  process.env.MONGO_URL = mongoUri;

  fs.writeFileSync('.mongo-test-uri', mongoUri);

  console.log(`MongoDB Memory Server started at: ${mongoUri}`);

  await connectDB();

  console.log('\n Populating database with test data...');
  await populateData(mongoUri);
  console.log('Test database ready!\n');

  global.__MONGOD__ = mongod;
} else {
  await connectDB();
}

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// rest api

app.get('/', (req,res) => {
    res.send("<h1>Welcome to ecommerce app</h1>");
});

const PORT = process.env.PORT || 6060;

app.listen(PORT, () => {
    console.log(`Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
});
