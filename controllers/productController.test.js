// --- 1. Mocks Setup ---
// We mock the external dependencies globally.
jest.mock('../models/productModel', () => ({
    // Mock the constructor for `new productModel()`
    __esModule: true,
    default: jest.fn((data) => ({
        // Ensure that any instance created has the data and a mock save function
        ...data,
        save: jest.fn(), // Mock the save method for instances
    })),
    // Mock static methods/properties
    // NOTE: Keep these defined as jest.fn() here.
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));
jest.mock('fs', () => ({
    __esModule: true,
    default: {
        readFileSync: jest.fn(),
    },
    readFileSync: jest.fn(),
}));
jest.mock('slugify', () => ({
    __esModule: true,
    default: jest.fn((name) => `mock-slug-of-${name.toLowerCase().replace(/\s/g, '-')}`),
}));

// Mock dotenv/braintree usage to avoid setup errors
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('braintree', () => ({
    BraintreeGateway: jest.fn(() => ({
        clientToken: { generate: jest.fn() },
        transaction: { sale: jest.fn() },
    })),
    Environment: { Sandbox: 'sandbox' },
}));


// --- 2. Imports ---
import {
    createProductController,
    deleteProductController,
    updateProductController,
} from '../controllers/productController';

import productModel from '../models/productModel';
import fs from 'fs';
import slugify from 'slugify';

// --- 3. Helper Functions and Data ---
const mockReq = (fields = {}, files = {}, params = {}) => ({
    fields,
    files,
    params,
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

// Standard data for successful operations
const VALID_FIELDS = {
    name: 'Test Product',
    description: 'A perfect mock product',
    price: 99.99,
    category: 'catId123',
    quantity: 5,
    shipping: true,
};
const VALID_PHOTO = {
    path: '/temp/photo.jpg',
    size: 500000, // < 1MB
    type: 'image/jpeg',
};

// Mock update ID
const productId = 'updateId6789';

// --- 4. Test Suite ---
describe('Product Controllers', () => {

    beforeEach(() => {
        // CRITICAL FIX: Only call jest.clearAllMocks() to reset history/calls.
        // It clears implementation history, but keeps the mocks defined by jest.mock() available.
        jest.clearAllMocks();
        
        // Ensure the Mongoose static methods are re-assigned to mocks if clearAllMocks() broke them.
        // This is the safest way to prevent 'mockClear is undefined' if jest.clearAllMocks() is too aggressive.
        productModel.findByIdAndDelete = jest.fn();
        productModel.findByIdAndUpdate = jest.fn(); 
        
        // CRITICAL FIX: Ensure the productModel constructor mock history is cleared
        productModel.mockClear(); 
        fs.readFileSync.mockClear(); 
    });

    // =======================================
    // 1. createProductController 
    // =======================================
    describe('createProductController', () => {
        
        // T1: Success Path - Complete creation with photo
        it('should successfully create a product with photo and return 201', async () => {
            const req = mockReq(VALID_FIELDS, { photo: VALID_PHOTO });
            const res = mockRes();

            const mockSave = jest.fn().mockResolvedValue({ _id: 'newMockId', ...VALID_FIELDS });
            
            productModel.mockImplementationOnce((data) => ({
                ...data,
                slug: slugify(VALID_FIELDS.name),
                save: mockSave, 
                photo: {},
            }));

            await createProductController(req, res);

            expect(mockSave).toHaveBeenCalled(); 
            expect(fs.readFileSync).toHaveBeenCalledWith(VALID_PHOTO.path);
            expect(productModel).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: 'Product Created Successfully' })
            );
        });

        // T2: Success Path - Creation without photo
        it('should successfully create a product without photo and return 201', async () => {
            const req = mockReq(VALID_FIELDS, {}); // No photo
            const res = mockRes();

            const mockSave = jest.fn().mockResolvedValue({ _id: 'newMockId', ...VALID_FIELDS });
            
            productModel.mockImplementationOnce((data) => ({
                ...data,
                slug: slugify(VALID_FIELDS.name),
                save: mockSave, 
            }));

            await createProductController(req, res);

            expect(mockSave).toHaveBeenCalled(); 
            expect(fs.readFileSync).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        // T3: Failure Path - Validation (missing required field: name)
        it('should return 500 error if name is missing', async () => {
            const fields = { ...VALID_FIELDS, name: undefined };
            const req = mockReq(fields, {});
            const res = mockRes();

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
            expect(productModel).not.toHaveBeenCalled();
        });

        // T4: Failure Path - Validation (missing required field: description)
        it('should return 500 error if description is missing', async () => {
            const fields = { ...VALID_FIELDS, description: undefined };
            const req = mockReq(fields, {});
            const res = mockRes();

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
        });

        // T5: Failure Path - Validation (missing required field: price)
        it('should return 500 error if price is missing', async () => {
            const fields = { ...VALID_FIELDS, price: undefined };
            const req = mockReq(fields, {});
            const res = mockRes();

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
        });

        // T6: Failure Path - Validation (missing required field: category)
        it('should return 500 error if category is missing', async () => {
            const fields = { ...VALID_FIELDS, category: undefined };
            const req = mockReq(fields, {});
            const res = mockRes();

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
        });

        // T7: Failure Path - Validation (missing required field: quantity)
        it('should return 500 error if quantity is missing', async () => {
            const fields = { ...VALID_FIELDS, quantity: undefined };
            const req = mockReq(fields, {});
            const res = mockRes();

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
        });
        
        // T8: Failure Path - Validation (photo size too large)
        it('should return 500 error if photo size exceeds 1MB', async () => {
            const fields = VALID_FIELDS;
            const oversizedPhoto = { ...VALID_PHOTO, size: 1000001 }; // > 1MB
            const req = mockReq(fields, { photo: oversizedPhoto });
            const res = mockRes();

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'photo is Required and should be less then 1mb',
            });
        });

        // T9: Failure Path - Catch block error
        it('should return 500 error if an exception occurs during creation', async () => {
            const req = mockReq(VALID_FIELDS, {});
            const res = mockRes();
            const mockError = new Error('DB Save Failed');

            // Force the constructor to throw an error
            productModel.mockImplementationOnce(() => { throw mockError; });
            
            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ 
                    success: false, 
                    error: mockError,
                    message: 'Error in crearing product',
                })
            );
        });
    });

    // =======================================
    // 2. deleteProductController 
    // =======================================
    describe('deleteProductController', () => {

        const deleteProductId = '12345pid';

        // T1: Success Path - Deleting by product ID (pid)
        it('should successfully delete a product and return 200', async () => {
            const req = mockReq({}, {}, { pid: deleteProductId });
            const res = mockRes();
            
            productModel.findByIdAndDelete.mockReturnValueOnce({ 
                select: jest.fn().mockResolvedValue({ deletedCount: 1 }) 
            });

            await deleteProductController(req, res);

            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(deleteProductId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, message: 'Product Deleted successfully' })
            );
        });

        // T2: Failure Path - Catch block error
        it('should return 500 error if an exception occurs during deletion', async () => {
            const req = mockReq({}, {}, { pid: deleteProductId });
            const res = mockRes();
            const mockError = new Error('DB Delete Failed');
            
            // Force the findByIdAndDelete to throw an error
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

    // =======================================
    // 3. updateProductController 
    // =======================================
    describe('updateProductController', () => {
        
        // T1: Success Path - Update fields and a NEW photo
        // T1: Success Path - Update fields and a NEW photo
it('should successfully update product fields and photo and return 201', async () => {

    const updateFields = { ...VALID_FIELDS, name: 'Updated Product Name' };
    const req = mockReq(updateFields, { photo: VALID_PHOTO }, { pid: productId });
    const res = mockRes();
    

    const mockSave = jest.fn().mockResolvedValue({ _id: productId, ...updateFields });
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
    expect(fs.readFileSync).toHaveBeenCalledWith(VALID_PHOTO.path);
    

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ 
            success: true, 
            message: "Product Updated Successfully",
        })
    );

    expect(productModel).not.toHaveBeenCalled(); 
});

        // T2: Success Path - Update fields WITHOUT changing photo
        // T2: Success Path - Update fields WITHOUT changing photo
it('should successfully update product fields without photo and return 201', async () => {
    const updateFields = { ...VALID_FIELDS, description: 'New Description' };
    const req = mockReq(updateFields, {}, { pid: productId }); // 无 photo file
    const res = mockRes();


    const mockSave = jest.fn().mockResolvedValue({ _id: productId, ...updateFields });
    const mockUpdatedProduct = {
        _id: productId,
        ...updateFields,
        save: mockSave,
        photo: { data: Buffer.from('mock'), contentType: 'image/jpeg' }, // 模拟原有 photo 数据
    };

    // Mock findByIdAndUpdate
    productModel.findByIdAndUpdate.mockResolvedValueOnce(mockUpdatedProduct);

    await updateProductController(req, res);


    expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        productId,
        expect.objectContaining({ slug: slugify(updateFields.name) }),
        { new: true }
    );

    expect(mockSave).toHaveBeenCalled();
    expect(fs.readFileSync).not.toHaveBeenCalled(); 
    

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ 
            success: true, 
        })
    );

    expect(productModel).not.toHaveBeenCalled(); 
});

        // T3: Failure Path - Validation (photo size too large)
        it('should return 500 error if photo size exceeds 1MB', async () => {
            const req = mockReq(VALID_FIELDS, { photo: { size: 1000001 } }, { pid: productId });
            const res = mockRes();

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'photo is Required and should be less then 1mb',
            });
            expect(productModel).not.toHaveBeenCalled();
        });

        // T4: Failure Path - Validation (missing required field: name)
        it('should return 500 error if name is missing during update', async () => {
            const fields = { ...VALID_FIELDS, name: undefined };
            const req = mockReq(fields, {}, { pid: productId });
            const res = mockRes();

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
        });
        
        // T5: Failure Path - Catch block error
it('should return 500 error if an exception occurs during update', async () => {
    const req = mockReq(VALID_FIELDS, {}, { pid: productId });
    const res = mockRes();
    
    const mockSaveError = new Error('Update Save Failed');
    
    const mockSave = jest.fn().mockRejectedValue(mockSaveError); 
    
 
    const mockProductInstance = {
        save: mockSave,
        photo: {}, 
    };

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

it('should return 500 error if description is missing', async () => {
    const fields = { ...VALID_FIELDS, description: undefined };
    const req = mockReq(fields, {}, { pid: productId }); 
    const res = mockRes();

    await updateProductController(req, res); 

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
    expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled(); 
});

it('should return 500 error if price is missing', async () => {

    const fields = { ...VALID_FIELDS, price: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required' });
    expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled(); 
});

it('should return 500 error if category is missing', async () => {

    const fields = { ...VALID_FIELDS, category: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
    expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled(); 
});

it('should return 500 error if quantity is missing', async () => {

    const fields = { ...VALID_FIELDS, quantity: undefined };
    const req = mockReq(fields, {}, { pid: productId });
    const res = mockRes();

    await updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required' });
    expect(productModel.findByIdAndUpdate || productModel).not.toHaveBeenCalled(); 
});
    });
});