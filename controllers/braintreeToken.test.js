import { jest } from '@jest/globals';

const mockGenerate = jest.fn();

// Mock the braintree module
jest.unstable_mockModule('braintree', () => ({
  default: {
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      clientToken: {
        generate: mockGenerate
      }
    })),
    Environment: {
      Sandbox: 'sandbox'
    }
  }
}));

// Mock dotenv
jest.unstable_mockModule('dotenv', () => ({
  default: {
    config: jest.fn()
  }
}));

// Import the controller AFTER setting up mocks
const { braintreeTokenController } = await import('./productController.js');

describe('braintreeTokenController', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Reset mocks
    mockGenerate.mockReset();
  });

  it('should generate and send client token on success', async () => {
    const mockToken = { clientToken: 'test_token_123' };
    mockGenerate.mockImplementation((options, callback) => {
      callback(null, mockToken);
    });

    await braintreeTokenController(req, res);

    expect(mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
    expect(res.send).toHaveBeenCalledWith(mockToken);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should handle gateway errors and return 500 status', async () => {
    const mockError = new Error('Gateway connection failed');
    mockGenerate.mockImplementation((options, callback) => {
      callback(mockError, null);
    });

    await braintreeTokenController(req, res);

    expect(mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  it('should handle callback with both error and response gracefully (by propagating the error)', async () => {
    const mockToken = { clientToken: 'test_token_456' };
    const mockError = new Error('Some error');

    mockGenerate.mockImplementation((options, callback) => {
      callback(mockError, mockToken);
    });

    await braintreeTokenController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  it('should pass empty options object to gateway generate function', async () => {
    mockGenerate.mockImplementation((options, callback) => {
      expect(options).toEqual({});
      callback(null, { clientToken: 'token' });
    });

    await braintreeTokenController(req, res);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});