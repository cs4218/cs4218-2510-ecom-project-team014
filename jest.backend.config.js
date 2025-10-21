export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  transform: { "^.+\\.[jt]sx?$": "babel-jest" },

  // which test to run

  testMatch: [
    /*"<rootDir>/controllers/categoryController.test.js",
    "<rootDir>/controllers/productController.test.js",
    "<rootDir>/controllers/braintreeTokenController.test.js",
    "<rootDir>/models/categoryModel.test.js",
    "<rootDir>/models/productModel.test.js",*/
    //"<rootDir>/tests/integration/helpers/authHelper.int.test.js",
    //"<rootDir>/tests/integration/middlewares/authMiddleware.int.test.js",
    "<rootDir>/tests/integration/controllers/authController.int.test.js",    
    
  ],

  // jest code coverage
  collectCoverage: true,

  collectCoverageFrom: [
    //"<rootDir>/controllers/categoryController.js",
    //"<rootDir>/controllers/productController.js",
    //"<rootDir>/models/categoryModel.js",
    //"<rootDir>/models/productModel.js",
    //"<rootDir>/helpers/authHelper.js",
    "<rootDir>/controllers/authController.js",
  ],

  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },

  setupFiles: ["dotenv/config"],
  },
};
