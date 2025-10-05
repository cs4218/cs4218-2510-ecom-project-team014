import { createCategoryController, updateCategoryController, deleteCategoryCOntroller } from "../controllers/categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

jest.mock("../models/categoryModel.js");
jest.mock("slugify");

describe("Category Controllers", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // ------------------- CREATE CATEGORY -------------------
  describe("createCategoryController", () => {
    it("should return 401 if name is missing", async () => {
      req.body = {};
      await createCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    it("should return 200 if category already exists", async () => {
      req.body = { name: "Electronics" };
      categoryModel.findOne.mockResolvedValue({ name: "Electronics" });
      await createCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exisits",
      });
    });

    it("should create new category if not exists", async () => {
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

    it("should handle server errors", async () => {
      req.body = { name: "ErrorCategory" };
      categoryModel.findOne.mockRejectedValue(new Error("DB Error"));
      await createCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in Category",
        })
      );
    });
  });

  // ------------------- UPDATE CATEGORY -------------------
  describe("updateCategoryController", () => {
    it("should update category successfully", async () => {
      req.params = { id: "123" };
      req.body = { name: "UpdatedName" };
      slugify.mockReturnValue("updatedname");
      const updatedCategory = { _id: "123", name: "UpdatedName", slug: "updatedname" };
      categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      await updateCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        messsage: "Category Updated Successfully",
        category: updatedCategory,
      });
    });

    it("should handle update errors", async () => {
      categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("Update failed"));
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

  // ------------------- DELETE CATEGORY -------------------
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

    it("should handle delete errors", async () => {
      categoryModel.findByIdAndDelete.mockRejectedValue(new Error("Delete failed"));
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
