import { jest } from '@jest/globals';

const mockGenerate = jest.fn();
const mockTransactionSale = jest.fn();
const mockOrderSave = jest.fn();
const mockProductFind = jest.fn();
const mockProductBulkWrite = jest.fn();

jest.unstable_mockModule('braintree', () => ({
  default: {
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      clientToken: {
        generate: mockGenerate
      },
      transaction: {
        sale: mockTransactionSale
      }
    })),
    Environment: {
      Sandbox: 'sandbox'
    }
  }
}));

jest.unstable_mockModule('dotenv', () => ({
  default: {
    config: jest.fn()
  }
}));

jest.unstable_mockModule('../models/orderModel.js', () => ({
  default: jest.fn().mockImplementation((orderData) => ({
    ...orderData,
    save: mockOrderSave
  }))
}));

jest.unstable_mockModule('../models/productModel.js', () => ({
  default: {
    find: mockProductFind,
    bulkWrite: mockProductBulkWrite
  }
}));

const { braintreeTokenController, brainTreePaymentController } = await import('./productController.js');

describe('braintreeTokenController', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

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

describe('brainTreePaymentController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        nonce: 'payment_nonce_123',
        cart: [
          { _id: 'prod1', name: 'Product 1', price: 100, quantity: 2 },
          { _id: 'prod2', name: 'Product 2', price: 50, quantity: 1 }
        ]
      },
      user: {
        _id: 'user_123'
      }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    mockTransactionSale.mockReset();
    mockOrderSave.mockReset();
    mockProductFind.mockReset();
    mockProductBulkWrite.mockReset();

    mockProductFind.mockResolvedValue([
      { _id: { toString: () => 'prod1' }, name: 'Product 1', quantity: 10, price: 100 },
      { _id: { toString: () => 'prod2' }, name: 'Product 2', quantity: 5, price: 50 }
    ]);
  });

  it('should process payment successfully and save order', async () => {
    const mockResult = {
      success: true,
      transaction: {
        id: 'trans_123',
        amount: '250.00'
      }
    };
    mockTransactionSale.mockImplementation((options, callback) => {
      expect(options.amount).toBe(250); // 100*2 + 50*1
      expect(options.paymentMethodNonce).toBe('payment_nonce_123');
      expect(options.options.submitForSettlement).toBe(true);
      // Call callback asynchronously to simulate Braintree
      setImmediate(() => callback(null, mockResult));
    });

    await brainTreePaymentController(req, res);

    // Wait for async callback to complete
    await new Promise(resolve => setImmediate(resolve));

    expect(mockProductFind).toHaveBeenCalledWith({ _id: { $in: ['prod1', 'prod2'] } });
    expect(mockTransactionSale).toHaveBeenCalledTimes(1);
    expect(mockOrderSave).toHaveBeenCalledTimes(1);
    // BulkWrite now receives ObjectIds, not strings
    expect(mockProductBulkWrite).toHaveBeenCalled();
    const bulkWriteCall = mockProductBulkWrite.mock.calls[0][0];
    expect(bulkWriteCall).toHaveLength(2);
    expect(bulkWriteCall[0].updateOne.update).toEqual({ $inc: { quantity: -2 } });
    expect(bulkWriteCall[1].updateOne.update).toEqual({ $inc: { quantity: -1 } });
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('should handle payment failure from Braintree and not save order', async () => {
    const mockError = new Error('Payment declined');
    mockTransactionSale.mockImplementation((options, callback) => {
      callback(mockError, null);
    });

    await brainTreePaymentController(req, res);

    expect(mockTransactionSale).toHaveBeenCalledTimes(1);
    expect(mockOrderSave).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(mockError);
  });

  it('should handle null cart gracefully', async () => {
    req.body.cart = null;

    await brainTreePaymentController(req, res);

    expect(mockTransactionSale).not.toHaveBeenCalled();
    expect(mockOrderSave).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith({ok: false, message: "No items in cart."})
  });

  it('should handle undefined cart gracefully', async () => {
    req.body.cart = undefined;

    await brainTreePaymentController(req, res);

    expect(mockTransactionSale).not.toHaveBeenCalled();
    expect(mockOrderSave).not.toHaveBeenCalled();
  });

  it('should handle null nonce', async () => {
    req.body.nonce = null;

    mockTransactionSale.mockImplementation((options, callback) => {
      expect(options.paymentMethodNonce).toBeNull();
      callback(new Error('Invalid nonce'), null);
    });

    await brainTreePaymentController(req, res);

    expect(mockOrderSave).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should handle empty cart array', async () => {
    req.body.cart = [];

    await brainTreePaymentController(req, res);

    expect(mockTransactionSale).not.toHaveBeenCalled();
    expect(mockOrderSave).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ok: false, message: "No items in cart."});
  });

  it('should handle cart with invalid price structure', async () => {
    req.body.cart = [
      { _id: 'prod1', name: 'Product 1', price: 100 },
      { _id: 'prod2', name: 'Product 2', price: 50 },
      { _id: 'prod3', name: 'Product 3', price: 50 }
    ];

    // Mock DB products with invalid price (NaN)
    mockProductFind.mockResolvedValue([
      { _id: { toString: () => 'prod1' }, name: 'Product 1', quantity: 10, price: NaN },
      { _id: { toString: () => 'prod2' }, name: 'Product 2', quantity: 5, price: 50 },
      { _id: { toString: () => 'prod3' }, name: 'Product 3', quantity: 5, price: 50 }
    ]);

    await brainTreePaymentController(req, res);

    expect(mockTransactionSale).not.toHaveBeenCalled();
    expect(mockOrderSave).not.toHaveBeenCalled();
    expect(mockProductFind).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ok: false, message: "Invalid price for product Product 1"});
  });

  it('should calculate total correctly for multiple items', async () => {
    req.body.cart = [
      { _id: 'item1', name: 'Item 1', price: 25.50, quantity: 1 },
      { _id: 'item2', name: 'Item 2', price: 30.25, quantity: 1 },
      { _id: 'item3', name: 'Item 3', price: 44.25, quantity: 1 }
    ];

    mockProductFind.mockResolvedValue([
      { _id: { toString: () => 'item1' }, name: 'Item 1', quantity: 10, price: 25.50 },
      { _id: { toString: () => 'item2' }, name: 'Item 2', quantity: 10, price: 30.25 },
      { _id: { toString: () => 'item3' }, name: 'Item 3', quantity: 10, price: 44.25 }
    ]);

    const mockResult = { success: true };
    mockTransactionSale.mockImplementation((options, callback) => {
      expect(options.amount).toBe(100);
      setImmediate(() => callback(null, mockResult));
    });

    await brainTreePaymentController(req, res);

    // Wait for async callback to complete
    await new Promise(resolve => setImmediate(resolve));

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('should return 404 when product not found in database', async () => {
    mockProductFind.mockResolvedValue([
      { _id: { toString: () => 'prod1' }, name: 'Product 1', quantity: 10, price: 100 }
    ]);

    await brainTreePaymentController(req, res);

    expect(mockProductFind).toHaveBeenCalledWith({ _id: { $in: ['prod1', 'prod2'] } });
    expect(mockTransactionSale).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      ok: false,
      message: 'Product with ID prod2 not found'
    });
  });

  it('should return 400 when insufficient stock', async () => {
    mockProductFind.mockResolvedValue([
      { _id: { toString: () => 'prod1' }, name: 'Product 1', quantity: 1, price: 100 },
      { _id: { toString: () => 'prod2' }, name: 'Product 2', quantity: 5, price: 50 }
    ]);

    await brainTreePaymentController(req, res);

    expect(mockProductFind).toHaveBeenCalledWith({ _id: { $in: ['prod1', 'prod2'] } });
    expect(mockTransactionSale).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      ok: false,
      message: 'Insufficient stock for Product 1. Available: 1, Requested: 2'
    });
  });
});

// LLMs were used to proofread, debug and fix test cases.  