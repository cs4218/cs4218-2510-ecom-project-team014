export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  transform: { "^.+\\.[jt]sx?$": "babel-jest" },

  // which test to run

  testMatch: [
    "<rootDir>/controllers/categoryController.test.js",
    "<rootDir>/controllers/productController.test.js",
    "<rootDir>/controllers/braintreeTokenController.test.js",
    "<rootDir>/models/categoryModel.test.js",
    "<rootDir>/models/productModel.test.js",
  ],

  // jest code coverage
  collectCoverage: true,

  collectCoverageFrom: [
    "<rootDir>/controllers/categoryController.js",
    "<rootDir>/controllers/productController.js",
    "<rootDir>/models/categoryModel.js",
    "<rootDir>/models/productModel.js",
  ],

  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
