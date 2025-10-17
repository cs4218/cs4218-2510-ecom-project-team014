export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  transform: { "^.+\\.[jt]sx?$": "babel-jest" },

  // helpful for bare ESM path imports with .js extension
  // moduleNameMapper: {
  //   "^(\\.{1,2}/.*)\\.js$": "$1.js",
  // },

  // which test to run

  // "<rootDir>/controllers/*.test.js", "<rootDir>/models/*.test.js",

  testMatch: [
    "<rootDir>/controllers/categoryController.test.js",
    "<rootDir>/controllers/productController.test.js",
    "<rootDir>/controllers/braintreeTokenController.test.js",
    "<rootDir>/models/categoryModel.test.js",
    "<rootDir>/models/productModel.test.js",
  ],

  // jest code coverage
  collectCoverage: true,

  // "controllers/**", "models/**",
  //   "helpers/**",
  //   "middlewares/**"
  collectCoverageFrom: [
    "<rootDir>/controllers/categoryController.js",
    "<rootDir>/controllers/productController.js",
    // "<rootDir>/controllers/braintreeTokenController.js",
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
