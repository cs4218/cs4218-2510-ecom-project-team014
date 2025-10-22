import mongoose from "mongoose";
import userModel from "../../../models/userModel.js";
import request from "supertest";
import app from "../../../app.js"; 
import dotenv from "dotenv";
import { jest } from '@jest/globals';

dotenv.config();

jest.setTimeout(30000); // 30 seconds for all tests in this file

describe("Auth Controllers Integration Tests", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await userModel.deleteMany({ email: /@testwxc\.com$/ });
  });

  describe("registerController - /api/v1/auth/register", () => {
    it("registers a new user successfully", async () => {
      const userPayload = {
        name: "Test User",
        email: `user${Date.now()}@testwxc.com`,
        password: "password123",
        phone: "1234567890",
        address: "123 Test St",
        answer: "myAnswer",
      };

      const res = await request(app).post("/api/v1/auth/register").send(userPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(userPayload.email);

      const userInDb = await userModel.findOne({ email: userPayload.email });
      expect(userInDb).not.toBeNull();
    });

    it("returns error if required fields are missing", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({ email: "missing@testwxc.com" });
      expect(res.body.message).toBe("Name is Required");
    });

    it("rejects registration if user already exists", async () => {
      const email = `duplicate@testwxc.com`;
      await request(app).post("/api/v1/auth/register").send({
        name: "First User",
        email,
        password: "password123",
        phone: "1234567890",
        address: "123 Test St",
        answer: "My pet",
      });

      const res2 = await request(app).post("/api/v1/auth/register").send({
        name: "Second User",
        email,
        password: "password123",
        phone: "0987654321",
        address: "345 Another St",
        answer: "My pet",
      });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toBe("Already Register please login");
    });
  });

  describe("loginController - /api/v1/auth/login", () => {
    const userData = {
      name: "Login User",
      email: `loginuser${Date.now()}@testwxc.com`,
      password: "password123",
      phone: "1234567890",
      address: "123 Login St",
      answer: "answer",
    };

    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send(userData);
    });

    it("logs in successfully with correct credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(userData.email);
    });

    it("fails login with wrong email", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@testwxc.com",
        password: userData.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Email is not registerd");
    });

    it("fails login with wrong password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: userData.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid Password");
    });
  });

  describe("forgotPasswordController - /api/v1/auth/forgot-password", () => {
    const userData = {
      name: "Forgot User",
      email: `forgotuser${Date.now()}@testwxc.com`,
      password: "password123",
      phone: "1234567890",
      address: "123 Forgot St",
      answer: "correctAnswer",
    };

    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send(userData);
    });

    it("resets password successfully with valid data", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: userData.email,
        answer: userData.answer,
        newPassword: "newPassword123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password Reset Successfully");
    });

    it("returns error for missing fields", async () => {
      let res = await request(app).post("/api/v1/auth/forgot-password").send({
        answer: "answer",
        newPassword: "newPassword",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Emai is required");

      res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: userData.email,
        newPassword: "newPassword",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("answer is required");

      res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: userData.email,
        answer: userData.answer,
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("New Password is required");
    });

    it("returns error when new password is shorter than 6 chars", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: userData.email,
        answer: userData.answer,
        newPassword: "short",
      });
      expect(res.body.message).toBe("New password must be at least 6 characters");
    });

    it("returns error if email or answer is wrong", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: userData.email,
        answer: "wrongAnswer",
        newPassword: "newPassword123",
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Wrong Email Or Answer");
    });
  });

});

// Above tests are generated with the help of AI