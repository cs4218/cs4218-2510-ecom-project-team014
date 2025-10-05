import { registerController } from './authController';
import { loginController } from './authController';
import { forgotPasswordController } from './authController';
import { testController } from './authController';
import userModel from './../models/userModel';
import { hashPassword } from './../helpers/authHelper';
import { comparePassword } from './../helpers/authHelper';
import JWT from 'jsonwebtoken';

jest.mock('./../models/userModel');
jest.mock('./../helpers/authHelper');
jest.mock('jsonwebtoken');

// UNIT TEST FOR REGISTER CONTROLLER
describe('registerController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        name: "John",
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
        address: "123 Street",
        answer: "Football",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should create new user and respond success given valid input', async () => {
    userModel.findOne.mockResolvedValue(null);
    hashPassword.mockResolvedValue('hashedpass');

    const saveMock = jest.fn().mockResolvedValue(true);
    userModel.mockImplementation(() => ({ save: saveMock }));

    await registerController(req, res);

    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'User Register Successfully',
      user: expect.anything(),
    }));
  });

  it('should return error if name is missing', async () => {
    req.body.name = ""; 

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Name is Required' });
  });

  it('should return error if email is missing', async () => {
    req.body.email = ""; 

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Email is Required' });
  });

  it('should return error if password is missing', async () => {
    req.body.password = "";

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Password is Required' });
  });

  it('should return error if phone is missing', async () => {
    req.body.phone = "";

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Phone no is Required' });
  });

  it('should return error if address is missing', async () => {
    req.body.address = "";

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Address is Required' });
  });

  it('should return error if answer is missing', async () => {
    req.body.answer = "";

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Answer is Required' });
  });

  it('should return failure if user already exists', async () => {
    userModel.findOne.mockResolvedValue(true);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Already Register please login',
    });
  });

  it('should handle exceptions and respond with 500', async () => {
    userModel.findOne.mockImplementation(() => { throw new Error('DB error'); });

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Error in Registeration',
    }));
  });

  it('should return error if name is longer than 100 characters', async () => {
    req.body.name = 'n'.repeat(101);

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Name must be less than 101 characters' });
  });

  it('should return error if email format is invalid', async () => {
    req.body.email = "invalidemail.com";

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Email format is invalid' });
  });

  it('should return error if password is too short', async () => {
    req.body.password = "12345";

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters' });
  });

  it('should return error if phone number is too long', async () => {
    req.body.phone = '1'.repeat(21);

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Phone number must not exceed 20 characters' });
  });

  it('should return error if address is too long', async () => {
    req.body.address = 'a'.repeat(151);

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Address must be less than 151 characters' });
  });

  it('should return error if answer is too long', async () => {
    req.body.answer = 'a'.repeat(51);

    await registerController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: 'Answer must be less than 51 characters' });
  });
});

// UNIT TEST FOR LOGIN CONTROLLER

describe('loginController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return failure if email is missing', async () => {
    req.body = { password: 'password123' }; // missing email only

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  it('should return failure if password is missing', async () => {
    req.body = { email: 'test@example.com' }; // missing password only

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  it('should return failure if user not found', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    userModel.findOne.mockResolvedValue(null);

    await loginController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registerd",
    });
  });

  it('should return failure if password does not match', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    userModel.findOne.mockResolvedValue({ password: 'hashedpass' });
    comparePassword.mockResolvedValue(false);

    await loginController(req, res);

    expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedpass');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Password",
    });
  });

  it('should login successfully with valid user and password', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      email: 'test@example.com',
      phone: '1234567890',
      address: '123 Street',
      role: 'user',
      password: 'hashedpass',
    };
    userModel.findOne.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(true);
    JWT.sign.mockReturnValue('mocktoken');

    await loginController(req, res);

    expect(comparePassword).toHaveBeenCalledWith('password123', 'hashedpass');
    expect(JWT.sign).toHaveBeenCalledWith({ _id: 'user123' }, process.env.JWT_SECRET, { expiresIn: "7d" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "login successfully",
      user: {
        _id: 'user123',
        name: 'John Doe',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Street',
        role: 'user',
      },
      token: 'mocktoken',
    });
  });

  it('should catch and handle errors, sending 500', async () => {
    req.body = { email: 'test@example.com', password: 'password123' };
    userModel.findOne.mockImplementation(() => {
      throw new Error('DB error');
    });

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: "Error in login",
      error: expect.any(Error),
    }));
  });
});

// UNIT TEST FOR FORGETPASSWORDCONTROLLER

describe('forgotPasswordController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    req.body = { answer: 'myAnswer', newPassword: 'newPass123' };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Emai is required" });
  });

  it('should return 400 if answer is missing', async () => {
    req.body = { email: 'test@example.com', newPassword: 'newPass123' };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "answer is required" });
  });

  it('should return 400 if newPassword is missing', async () => {
    req.body = { email: 'test@example.com', answer: 'myAnswer' };

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
  });

  it('should return error if newPassword is less than 6 characters', async () => {
    req.body = { email: 'test@example.com', answer: 'wrongAnswer', newPassword: 'short' };
  
    await forgotPasswordController(req, res);

    expect(res.send).toHaveBeenCalledWith({ message: "New password must be at least 6 characters" });
  })

  it('should return 404 if user with email and answer not found', async () => {
    req.body = { email: 'test@example.com', answer: 'wrongAnswer', newPassword: 'newPass123' };
    userModel.findOne.mockResolvedValue(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com', answer: 'wrongAnswer' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong Email Or Answer",
    });
  });

  it('should reset password successfully', async () => {
    req.body = { email: 'test@example.com', answer: 'correctAnswer', newPassword: 'newPass123' };
    const mockUser = { _id: 'user123', email: 'test@example.com' };
    userModel.findOne.mockResolvedValue(mockUser);
    hashPassword.mockResolvedValue('hashedPass');
    userModel.findByIdAndUpdate.mockResolvedValue(true);

    await forgotPasswordController(req, res);

    expect(hashPassword).toHaveBeenCalledWith('newPass123');
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { password: 'hashedPass' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });
  });

  it('should handle errors gracefully by returning 500', async () => {
    req.body = { email: 'test@example.com', answer: 'correctAnswer', newPassword: 'newPass123' };
    userModel.findOne.mockImplementation(() => { throw new Error('DB error'); });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: "Something went wrong",
    }));
  });

});

// UNIT TEST FOR TESTCONTROLLER

describe('testController Unit Tests', () => {
  it('should send "Protected Routes" response', () => {
  const createResponse = () => {
    const res = {};
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };
    const req = {};
    const res = createResponse();

    testController(req, res);

    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  it('should call catch block when res.send throws error', () => {
    const req = {};
    const res = {
      send: jest.fn(() => {
        throw new Error('Test error');
      }),
    };

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => testController(req, res)).toThrow('Test error');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});