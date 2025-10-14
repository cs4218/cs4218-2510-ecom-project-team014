import { jest } from "@jest/globals";

// In case any other test mocked mongoose/model earlier:
jest.resetModules();

import Category from "./categoryModel.js";

describe("Category schema (unit test - assert paths and types of schema fields)", () => {
  test("has expected paths and types", () => {
    const { paths } = Category.schema;

    expect(paths).toHaveProperty("name");
    expect(paths).toHaveProperty("slug");

    expect(paths.name.instance).toBe("String");
    expect(paths.slug.instance).toBe("String");
  });

  test("slug is configured to lowercase", () => {
    const { paths } = Category.schema;
    expect(paths.slug.options.lowercase).toBe(true);
  });

  test("name is required", () => {
    const namePath = Category.schema.path("name");

    // A) direct option (covers required: true or [true, "msg"])
    const opt = namePath?.options?.required;
    const optionSaysRequired =
      opt === true || (Array.isArray(opt) && opt[0] === true);

    // B) validator presence (works across Mongoose versions)
    const hasRequiredValidator =
      Array.isArray(namePath?.validators) &&
      namePath.validators.some(
        (v) => v?.type === "required" || v?.kind === "required"
      );

    expect(optionSaysRequired || hasRequiredValidator).toBe(true);
  });

  test("unique index declared for name", () => {
    const indexes = Category.schema.indexes();
    const hasUniqueName = indexes.some(
      ([fields, opts]) => fields.name === 1 && opts?.unique
    );
    expect(hasUniqueName).toBe(true);
  });
});
