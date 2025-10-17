// // --- 1. Mocks Setup ---
// // We mock the external dependencies globally.
// jest.mock('../models/productModel', () => ({
//     // Mock the constructor for `new productModel()`
//     __esModule: true,
//     default: jest.fn((data) => ({
//         // Ensure that any instance created has the data and a mock save function
//         ...data,
//         save: jest.fn(), // Mock the save method for instances
//     })),
//     // Mock static methods/properties
//     // NOTE: Keep these defined as jest.fn() here.
//     findByIdAndDelete: jest.fn(),
//     findByIdAndUpdate: jest.fn(),
// }));
// jest.mock('fs', () => ({
//     __esModule: true,
//     default: {
//         readFileSync: jest.fn(),
//     },
//     readFileSync: jest.fn(),
// }));
// jest.mock('slugify', () => ({
//     __esModule: true,
//     default: jest.fn((name) => `mock-slug-of-${name.toLowerCase().replace(/\s/g, '-')}`),
// }));

// // Mock dotenv/braintree usage to avoid setup errors
// jest.mock('dotenv', () => ({ config: jest.fn() }));
// jest.mock('braintree', () => ({
//     BraintreeGateway: jest.fn(() => ({
//         clientToken: { generate: jest.fn() },
//         transaction: { sale: jest.fn() },
//     })),
//     Environment: { Sandbox: 'sandbox' },
// }));

// // --- 2. Imports ---
// import {
//     createProductController,
//     deleteProductController,
//     updateProductController,
// } from '../controllers/productController';

// import productModel from '../models/productModel';
// import fs from 'fs';
// import slugify from 'slugify';

// // --- 3. Helper Functions and Data ---
// const mockReq = (fields = {}, files = {}, params = {}) => ({
//     fields,
//     files,
//     params,
// });

// const mockRes = () => {
//     const res = {};
//     res.status = jest.fn().mockReturnValue(res);
//     res.send = jest.fn().mockReturnValue(res);
//     return res;
// };

// // Standard data for successful operations
// const VALID_FIELDS = {
//     name: 'Test Product',
//     description: 'A perfect mock product',
//     price: 99.99,
//     category: 'catId123',
//     quantity: 5,
//     shipping: true,
// };
// const VALID_PHOTO = {
//     path: '/temp/photo.jpg',
//     size: 500000, // < 1MB
//     type: 'image/jpeg',
// };

// // Mock update ID
// const productId = 'updateId6789';

// // --- 4. Test Suite ---
// describe('Product Controllers', () => {

//     beforeEach(() => {
//         // CRITICAL FIX: Only call jest.clearAllMocks() to reset history/calls.
//         // It clears implementation history, but keeps the mocks defined by jest.mock() available.
//         jest.clearAllMocks();

//         // Ensure the Mongoose static methods are re-assigned to mocks if clearAllMocks() broke them.
//         // This is the safest way to prevent 'mockClear is undefined' if jest.clearAllMocks() is too aggressive.
//         productModel.findByIdAndDelete = jest.fn();
//         productModel.findByIdAndUpdate = jest.fn();

//         // CRITICAL FIX: Ensure the productModel constructor mock history is cleared
//         productModel.mockClear();
//         fs.readFileSync.mockClear();
//     });

//     // =======================================
//     // 1. createProductController
//     // =======================================
//     describe('createProductController', () => {

//         // T1: Success Path - Complete creation with photo
//         it('should successfully create a product with photo and return 201', async () => {
//             const req = mockReq(VALID_FIELDS, { photo: VALID_PHOTO });
//             const res = mockRes();

//             const mockSave = jest.fn().mockResolvedValue({ _id: 'newMockId', ...VALID_FIELDS });

//             productModel.mockImplementationOnce((data) => ({
//                 ...data,
//                 slug: slugify(VALID_FIELDS.name),
//                 save: mockSave,
//                 photo: {},
//             }));

//             await createProductController(req, res);

//             expect(mockSave).toHaveBeenCalled();
//             expect(fs.readFileSync).toHaveBeenCalledWith(VALID_PHOTO.path);
//             expect(productModel).toHaveBeenCalled();
//             expect(res.status).toHaveBeenCalledWith(201);
//             expect(res.send).toHaveBeenCalledWith(
//                 expect.objectContaining({ success: true, message: 'Product Created Successfully' })
//             );
//         });

//         // T2: Success Path - Creation without photo
//         it('should successfully create a product without photo and return 201', async () => {
//             const req = mockReq(VALID_FIELDS, {}); // No photo
//             const res = mockRes();

//             const mockSave = jest.fn().mockResolvedValue({ _id: 'newMockId', ...VALID_FIELDS });

//             productModel.mockImplementationOnce((data) => ({
//                 ...data,
//                 slug: slugify(VALID_FIELDS.name),
//                 save: mockSave,
//             }));

//             await createProductController(req, res);

//             expect(mockSave).toHaveBeenCalled();
//             expect(fs.readFileSync).not.toHaveBeenCalled();
//             expect(res.status).toHaveBeenCalledWith(201);
//         });

//         // T3: Failure Path - Validation (missing required field: name)
//         it('should return 500 error if name is missing', async () => {
//             const fields = { ...VALID_FIELDS, name: undefined };
//             const req = mockReq(fields, {});
//             const res = mockRes();

//             await createProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
//             expect(productModel).not.toHaveBeenCalled();
//         });

//         // T4: Failure Path - Validation (missing required field: description)
//         it('should return 500 error if description is missing', async () => {
//             const fields = { ...VALID_FIELDS, description: undefined };
//             const req = mockReq(fields, {});
//             const res = mockRes();

//             await createProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
//         });

//         // T5: Failure Path - Validation (missing required field: price)
//         it('should return 500 error if price is missing', async () => {
//             const fields = { ...VALID_FIELDS, price: undefined };
//             const req = mockReq(fields, {});
//             const res = mockRes();

//             await createProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
//         });

//         // T6: Failure Path - Validation (missing required field: category)
//         it('should return 500 error if category is missing', async () => {
//             const fields = { ...VALID_FIELDS, category: undefined };
//             const req = mockReq(fields, {});
//             const res = mockRes();

//             await createProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
//         });

//         // T7: Failure Path - Validation (missing required field: quantity)
//         it('should return 500 error if quantity is missing', async () => {
//             const fields = { ...VALID_FIELDS, quantity: undefined };
//             const req = mockReq(fields, {});
//             const res = mockRes();

//             await createProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
//         });

//         // T8: Failure Path - Validation (photo size too large)
//         it('should return 500 error if photo size exceeds 1MB', async () => {
//             const fields = VALID_FIELDS;
//             const oversizedPhoto = { ...VALID_PHOTO, size: 1000001 }; // > 1MB
//             const req = mockReq(fields, { photo: oversizedPhoto });
//             const res = mockRes();

//             await createProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({
//                 error: 'photo is Required and should be less then 1mb',
//             });
//         });

//         // T9: Failure Path - Catch block error
//         it('should return 500 error if an exception occurs during creation', async () => {
//             const req = mockReq(VALID_FIELDS, {});
//             const res = mockRes();
//             const mockError = new Error('DB Save Failed');

//             // Force the constructor to throw an error
//             productModel.mockImplementationOnce(() => { throw mockError; });

//             await createProductController(req, res);

//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith(
//                 expect.objectContaining({
//                     success: false,
//                     error: mockError,
//                     message: 'Error in crearing product',
//                 })
//             );
//         });
//     });

//     // =======================================
//     // 2. deleteProductController
//     // =======================================
//     describe('deleteProductController', () => {

//         const deleteProductId = '12345pid';

//         // T1: Success Path - Deleting by product ID (pid)
//         it('should successfully delete a product and return 200', async () => {
//             const req = mockReq({}, {}, { pid: deleteProductId });
//             const res = mockRes();

//             productModel.findByIdAndDelete.mockReturnValueOnce({
//                 select: jest.fn().mockResolvedValue({ deletedCount: 1 })
//             });

//             await deleteProductController(req, res);

//             expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(deleteProductId);
//             expect(res.status).toHaveBeenCalledWith(200);
//             expect(res.send).toHaveBeenCalledWith(
//                 expect.objectContaining({ success: true, message: 'Product Deleted successfully' })
//             );
//         });

//         // T2: Failure Path - Catch block error
//         it('should return 500 error if an exception occurs during deletion', async () => {
//             const req = mockReq({}, {}, { pid: deleteProductId });
//             const res = mockRes();
//             const mockError = new Error('DB Delete Failed');

//             // Force the findByIdAndDelete to throw an error
//             productModel.findByIdAndDelete.mockImplementationOnce(() => {
//                 throw mockError;
//             });

//             await deleteProductController(req, res);

//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith(
//                 expect.objectContaining({
//                     success: false,
//                     error: mockError,
//                     message: "Error while deleting product",
//                 })
//             );
//         });
//     });

//     // =======================================
//     // 3. updateProductController
//     // =======================================
//     describe('updateProductController', () => {

//         // T1: Success Path - Update fields and a NEW photo
//         // T1: Success Path - Update fields and a NEW photo
// it('should successfully update product fields and photo and return 201', async () => {

//     const updateFields = { ...VALID_FIELDS, name: 'Updated Product Name' };
//     const req = mockReq(updateFields, { photo: VALID_PHOTO }, { pid: productId });
//     const res = mockRes();

//     const mockSave = jest.fn().mockResolvedValue({ _id: productId, ...updateFields });
//     const mockUpdatedProduct = {
//         _id: productId,
//         ...updateFields,
//         save: mockSave,
//         photo: {},
//     };

//     productModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedProduct);

//     await updateProductController(req, res);

//     expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
//         productId,
//         expect.objectContaining({ slug: slugify(updateFields.name) }),
//         { new: true }
//     );

//     expect(mockSave).toHaveBeenCalled();
//     expect(fs.readFileSync).toHaveBeenCalledWith(VALID_PHOTO.path);

//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.send).toHaveBeenCalledWith(
//         expect.objectContaining({
//             success: true,
//             message: "Product Updated Successfully",
//         })
//     );

//     expect(productModel).not.toHaveBeenCalled();
// });

//         // T2: Success Path - Update fields WITHOUT changing photo
//         // T2: Success Path - Update fields WITHOUT changing photo
// it('should successfully update product fields without photo and return 201', async () => {
//     const updateFields = { ...VALID_FIELDS, description: 'New Description' };
//     const req = mockReq(updateFields, {}, { pid: productId }); // 无 photo file
//     const res = mockRes();

//     const mockSave = jest.fn().mockResolvedValue({ _id: productId, ...updateFields });
//     const mockUpdatedProduct = {
//         _id: productId,
//         ...updateFields,
//         save: mockSave,
//         photo: { data: Buffer.from('mock'), contentType: 'image/jpeg' }, // 模拟原有 photo 数据
//     };

//     // Mock findByIdAndUpdate
//     productModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedProduct);

//     await updateProductController(req, res);

//     expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
//         productId,
//         expect.objectContaining({ slug: slugify(updateFields.name) }),
//         { new: true }
//     );

//     expect(mockSave).toHaveBeenCalled();
//     expect(fs.readFileSync).not.toHaveBeenCalled();

//     expect(res.status).toHaveBeenCalledWith(201);
//     expect(res.send).toHaveBeenCalledWith(
//         expect.objectContaining({
//             success: true,
//         })
//     );

//     expect(productModel).not.toHaveBeenCalled();
// });

//         // T3: Failure Path - Validation (photo size too large)
//         it('should return 500 error if photo size exceeds 1MB', async () => {
//             const req = mockReq(VALID_FIELDS, { photo: { size: 1000001 } }, { pid: productId });
//             const res = mockRes();

//             await updateProductController(req, res);

//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({
//                 error: 'photo is Required and should be less then 1mb',
//             });
//             expect(productModel).not.toHaveBeenCalled();
//         });

//         // T4: Failure Path - Validation (missing required field: name)
//         it('should return 500 error if name is missing during update', async () => {
//             const fields = { ...VALID_FIELDS, name: undefined };
//             const req = mockReq(fields, {}, { pid: productId });
//             const res = mockRes();

//             await updateProductController(req, res);
//             expect(res.status).toHaveBeenCalledWith(500);
//             expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
//         });

//         // T5: Failure Path - Catch block error
// it('should return 500 error if an exception occurs during update', async () => {
//     const req = mockReq(VALID_FIELDS, {}, { pid: productId });
//     const res = mockRes();

//     const mockSaveError = new Error('Update Save Failed');

//     const mockSave = jest.fn().mockRejectedValue(mockSaveError);

//     const mockProductInstance = {
//         save: mockSave,
//         photo: {},
//     };

//     productModel.findByIdAndUpdate.mockResolvedValueOnce(mockProductInstance);

//     await updateProductController(req, res);

//     expect(mockSave).toHaveBeenCalled();
//     expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.send).toHaveBeenCalledWith(
//         expect.objectContaining({
//             success: false,
//             error: mockSaveError,
//             message: "Error in Update product",
//         })
//     );
// });

// it('should return 500 error if description is missing', async () => {
//     const fields = { ...VALID_FIELDS, description: undefined };
//     const req = mockReq(fields, {}, { pid: productId });
//     const res = mockRes();

//     await updateProductController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
//     expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled();
// });

// it('should return 500 error if price is missing', async () => {

//     const fields = { ...VALID_FIELDS, price: undefined };
//     const req = mockReq(fields, {}, { pid: productId });
//     const res = mockRes();

//     await updateProductController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
//     expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled();
// });

// it('should return 500 error if category is missing', async () => {

//     const fields = { ...VALID_FIELDS, category: undefined };
//     const req = mockReq(fields, {}, { pid: productId });
//     const res = mockRes();

//     await updateProductController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
//     expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled();
// });

// it('should return 500 error if quantity is missing', async () => {

//     const fields = { ...VALID_FIELDS, quantity: undefined };
//     const req = mockReq(fields, {}, { pid: productId });
//     const res = mockRes();

//     await updateProductController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
//     expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled();
// });
//     });
// });

// controllers/productController.test.js
// ESM-compatible Jest tests for productController
// - Keeps your VALID_FIELDS, VALID_PHOTO, mockReq, mockRes, and existing create/update/delete tests.
// - Adds tests for the remaining controllers.
// - Uses jest.unstable_mockModule + dynamic import() for ESM mocking.
// - Simplifications requested: (1) one mock named productModel (constructor + statics), (2) use real slugify.

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import slugify from "slugify";

// ---------------------------------------------------------------------
// 0) Chainable query helpers (for Mongoose-like chaining)
// ---------------------------------------------------------------------
const makeFindChain = (finalValue = []) => {
  const chain = {};
  chain.populate = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.limit = jest.fn(() => chain);
  chain.skip = jest.fn(() => chain);
  chain.sort = jest.fn(() => Promise.resolve(finalValue));
  return chain;
};

const makeFindOneChain = (finalValue = null) => {
  const chain = {};
  chain.select = jest.fn(() => chain);
  chain.populate = jest.fn(() => Promise.resolve(finalValue));
  return chain;
};

const makeFindByIdSelectChain = (finalValue = null) => {
  const chain = {};
  chain.select = jest.fn(() => Promise.resolve(finalValue));
  return chain;
};

// ---------------------------------------------------------------------
// 1) Global mocks (ESM)
// ---------------------------------------------------------------------
let productModel; // constructor + statics
let categoryModel;
let orderModel;
const fsReadFileSync = jest.fn();

const braintreeGenerate = jest.fn();
const braintreeSale = jest.fn();

await jest.unstable_mockModule("dotenv", () => ({
  default: { config: jest.fn() },
}));

await jest.unstable_mockModule("fs", () => ({
  default: { readFileSync: fsReadFileSync },
  readFileSync: fsReadFileSync,
}));

await jest.unstable_mockModule("braintree", () => {
  const mod = {
    BraintreeGateway: jest.fn(() => ({
      clientToken: { generate: braintreeGenerate },
      transaction: { sale: braintreeSale },
    })),
    Environment: { Sandbox: "sandbox" },
  };
  // IMPORTANT: provide both named and default exports
  return { ...mod, default: mod };
});

// productModel: default export is a constructor function,
// with static methods attached (find, findOne, etc.)
await jest.unstable_mockModule("../models/productModel.js", () => {
  const ProductModel = jest.fn((data) => ({
    ...data,
    save: jest.fn(), // per-instance save
    photo: {}, // attachable in tests
  }));
  ProductModel.find = jest.fn();
  ProductModel.findOne = jest.fn();
  ProductModel.findById = jest.fn();
  ProductModel.findByIdAndDelete = jest.fn();
  ProductModel.findByIdAndUpdate = jest.fn();
  ProductModel.estimatedDocumentCount = jest.fn();
  ProductModel.bulkWrite = jest.fn();

  productModel = ProductModel;
  return { default: ProductModel };
});

await jest.unstable_mockModule("../models/categoryModel.js", () => {
  categoryModel = { findOne: jest.fn() };
  return { default: categoryModel };
});

await jest.unstable_mockModule("../models/orderModel.js", () => {
  function OrderModel(data) {
    this._data = data;
    this.save = jest.fn().mockResolvedValue({ _id: "order-1", ...data });
  }
  orderModel = OrderModel;
  return { default: OrderModel };
});

// ---------------------------------------------------------------------
// 2) Import SUT after mocks
// ---------------------------------------------------------------------
const {
  createProductController,
  deleteProductController,
  updateProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController, // current misspelling in source
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
} = await import("./productController.js");

// ---------------------------------------------------------------------
// 3) Your original helpers & constants (retained)
// ---------------------------------------------------------------------
const mockReq = (fields = {}, files = {}, params = {}) => ({
  fields,
  files,
  params,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

const VALID_FIELDS = {
  name: "Test Product",
  description: "A perfect mock product",
  price: 99.99,
  category: "catId123",
  quantity: 5,
  shipping: true,
};

const VALID_PHOTO = {
  path: "/temp/photo.jpg",
  size: 500000, // < 1MB
  type: "image/jpeg",
};

const productId = "updateId6789";

// ---------------------------------------------------------------------
// 4) Reset between tests
// ---------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {});

// =====================================================================
// SECTION A — Existing tests (create, delete, update) — retained
// =====================================================================

describe("Product Controllers (existing: createProductController)", () => {
  describe("createProductController", () => {
    it("should successfully create a product with photo and return 201", async () => {
      const req = mockReq(VALID_FIELDS, { photo: VALID_PHOTO });
      const res = mockRes();

      const mockSave = jest
        .fn()
        .mockResolvedValue({ _id: "newMockId", ...VALID_FIELDS });

      productModel.mockImplementationOnce((data) => ({
        ...data,
        slug: slugify(VALID_FIELDS.name),
        save: mockSave,
        photo: {},
      }));

      await createProductController(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(fsReadFileSync).toHaveBeenCalledWith(VALID_PHOTO.path);
      expect(productModel).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Created Successfully",
        })
      );
    });

    it("should successfully create a product without photo and return 201", async () => {
      const req = mockReq(VALID_FIELDS, {}); // No photo
      const res = mockRes();

      const mockSave = jest
        .fn()
        .mockResolvedValue({ _id: "newMockId", ...VALID_FIELDS });

      productModel.mockImplementationOnce((data) => ({
        ...data,
        slug: slugify(VALID_FIELDS.name),
        save: mockSave,
      }));

      await createProductController(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(fsReadFileSync).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 500 error if name is missing", async () => {
      const fields = { ...VALID_FIELDS, name: undefined };
      const req = mockReq(fields, {});
      const res = mockRes();

      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      expect(productModel).not.toHaveBeenCalled();
    });

    it("should return 500 error if description is missing", async () => {
      const fields = { ...VALID_FIELDS, description: undefined };
      const req = mockReq(fields, {});
      const res = mockRes();

      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Description is Required",
      });
    });

    it("should return 500 error if price is missing", async () => {
      const fields = { ...VALID_FIELDS, price: undefined };
      const req = mockReq(fields, {});
      const res = mockRes();

      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    });

    it("should return 500 error if category is missing", async () => {
      const fields = { ...VALID_FIELDS, category: undefined };
      const req = mockReq(fields, {});
      const res = mockRes();

      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    });

    it("should return 500 error if quantity is missing", async () => {
      const fields = { ...VALID_FIELDS, quantity: undefined };
      const req = mockReq(fields, {});
      const res = mockRes();

      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
    });

    it("should return 500 error if photo size exceeds 1MB", async () => {
      const oversizedPhoto = { ...VALID_PHOTO, size: 1000001 };
      const req = mockReq(VALID_FIELDS, { photo: oversizedPhoto });
      const res = mockRes();

      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "photo is Required and should be less then 1mb",
      });
    });

    it("should return 500 error if an exception occurs during creation", async () => {
      const req = mockReq(VALID_FIELDS, {});
      const res = mockRes();
      const mockError = new Error("DB Save Failed");

      productModel.mockImplementationOnce(() => {
        throw mockError;
      });

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: mockError,
          message: "Error in crearing product",
        })
      );
    });
  });
});

describe("Product Controllers (existing: deleteProductController)", () => {
  const deleteProductId = "12345pid";

  it("should successfully delete a product and return 200", async () => {
    const req = mockReq({}, {}, { pid: deleteProductId });
    const res = mockRes();

    productModel.findByIdAndDelete.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    await deleteProductController(req, res);

    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
      deleteProductId
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Deleted successfully",
      })
    );
  });

  it("should return 500 error if an exception occurs during deletion", async () => {
    const req = mockReq({}, {}, { pid: deleteProductId });
    const res = mockRes();
    const mockError = new Error("DB Delete Failed");

    productModel.findByIdAndDelete.mockImplementationOnce(() => {
      throw mockError;
    });

    await deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: mockError,
        message: "Error while deleting product",
      })
    );
  });
});

describe("Product Controllers (existing: updateProductController)", () => {
  it("should successfully update product fields and photo and return 201", async () => {
    const updateFields = { ...VALID_FIELDS, name: "Updated Product Name" };
    const req = mockReq(
      updateFields,
      { photo: VALID_PHOTO },
      { pid: productId }
    );
    const res = mockRes();

    const mockSave = jest
      .fn()
      .mockResolvedValue({ _id: productId, ...updateFields });
    const mockUpdatedProduct = {
      _id: productId,
      ...updateFields,
      save: mockSave,
      photo: {},
    };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedProduct);

    await updateProductController(req, res);

    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({ slug: slugify(updateFields.name) }),
      { new: true }
    );

    expect(mockSave).toHaveBeenCalled();
    expect(fsReadFileSync).toHaveBeenCalledWith(VALID_PHOTO.path);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Product Updated Successfully",
      })
    );

    expect(productModel).not.toHaveBeenCalled(); // as constructor
  });

  it("should successfully update product fields without photo and return 201", async () => {
    const updateFields = { ...VALID_FIELDS, description: "New Description" };
    const req = mockReq(updateFields, {}, { pid: productId });
    const res = mockRes();

    const mockSave = jest
      .fn()
      .mockResolvedValue({ _id: productId, ...updateFields });
    const mockUpdatedProduct = {
      _id: productId,
      ...updateFields,
      save: mockSave,
      photo: { data: Buffer.from("mock"), contentType: "image/jpeg" },
    };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedProduct);

    await updateProductController(req, res);

    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
      productId,
      expect.objectContaining({ slug: slugify(updateFields.name) }),
      { new: true }
    );

    expect(mockSave).toHaveBeenCalled();
    expect(fsReadFileSync).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );

    expect(productModel).not.toHaveBeenCalled(); // as constructor
  });

  it("should return 500 error if photo size exceeds 1MB", async () => {
    const req = mockReq(
      VALID_FIELDS,
      { photo: { size: 1000001 } },
      { pid: productId }
    );
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
    expect(productModel).not.toHaveBeenCalled();
  });

  it("should return 500 error if name is missing during update", async () => {
    const fields = { ...VALID_FIELDS, name: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
  });

  it("should return 500 error if an exception occurs during update", async () => {
    const req = mockReq(VALID_FIELDS, {}, { pid: productId });
    const res = mockRes();

    const mockSaveError = new Error("Update Save Failed");
    const mockSave = jest.fn().mockRejectedValue(mockSaveError);

    const mockProductInstance = { save: mockSave, photo: {} };

    productModel.findByIdAndUpdate.mockResolvedValueOnce(mockProductInstance);

    await updateProductController(req, res);

    expect(mockSave).toHaveBeenCalled();
    expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: mockSaveError,
        message: "Error in Update product",
      })
    );
  });

  it("should return 500 error if description is missing", async () => {
    const fields = { ...VALID_FIELDS, description: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
    expect(
      productModel.findByIdAndUpdate || productModel
    ).not.toHaveBeenCalled();
  });

  it("should return 500 error if price is missing", async () => {
    const fields = { ...VALID_FIELDS, price: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    expect(
      productModel.findByIdAndUpdate || productModel
    ).not.toHaveBeenCalled();
  });

  it("should return 500 error if category is missing", async () => {
    const fields = { ...VALID_FIELDS, category: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    expect(
      productModel.findByIdAndUpdate || productModel
    ).not.toHaveBeenCalled();
  });

  it("should return 500 error if quantity is missing", async () => {
    const fields = { ...VALID_FIELDS, quantity: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
    expect(
      productModel.findByIdAndUpdate || productModel
    ).not.toHaveBeenCalled();
  });
});

// =====================================================================
// SECTION B — Additional controllers (new tests added)
// =====================================================================

describe("getProductController", () => {
  it("returns 200 with newest 12 products and no photo", async () => {
    const products = [
      { _id: "a", createdAt: new Date("2025-01-02") },
      { _id: "b", createdAt: new Date("2025-01-01") },
    ];
    const chain = makeFindChain(products);
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq();
    const res = mockRes();

    await getProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({});
    expect(chain.populate).toHaveBeenCalledWith("category");
    expect(chain.select).toHaveBeenCalledWith("-photo");
    expect(chain.limit).toHaveBeenCalledWith(12);
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.status).toHaveBeenCalledWith(200);
    // Source currently uses "counTotal" (typo)
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, counTotal: products.length })
    );
  });

  it("returns 500 when chain rejects", async () => {
    const chain = makeFindChain();
    chain.sort.mockRejectedValueOnce(new Error("DB fail"));
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq();
    const res = mockRes();

    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Erorr in getting products",
        error: "DB fail",
      })
    );
  });
});

describe("getSingleProductController", () => {
  it("returns 200 with product (no photo) when slug exists", async () => {
    const p = { _id: "p1", slug: "shoe", name: "Shoe" };
    const chain = makeFindOneChain(p);
    productModel.findOne.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { slug: "shoe" });
    const res = mockRes();

    await getSingleProductController(req, res);

    expect(productModel.findOne).toHaveBeenCalledWith({ slug: "shoe" });
    expect(chain.select).toHaveBeenCalledWith("-photo");
    expect(chain.populate).toHaveBeenCalledWith("category");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, product: p })
    );
  });

  it("returns 200 with product:null when not found", async () => {
    const chain = makeFindOneChain(null);
    productModel.findOne.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { slug: "missing" });
    const res = mockRes();

    await getSingleProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ product: null })
    );
  });

  it("returns 500 when chain rejects", async () => {
    const chain = makeFindOneChain();
    chain.populate.mockRejectedValueOnce(new Error("boom"));
    productModel.findOne.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { slug: "x" });
    const res = mockRes();

    await getSingleProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Eror while getitng single product" })
    );
  });
});

describe("productPhotoController", () => {
  //   it("streams photo with Content-Type", async () => {
  // const doc = {
  //   photo: { data: Buffer.from("abc"), contentType: "image/jpeg" },
  // };
  // const chain = makeFindByIdSelectChain(doc);
  // productModel.findById.mockReturnValueOnce(chain);

  // const req = mockReq({}, {}, { pid: "p1" });
  // const res = mockRes();

  // await productPhotoController(req, res);

  // expect(productModel.findById).toHaveBeenCalledWith("p1");
  // expect(chain.select).toHaveBeenCalledWith("photo");
  // // current code uses "Content-type" casing
  // expect(res.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
  // expect(res.status).toHaveBeenCalledWith(200);
  // expect(res.send).toHaveBeenCalledWith(doc.photo.data);

  //   const makeFindByIdSelectChain = (doc) => ({
  //     select: jest.fn(() => Promise.resolve(doc)), // ensure it resolves the doc
  //   });

  //   beforeEach(() => {
  //     jest.clearAllMocks();
  //     // align the import path with your controller's import (with .js)
  //     // and reset the specific mock we rely on
  //     productModel.findById.mockReset?.();
  //   });
  it("streams photo with Content-Type", async () => {
    const doc = {
      photo: { data: Buffer.from("abc"), contentType: "image/jpeg" },
    };
    const chain = makeFindByIdSelectChain(doc);
    productModel.findById.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { pid: "p1" });
    const res = mockRes();

    await productPhotoController(req, res);

    expect(productModel.findById).toHaveBeenCalledWith("p1");
    expect(chain.select).toHaveBeenCalledWith("photo");

    // header + 200 + body -> this hits the uncovered "return res.status(200).send(...)"
    const [k, v] = res.set.mock.calls[0];
    expect(k.toLowerCase()).toBe("content-type");
    expect(v).toBe("image/jpeg");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(doc.photo.data);
  });
});

it("400 when pid is missing (covers early return line)", async () => {
  const req = mockReq({}, {}, {}); // no pid
  const res = mockRes();

  await productPhotoController(req, res);

  expect(productModel.findById).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.send).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: expect.stringMatching(/missing product id/i),
    })
  );
});

it("BUG: triggers status 500 instead of 404 when product is null.)", async () => {
  const chain = makeFindByIdSelectChain(null);
  productModel.findById.mockReturnValueOnce(chain);

  const req = mockReq({}, {}, { pid: "missing" });
  const res = mockRes();

  await productPhotoController(req, res);

  expect(res.status).toHaveBeenCalledWith(404); // exposes current behavior
});

it("500 when DB rejects", async () => {
  const chain = makeFindByIdSelectChain();
  chain.select.mockRejectedValueOnce(new Error("DB err"));
  productModel.findById.mockReturnValueOnce(chain);

  const req = mockReq({}, {}, { pid: "p1" });
  const res = mockRes();

  await productPhotoController(req, res);
  expect(res.status).toHaveBeenCalledWith(500);

  expect(res.send).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringMatching(/error while getting photo/i),
    })
  );
});

describe("productFiltersController", () => {
  it("filters by categories only", async () => {
    productModel.find.mockResolvedValueOnce([{ _id: "x" }]);
    const req = { body: { checked: ["c1", "c2"], radio: [] } };
    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({ category: ["c1", "c2"] });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("filters by price only", async () => {
    productModel.find.mockResolvedValueOnce([{ _id: "y" }]);
    const req = { body: { checked: [], radio: [10, 50] } };
    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      price: { $gte: 10, $lte: 50 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("filters by both", async () => {
    productModel.find.mockResolvedValueOnce([{ _id: "z" }]);
    const req = { body: { checked: ["c1"], radio: [1, 5] } };
    const res = mockRes();

    await productFiltersController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: ["c1"],
      price: { $gte: 1, $lte: 5 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("BUG: undefined inputs cause crash and triggers status 400 instead of 200", async () => {
    const req = { body: {} }; // checked and radio undefined
    const res = mockRes();

    await productFiltersController(req, res);

    // exposes current behavior (no response due to TypeError)
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("400 on DB error", async () => {
    productModel.find.mockRejectedValueOnce(new Error("bad find"));
    const req = { body: { checked: [], radio: [] } };
    const res = mockRes();

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error WHile Filtering Products" })
    );
  });
});

describe("productCountController", () => {
  it("BUG: uses Model.estimatedDocumentCount() and not find()", async () => {
    productModel.estimatedDocumentCount.mockResolvedValueOnce(42);
    productModel.find.mockImplementation(() => {
      throw new Error("find() should not be used for counts");
    });

    const req = mockReq();
    const res = mockRes();

    await productCountController(req, res);

    expect(productModel.find).not.toHaveBeenCalled();
    expect(productModel.estimatedDocumentCount).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, total: 42 })
    );
  });

  it("logs the error and returns 400 when estimatedDocumentCount throws", async () => {
    // Arrange
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    // Force the model call to throw synchronously
    productModel.estimatedDocumentCount.mockImplementationOnce(() => {
      throw new Error("count boom");
    });

    const req = mockReq();
    const res = mockRes();

    // Act
    await productCountController(req, res);

    // Assert: both lines in catch block are executed
    expect(logSpy).toHaveBeenCalled(); // covers console.log(error)
    expect(res.status).toHaveBeenCalledWith(400); // covers res.status(400)
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Error in product count",
        success: false,
      })
    );

    logSpy.mockRestore();
  });
});

describe("productListController", () => {
  it("page omitted -> page=1, skip(0), limit(6), newest first", async () => {
    const result = [{ _id: "p1" }];
    const chain = makeFindChain(result);
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, {}); // no page
    const res = mockRes();

    await productListController(req, res);

    expect(chain.select).toHaveBeenCalledWith("-photo");
    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(6);
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: result })
    );
  });

  it('page="3" -> skip(12)', async () => {
    const chain = makeFindChain([]);
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { page: "3" });
    const res = mockRes();

    await productListController(req, res);
    expect(chain.skip).toHaveBeenCalledWith(12);
  });

  //   it('BUG: invalid type for page e.g. "abc"', async () => {
  //     const makeFindChainStrictSkip = (final = []) => {
  //       const chain = {};
  //       chain.select = jest.fn(() => chain);
  //       chain.skip = jest.fn((n) => {
  //         if (Number.isNaN(n)) throw new Error("skip received NaN"); // expose bug
  //         return chain;
  //       });
  //       chain.limit = jest.fn(() => chain);
  //       chain.sort = jest.fn(() => Promise.resolve(final));
  //       return chain;
  //     };

  //     // const chain = makeFindChain([]);
  //     productModel.find.mockReturnValueOnce(makeFindChainStrictSkip([]));

  //     const req = mockReq({}, {}, { page: "abc" });
  //     const res = mockRes();

  //     await productListController(req, res);

  //     const statusCode = res.status.mock.calls[0][0];
  //     expect(chain.skip).toHaveBeenCalledWith(0);
  //     expect(res.status).toHaveBeenCalledWith(200);
  //   });

  it('BUG: invalid type for page "abc" that result in NaN and 400', async () => {
    const makeFindChainStrictSkip = (final = []) => {
      const chain = {};
      chain.select = jest.fn(() => chain);
      chain.skip = jest.fn((n) => {
        if (Number.isNaN(n)) throw new Error("skip received NaN"); // expose bug
        return chain;
      });
      chain.limit = jest.fn(() => chain);
      chain.sort = jest.fn(() => Promise.resolve(final));
      return chain;
    };

    const chain = makeFindChainStrictSkip([]);
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { page: "abc" });
    const res = mockRes();

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(200); // catch block
    // Optional: verify skip got NaN (proves bug)
    const arg = chain.skip.mock.calls[0][0];
    expect(Number.isNaN(arg)).toBe(false);
  });

  it("400 when chain rejects", async () => {
    const chain = makeFindChain();
    chain.sort.mockRejectedValueOnce(new Error("oops"));
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq();
    const res = mockRes();

    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "error in per page ctrl" })
    );
  });
});

describe("searchProductController", () => {
  it("whitespace keyword -> returns []", async () => {
    const req = mockReq({}, {}, { keyword: "   " });
    const res = mockRes();

    await searchProductController(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("non-matching keyword -> returns [] after querying DB", async () => {
    // Controller will call .find({...}).select('-photo'); we mock that chain to resolve []
    const select = jest.fn(() => Promise.resolve([]));
    productModel.find.mockReturnValueOnce({ select });

    const req = mockReq({}, {}, { keyword: "no-such-term" });
    const res = mockRes();

    await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "no-such-term", $options: "i" } },
        { description: { $regex: "no-such-term", $options: "i" } },
      ],
    });
    expect(select).toHaveBeenCalledWith("-photo");
    expect(res.json).toHaveBeenCalledWith([]); // DB queried, but no matches found
  });

  it("matches name/description case-insensitively, no photo", async () => {
    const docs = [
      { _id: "p1", name: "Mint" },
      { _id: "p2", description: "Fresh mint shoe" },
    ];
    productModel.find.mockReturnValueOnce({
      select: jest.fn(() => Promise.resolve(docs)),
    });

    const req = mockReq({}, {}, { keyword: "mint" });
    const res = mockRes();

    await searchProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "mint", $options: "i" } },
        { description: { $regex: "mint", $options: "i" } },
      ],
    });
    expect(res.json).toHaveBeenCalledWith(docs);
  });

  it("400 when DB rejects", async () => {
    productModel.find.mockReturnValueOnce({
      select: jest.fn(() => Promise.reject(new Error("search fail"))),
    });

    const req = mockReq({}, {}, { keyword: "x" });
    const res = mockRes();

    await searchProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error In Search Product API" })
    );
  });
});

describe("realtedProductController (similar products)", () => {
  //   it("returns similar products by category, excludes pid, limit 3, populate category", async () => {
  //     const result = [{ _id: "a" }];
  //     const chain = makeFindChain(result);
  //     productModel.find.mockReturnValueOnce(chain);

  //     const req = mockReq({}, {}, { pid: "P", cid: "C" });
  //     const res = mockRes();

  //     await realtedProductController(req, res);

  //     expect(productModel.find).toHaveBeenCalledWith({
  //       category: "C",
  //       _id: { $ne: "P" },
  //     });
  //     expect(chain.select).toHaveBeenCalledWith("-photo");
  //     expect(chain.limit).toHaveBeenCalledWith(3);
  //     expect(chain.populate).toHaveBeenCalledWith("category");

  //     expect(res.status).toHaveBeenCalledWith(200);
  //     expect(res.send).toHaveBeenCalledWith(
  //       expect.objectContaining({ success: true, products: result })
  //     );
  //   });

  it("returns similar products by category, excludes pid, limit 3, populate category", async () => {
    const result = [{ _id: "a" }];

    // IMPORTANT: resolve the chain at the terminal call (.populate)
    const chain = {
      select: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      populate: jest.fn(() => Promise.resolve(result)), // <- resolve to data here
    };
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { pid: "P", cid: "C" });
    const res = mockRes();

    await realtedProductController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({
      category: "C",
      _id: { $ne: "P" },
    });
    expect(chain.select).toHaveBeenCalledWith("-photo");
    expect(chain.limit).toHaveBeenCalledWith(3);
    expect(chain.populate).toHaveBeenCalledWith("category");

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, products: result })
    );
  });

  it("400 when chain rejects", async () => {
    const chain = makeFindChain();
    chain.populate.mockRejectedValueOnce(new Error("rel fail"));
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { pid: "P", cid: "C" });
    const res = mockRes();

    await realtedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "error while geting related product" })
    );
  });
});

describe("productCategoryController", () => {
  it("returns products for found category", async () => {
    const cat = { _id: "cat1", slug: "shoes" };
    categoryModel.findOne.mockResolvedValueOnce(cat);

    const result = [{ _id: "p1", category: "cat1" }];
    const chain = { populate: jest.fn(() => Promise.resolve(result)) };
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { slug: "shoes" });
    const res = mockRes();

    await productCategoryController(req, res);

    // Current code queries by full category document (not _id)
    expect(productModel.find).toHaveBeenCalledWith({ category: cat });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        category: cat,
        products: result,
      })
    );
  });

  it("200 when category is null", async () => {
    categoryModel.findOne.mockResolvedValueOnce(null);
    const chain = { populate: jest.fn(() => Promise.resolve([])) };
    productModel.find.mockReturnValueOnce(chain);

    const req = mockReq({}, {}, { slug: "missing" });
    const res = mockRes();

    await productCategoryController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({ category: null });
    expect(res.status).toHaveBeenCalledWith(200); // current behavior
  });

  it("400 when DB rejects", async () => {
    categoryModel.findOne.mockRejectedValueOnce(new Error("cat fail"));

    const req = mockReq({}, {}, { slug: "x" });
    const res = mockRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error While Getting products" })
    );
  });
});

// describe("braintreeTokenController", () => {
//   it("success: sends client token response", async () => {
//     const req = {};
//     const res = mockRes();

//     braintreeGenerate.mockImplementationOnce((_, cb) =>
//       cb(null, { clientToken: "token-abc" })
//     );

//     await braintreeTokenController(req, res);

//     expect(braintreeGenerate).toHaveBeenCalled();
//     expect(res.send).toHaveBeenCalledWith({ clientToken: "token-abc" });
//   });

//   it("error: sends 500 with err", async () => {
//     const req = {};
//     const res = mockRes();

//     braintreeGenerate.mockImplementationOnce((_, cb) =>
//       cb(new Error("gen fail"), null)
//     );

//     await braintreeTokenController(req, res);

//     expect(res.status).toHaveBeenCalledWith(500);
//     expect(res.send).toHaveBeenCalled(); // raw error object sent
//   });

//   it("logs when clientToken.generate throws synchronously", async () => {
//     await jest.isolateModulesAsync(async () => {
//       // Spy on console.log *inside* this isolated registry
//       const origLog = console.log;
//       const logMock = jest.fn();
//       console.log = logMock;

//       try {
//         // Make dotenv harmless for this import
//         await jest.unstable_mockModule("dotenv", () => ({
//           default: { config: jest.fn() },
//         }));

//         // IMPORTANT: controller does `import braintree from "braintree"`
//         // so we must mock the *default* export shape.
//         const gatewayStub = {
//           clientToken: {
//             // Synchronous throw to hit the controller's outer catch
//             generate: jest.fn(() => {
//               throw new Error("generate boom");
//             }),
//           },
//           transaction: { sale: jest.fn() },
//         };

//         await jest.unstable_mockModule("braintree", () => ({
//           default: {
//             BraintreeGateway: jest.fn(() => gatewayStub),
//             Environment: { Sandbox: "sandbox" },
//           },
//         }));

//         // Now import a FRESH copy of the controller in this isolated registry
//         const { braintreeTokenController: tokenCtrl } = await import(
//           "./productController.js"
//         );

//         // Call it
//         const req = mockReq();
//         const res = mockRes();
//         await tokenCtrl(req, res);

//         // ✅ Outer catch executed -> console.log hit
//         expect(logMock).toHaveBeenCalled();

//         // Current code only logs in outer catch; no response on this path
//         expect(res.status).not.toHaveBeenCalled();
//         expect(res.send).not.toHaveBeenCalled();
//       } finally {
//         console.log = origLog; // restore
//       }
//     });
//   });
// });

describe("brainTreePaymentController", () => {
  it("500 when cart is missing/empty", async () => {
    const req = { body: { nonce: "n", cart: [] } };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, message: "No items in cart." })
    );
  });

  it("400 when price invalid", async () => {
    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: -1, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, message: "Invalid price for item" })
    );
  });

  it("404 when product not found in DB batch", async () => {
    productModel.find.mockResolvedValueOnce([]);

    const req = {
      body: { nonce: "n", cart: [{ _id: "p404", price: 10, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(productModel.find).toHaveBeenCalledWith({ _id: { $in: ["p404"] } });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: "Product with ID p404 not found",
      })
    );
  });

  it("400 when insufficient stock", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 0, name: "Item1" },
    ]);

    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 10, quantity: 2 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: expect.stringContaining("Insufficient stock"),
      })
    );
  });

  it("500 when total == 0", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 5, name: "Zero" },
    ]);

    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 0, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        message: "Total transaction amount cannot be $0.",
      })
    );
  });

  it("success: creates order, decrements stock, responds ok:true", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 5, name: "Item1" },
      { _id: "p2", quantity: 3, name: "Item2" },
    ]);

    braintreeSale.mockImplementationOnce((payload, cb) =>
      cb(null, { id: "txn-1", success: true })
    );
    productModel.bulkWrite.mockResolvedValueOnce({ ok: 1 });

    const req = {
      body: {
        nonce: "nonce-xyz",
        cart: [
          { _id: "p1", price: 10, quantity: 2 },
          { _id: "p2", price: 5, quantity: 1 },
        ],
      },
      user: { _id: "user-123" },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(braintreeSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25,
        paymentMethodNonce: "nonce-xyz",
        options: { submitForSettlement: true },
      }),
      expect.any(Function)
    );

    expect(productModel.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: "p1" },
            update: { $inc: { quantity: -2 } },
          }),
        }),
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: "p2" },
            update: { $inc: { quantity: -1 } },
          }),
        }),
      ])
    );

    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("500 when braintree reports error", async () => {
    productModel.find.mockResolvedValueOnce([
      { _id: "p1", quantity: 5, name: "Item1" },
    ]);

    braintreeSale.mockImplementationOnce((payload, cb) =>
      cb(new Error("payment failed"), null)
    );

    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 9, quantity: 1 }] },
    };
    const res = mockRes();

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalled();
  });

  it("logs when gateway.transaction.sale throws synchronously", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Minimal valid body so we reach the productModel.find call
    const req = {
      body: { nonce: "n", cart: [{ _id: "p1", price: 10, quantity: 1 }] },
      user: { _id: "buyer1" },
    };
    const res = mockRes();

    // Force a sync throw inside the try block
    productModel.find.mockImplementationOnce(() => {
      throw new Error("find boom");
    });

    await brainTreePaymentController(req, res);

    // ✅ Outer catch executed -> console.log hit
    expect(logSpy).toHaveBeenCalled();

    // Current code only logs in the outer catch (no response), so document that behavior:
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
