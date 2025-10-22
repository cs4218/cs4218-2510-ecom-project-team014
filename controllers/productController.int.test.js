import { jest } from "@jest/globals";

// ----------------- MOCKS -----------------
const fsMock = { readFileSync: jest.fn().mockReturnValue(Buffer.from("mock photo data")) };
await jest.unstable_mockModule("fs", () => ({ default: fsMock }));

const slugifyMock = jest.fn();
await jest.unstable_mockModule("slugify", () => ({ default: slugifyMock }));

const ProductModelMock = jest.fn(function (data) {
  this.data = data;
  this.photo = {};
  this.save = jest.fn().mockResolvedValue(this); // important
});
ProductModelMock.findByIdAndUpdate = jest.fn();
ProductModelMock.findByIdAndDelete = jest.fn();

await jest.unstable_mockModule("../models/productModel.js", () => ({ default: ProductModelMock }));
await jest.unstable_mockModule("../models/categoryModel.js", () => ({ default: {} }));
await jest.unstable_mockModule("../models/orderModel.js", () => ({ default: {} }));

// ----------------- IMPORT CONTROLLERS -----------------
const {
  createProductController,
  updateProductController,
  deleteProductController,
} = await import("../controllers/productController.js");

const fs = (await import("fs")).default;
const slugify = (await import("slugify")).default;

// ----------------- TESTS -----------------
describe("Product Controller", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    req = { fields: {}, files: {}, params: {}, user: { _id: "user1" } };
    res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
  });

  // CREATE
  test("createProductController success", async () => {
    req.fields = { name: "Book", description: "desc", price: 10, category: "1", quantity: 5 };
    req.files = { photo: { path: "/mock.jpg", type: "image/jpeg", size: 500000 } };
    slugify.mockReturnValue("book");

    ProductModelMock.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ ...req.fields, slug: "book" }),
      photo: {},
    }));

    await createProductController(req, res);

    expect(fs.readFileSync).toHaveBeenCalledWith("/mock.jpg");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Product Created Successfully" })
    );
  });

  // UPDATE
  test("updateProductController success", async () => {
    req.params = { pid: "123" };
    req.fields = { name: "Updated", description: "desc", price: 20, category: "1", quantity: 5 };
    req.files = { photo: { path: "/update.jpg", type: "image/jpeg", size: 500000 } };
    slugify.mockReturnValue("updated");

    const productInstance = { save: jest.fn().mockResolvedValue({ ...req.fields, slug: "updated" }), photo: {} };
    ProductModelMock.findByIdAndUpdate.mockResolvedValue(productInstance);

    await updateProductController(req, res);

    expect(fs.readFileSync).toHaveBeenCalledWith("/update.jpg");
    expect(productInstance.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Product Updated Successfully" })
    );
  });

  // DELETE
test("deleteProductController success", async () => {
  req.params = { pid: "1" };

  ProductModelMock.findByIdAndDelete = jest.fn(() => ({
    select: jest.fn().mockResolvedValue({}),
  }));

  await deleteProductController(req, res);

  expect(ProductModelMock.findByIdAndDelete).toHaveBeenCalledWith("1");
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.send).toHaveBeenCalledWith(
    expect.objectContaining({ success: true, message: "Product Deleted successfully" })
  );
});
});
