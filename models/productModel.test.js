// models/productModel.test.js
import { jest } from "@jest/globals";

// In case any other test mocked mongoose/model earlier:
jest.resetModules();

import Products from "./productModel.js";

const isRequired = (schemaPath) => {
  const opt = schemaPath?.options?.required;
  const optionTrue = opt === true || (Array.isArray(opt) && opt[0] === true);
  const hasReqValidator =
    Array.isArray(schemaPath?.validators) &&
    schemaPath.validators.some(
      (v) => v?.type === "required" || v?.kind === "required"
    );
  return !!(optionTrue || hasReqValidator);
};

describe("Products schema (unit test - assert paths and types of schema fields)", () => {
  test("has expected paths & types", () => {
    const s = Products.schema;

    // simple string fields
    expect(s.path("name").instance).toBe("String");
    expect(s.path("slug").instance).toBe("String");
    expect(s.path("description").instance).toBe("String");

    // number fields
    expect(s.path("price").instance).toBe("Number");
    expect(s.path("quantity").instance).toBe("Number");

    // boolean
    expect(s.path("shipping").instance).toBe("Boolean");

    // Mongoose may report "ObjectID" or "ObjectId" depending on version
    expect(/ObjectId/i.test(s.path("category").instance)).toBe(true);
    expect(s.path("category").options.ref).toBe("Category");

    // photo subdocument
    expect(s.path("photo.data").instance).toBe("Buffer");
    expect(s.path("photo.contentType").instance).toBe("String");
  });

  test("required flags present on required fields", () => {
    const s = Products.schema;
    expect(isRequired(s.path("name"))).toBe(true);
    expect(isRequired(s.path("slug"))).toBe(true);
    expect(isRequired(s.path("description"))).toBe(true);
    expect(isRequired(s.path("price"))).toBe(true);
    expect(isRequired(s.path("category"))).toBe(true);
    expect(isRequired(s.path("quantity"))).toBe(true);

    // not required by spec and since schema already has other required fields for identification
    expect(isRequired(s.path("shipping"))).toBe(false);
    expect(isRequired(s.path("photo.data"))).toBe(false);
    expect(isRequired(s.path("photo.contentType"))).toBe(false);
  });

  test("timestamps enabled and expose createdAt/updatedAt Date paths", () => {
    const s = Products.schema;
    expect(s.options.timestamps).toBe(true);
    expect(s.path("createdAt").instance).toBe("Date");
    expect(s.path("updatedAt").instance).toBe("Date");
  });
});
