export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/authController.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js"
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/authController.js",
    "helpers/**",
    "middlewares/**",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
