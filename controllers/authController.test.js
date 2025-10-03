import { registerController } from './authController';
import userModel from './../models/userModel';
import { hashPassword } from './../helpers/authHelper';

jest.mock('./../models/userModel');
jest.mock('./../helpers/authHelper');

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

    expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
  });

  it('should return error if email is missing', async () => {
    req.body.email = ""; // Clear email to test missing field.

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
});
