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

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Name must be less than 101 characters' });
  });

  it('should return error if email format is invalid', async () => {
    req.body.email = "invalidemail.com";

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Email format is invalid' });
  });

  it('should return error if password is too short', async () => {
    req.body.password = "12345";

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Password must be at least 6 characters' });
  });

  it('should return error if phone number is too long', async () => {
    req.body.phone = '1'.repeat(21);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Phone number must not exceed 20 characters' });
  });

  it('should return error if address is too long', async () => {
    req.body.address = 'a'.repeat(151);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Address must be less than 151 characters' });
  });

  it('should return error if answer is too long', async () => {
    req.body.answer = 'a'.repeat(51);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Answer must be less than 51 characters' });
  });
});
