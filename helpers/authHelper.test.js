import { hashPassword, comparePassword } from '../helpers/authHelper';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('authHelper', () => {
  describe('hashPassword', () => {
    it('should hash the password correctly', async () => {
      const fakeHash = '$2b$10$hashstring';
      bcrypt.hash.mockResolvedValue(fakeHash);

      const result = await hashPassword('mypassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
      expect(result).toBe(fakeHash);
    });

    it('should return undefined and log error on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      bcrypt.hash.mockRejectedValue(new Error('hash error'));

      const result = await hashPassword('mypassword');

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword('mypassword', 'hashedpassword');
      expect(bcrypt.compare).toHaveBeenCalledWith('mypassword', 'hashedpassword');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword('wrongpassword', 'hashedpassword');
      expect(result).toBe(false);
    });
  });
});

// Above tests are generated with the help of AI
