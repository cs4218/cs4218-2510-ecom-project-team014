import { hashPassword, comparePassword } from '../../../helpers/authHelper';

describe('authHelper integration', () => {
  it('should return a hashed password string for a given password', async () => {
    const password = 'integrationTestPassword!2025';
    const hashed = await hashPassword(password);

    expect(hashed).toBeDefined();
    expect(typeof hashed).toBe('string');
    expect(hashed).not.toBe(password);
  });

  it('comparePassword should return true for correct password', async () => {
    const password = 'integrationTestPassword!2025';
    const hashed = await hashPassword(password);

    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);
  });

  it('comparePassword should return false for incorrect password', async () => {
    const password = 'integrationTestPassword!2025';
    const hashed = await hashPassword(password);

    const isMatch = await comparePassword('wrongPassword', hashed);
    expect(isMatch).toBe(false);
  });
});

// Above tests are generated with the help of AI