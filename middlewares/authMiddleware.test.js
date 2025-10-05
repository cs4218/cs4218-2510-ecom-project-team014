import { requireSignIn, isAdmin } from '../middlewares/authMiddleware';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: { authorization: 'token' } };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();

    jest.clearAllMocks();
  });

  describe('requireSignIn', () => {
    it('should decode token and call next on valid token', async () => {
      const decoded = { _id: 'userId' };
      JWT.verify.mockReturnValue(decoded);

      await requireSignIn(req, res, next);

      expect(JWT.verify).toHaveBeenCalledWith('token', process.env.JWT_SECRET);
      expect(req.user).toEqual(decoded);
      expect(next).toHaveBeenCalled();
    });

    it('should log error but not call next if verify fails', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      JWT.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      await requireSignIn(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(next).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('isAdmin', () => {
    it('should respond 401 if user role is not admin', async () => {
      req.user = { _id: 'userId' };
      userModel.findById.mockResolvedValue({ role: 0 });

      await isAdmin(req, res, next);

      expect(userModel.findById).toHaveBeenCalledWith('userId');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'UnAuthorized Access' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is admin', async () => {
      req.user = { _id: 'userId' };
      userModel.findById.mockResolvedValue({ role: 1 });

      await isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle errors with 401 response', async () => {
      req.user = { _id: 'userId' };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      userModel.findById.mockRejectedValue(new Error('DB failure'));

      await isAdmin(req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error in admin middleware' }));
      expect(next).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

// Above tests are generated with the help of AI