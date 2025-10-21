import { requireSignIn, isAdmin } from '../../../middlewares/authMiddleware.js';
import JWT from 'jsonwebtoken';
import userModel from '../../../models/userModel.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { jest } from '@jest/globals';

dotenv.config();

describe('authMiddleware integration', () => {
  let testUserId;
  let testAdminJWT;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL);

    // Clean up any existing test admin user with this email to prevent duplicates
    await userModel.deleteOne({ email: 'testadminwxc@example.com' });

    const testUser = await userModel.create({
      name: 'Test Admin',
      email: 'testadminwxc@example.com',
      phone: '123456789',
      role: 1,
      password: 'anyhashedvalue',
      answer: 'dummy',
      address: 'dummy',
    });

    testUserId = testUser._id;

    testAdminJWT = JWT.sign({ _id: testUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await userModel.deleteOne({ _id: testUserId });
    await mongoose.disconnect();
  });

  it('requireSignIn calls next with valid JWT token', async () => {
    const req = { headers: { authorization: testAdminJWT } };
    const res = {};
    const next = jest.fn();

    await requireSignIn(req, res, next);

    expect(req.user._id.toString()).toBe(testUserId.toString());
    expect(next).toHaveBeenCalled();
  });

  it('requireSignIn does not call next with invalid token', async () => {
    const req = { headers: { authorization: 'badtoken' } };
    const res = {};
    const next = jest.fn();

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('isAdmin calls next if user role is admin', async () => {
    const req = { user: { _id: testUserId } };
    const res = {};
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('isAdmin rejects non-admin user', async () => {
    // Use unique email to avoid duplicate key error
    const uniqueEmail = `nonadminwxc_${Date.now()}@example.com`;

    const nonAdmin = await userModel.create({
      name: 'Non-Admin',
      email: uniqueEmail,
      phone: '987654321',
      role: 0,
      password: 'anyhashedvalue',
      answer: 'dummy',
      address: 'dummy',
    });

    const req = { user: { _id: nonAdmin._id } };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn()
    };
    const next = jest.fn();

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'UnAuthorized Access' }));
    expect(next).not.toHaveBeenCalled();

    await userModel.deleteOne({ _id: nonAdmin._id });
  });
});
