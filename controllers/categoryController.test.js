// import {
//   createCategoryController,
//   updateCategoryController,
//   deleteCategoryCOntroller,
//   categoryControlller,
//   singleCategoryController,
// } from "../controllers/categoryController.js";
// import categoryModel from "../models/categoryModel.js";
// import slugify from "slugify";

// jest.mock("../models/categoryModel.js");
// jest.mock("slugify");

/**
 * @jest-environment node - ESM-style for testing backend
 */
import { jest } from "@jest/globals";

const SaveMock = jest.fn(); // we’ll reuse per test

// Constructor function used by `new categoryModel(...)`
const CategoryModelMock = jest.fn().mockImplementation(() => ({
  save: SaveMock, // instance method for createCategory path
}));

// Static methods used elsewhere
CategoryModelMock.findOne = jest.fn();
CategoryModelMock.find = jest.fn();
CategoryModelMock.findByIdAndUpdate = jest.fn();
CategoryModelMock.findByIdAndDelete = jest.fn();

await jest.unstable_mockModule("../models/categoryModel.js", () => ({
  default: CategoryModelMock,
}));

await jest.unstable_mockModule("slugify", () => ({
  default: jest.fn(),
}));

// Now import SUT + mocks
const {
  createCategoryController,
  updateCategoryController,
  deleteCategoryCOntroller,
  categoryControlller,
  singleCategoryController,
} = await import("../controllers/categoryController.js");

const categoryModel = (await import("../models/categoryModel.js")).default; // <- the ctor
const slugify = (await import("slugify")).default;

describe("Category Controllers", () => {
  let req, res;

  let consoleSpy;
  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });
  afterAll(() => {
    consoleSpy.mockRestore();
  });

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
      const updatedCategory = {
        _id: "123",
        name: "UpdatedName",
        slug: "updatedname",
      };
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
      categoryModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Update failed")
      );
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
      categoryModel.findByIdAndDelete.mockRejectedValue(
        new Error("Delete failed")
      );
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

  // ------------------- LIST ALL ----------------------
  describe("categoryControlller (list all)", () => {
    it("returns 200 with empty list", async () => {
      categoryModel.find.mockResolvedValue([]);

      await categoryControlller(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: [],
      });
    });

    it("returns 200 with non-empty list", async () => {
      const docs = [{ _id: "1", name: "Books", slug: "books" }];

      categoryModel.find.mockResolvedValue(docs);

      await categoryControlller(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: docs,
      });
    });

    it("handles DB rejection with 500", async () => {
      const error = new Error("DB down");
      // const consoleSpy = jest
      //   .spyOn(console, "log")
      //   .mockImplementation(() => {});
      categoryModel.find.mockRejectedValue(error);

      await categoryControlller(req, res);

      expect(categoryModel.find).toHaveBeenCalledWith({});
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting all categories",
        })
      );

      // consoleSpy.mockRestore();
    });
  });

  // ---------- SINGLE ----------
  describe("singleCategoryController", () => {
    it("returns 200 with found category", async () => {
      req.params = { slug: "books" };
      const doc = { _id: "1", name: "Books", slug: "books" };
      categoryModel.findOne.mockResolvedValue(doc);

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "books" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get SIngle Category SUccessfully",
        category: doc,
      });
    });

    it("returns 200 with null when not found", async () => {
      req.params = { slug: "missing" };
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get SIngle Category SUccessfully",
        category: null,
      });
    });

    it("missing slug leads to 200/null — current behavior", async () => {
      // no req.params.slug
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: undefined });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get SIngle Category SUccessfully",
        category: null,
      });
    });

    it("handles DB rejection with 500", async () => {
      req.params = { slug: "err" };
      const error = new Error("DB down");
      // const consoleSpy = jest
      //   .spyOn(console, "log")
      //   .mockImplementation(() => {});
      categoryModel.findOne.mockRejectedValue(error);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While getting Single Category",
        })
      );
    });
  });
});
