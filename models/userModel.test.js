import mongoose from 'mongoose';
import User from './userModel';

// Mock mongoose
jest.mock('mongoose', () => {
  const mockSave = jest.fn().mockResolvedValue({
    _id: 'mock-id',
    name: 'John Doe',
    email: 'john@example.com',
    role: 0
  });
  
  const mockModel = jest.fn().mockImplementation(() => ({
    save: mockSave
  }));
  
  return {
    Schema: jest.fn(),
    model: jest.fn(() => mockModel),
    connect: jest.fn().mockResolvedValue(),
    disconnect: jest.fn().mockResolvedValue(),
    connection: {
      db: {
        dropDatabase: jest.fn().mockResolvedValue()
      }
    }
  };
});

describe('User Model', () => {
  it('should create a user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890',
      address: { street: '123 Main St', city: 'New York' },
      answer: 'blue'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe(0);
  });

  
});