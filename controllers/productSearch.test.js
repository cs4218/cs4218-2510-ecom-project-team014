import { jest } from '@jest/globals';

const mockFind = jest.fn();
const mockSelect = jest.fn();

jest.unstable_mockModule('../models/productModel.js', () => ({
  default: {
    find: mockFind
  }
}));

const { searchProductController } = await import('./productController.js');

describe('searchProductController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { keyword: 'shoe' }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Reset the mock chains
    mockFind.mockReset();
    mockSelect.mockReset();
    mockFind.mockReturnValue({ select: mockSelect });
  });

  it('should return matching products', async () => {
    const fakeProducts = [{ name: 'Running Shoe' }];
    mockSelect.mockResolvedValue(fakeProducts);

    await searchProductController(req, res);

    expect(mockFind).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'shoe', $options: 'i' } },
        { description: { $regex: 'shoe', $options: 'i' } }
      ]
    });
    expect(mockSelect).toHaveBeenCalledWith('-photo');
    expect(res.json).toHaveBeenCalledWith(fakeProducts);
  });

  it('should return empty array when no products match', async () => {
    mockSelect.mockResolvedValue([]);

    await searchProductController(req, res);

    expect(mockFind).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'shoe', $options: 'i' } },
        { description: { $regex: 'shoe', $options: 'i' } }
      ]
    });
    expect(mockSelect).toHaveBeenCalledWith('-photo');
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should return empty array for empty keyword without querying DB', async () => {
    req.params.keyword = '';

    await searchProductController(req, res);

    expect(mockFind).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should return empty array for whitespace-only keyword without querying DB', async () => {
    req.params.keyword = '   ';

    await searchProductController(req, res);

    expect(mockFind).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should trim keyword before searching', async () => {
    req.params.keyword = '  shoe  ';
    const fakeProducts = [{ name: 'Running Shoe' }];
    mockSelect.mockResolvedValue(fakeProducts);

    await searchProductController(req, res);

    // Should search for 'shoe', not '  shoe  '
    expect(mockFind).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'shoe', $options: 'i' } },
        { description: { $regex: 'shoe', $options: 'i' } }
      ]
    });
    expect(mockSelect).toHaveBeenCalledWith('-photo');
    expect(res.json).toHaveBeenCalledWith(fakeProducts);
  });

  it('should handle database errors gracefully', async () => {
    mockSelect.mockRejectedValue(new Error('DB failure'));

    await searchProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Error In Search Product API')
    }));
  });
});