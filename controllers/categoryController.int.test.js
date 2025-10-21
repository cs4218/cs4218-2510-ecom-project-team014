import { jest } from "@jest/globals";

// Mock model and slugify
const SaveMock = jest.fn();

const CategoryModelMock = jest.fn().mockImplementation(() => ({
  save: SaveMock,
}));
CategoryModelMock.findOne = jest.fn();
CategoryModelMock.findByIdAndUpdate = jest.fn();
CategoryModelMock.findByIdAndDelete = jest.fn();

// Mock slugify
const slugifyMock = jest.fn();

await jest.unstable_mockModule("../models/categoryModel.js", () => ({
  default: CategoryModelMock,
}));
await jest.unstable_mockModule("slugify", () => ({
  default: slugifyMock,
}));

const {
  createCategoryController,
  updateCategoryController,
  deleteCategoryCOntroller,
} = await import("../controllers/categoryController.js");

const categoryModel = (await import("../models/categoryModel.js")).default;
const slugify = (await import("slugify")).default;

describe("Category Controller Integration Tests", () => {
  let req, res;
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => { });
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
        jest.restoreAllMocks();
    });

  // ------------------- CREATE -------------------
  describe("createCategoryController", () => {
    it("should return 401 if name is missing", async () => {
      req.body = {};
      await createCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    it("should return 200 if category exists", async () => {
      req.body = { name: "Electronics" };
      categoryModel.findOne.mockResolvedValue({ name: "Electronics" });
      await createCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
    });

    it("should create new category", async () => {
      req.body = { name: "Books" };
      categoryModel.findOne.mockResolvedValue(null);
      slugify.mockReturnValue("books");
      const savedCategory = { _id: "1", name: "Books", slug: "books" };
      categoryModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedCategory),
      }));

      await createCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "new category created",
        category: savedCategory,
      });
    });
  });

  // ------------------- UPDATE -------------------
  describe("updateCategoryController", () => {
    it("should update category successfully", async () => {
      req.params = { id: "123" };
      req.body = { name: "Updated" };
      slugify.mockReturnValue("updated");
      const updatedCategory = { _id: "123", name: "Updated", slug: "updated" };
      categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      await updateCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: updatedCategory,
      });
    });

    it("should handle update error", async () => {
      categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("fail"));
      await updateCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while updating category",
        })
      );
    });
  });

  // ------------------- DELETE -------------------
  describe("deleteCategoryCOntroller", () => {
    it("should delete category successfully", async () => {
      req.params = { id: "1" };
      categoryModel.findByIdAndDelete.mockResolvedValue({});
      await deleteCategoryCOntroller(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Categry Deleted Successfully",
      });
    });

    it("should handle delete error", async () => {
      categoryModel.findByIdAndDelete.mockRejectedValue(new Error("fail"));
      await deleteCategoryCOntroller(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "error while deleting category",
        })
      );
    });
  });
});
