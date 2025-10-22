export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // inject globals for ESM compatibility
  injectGlobals: true,

  transform: { "^.+\\.[jt]sx?$": "babel-jest" },

  // which test to run
  testMatch: [
    "<rootDir>/controllers/**/*.test.js",
    "<rootDir>/controllers/**/*.int.test.js",
    "<rootDir>/models/**/*.test.js",
    "<rootDir>/models/**/*.int.test.js",
    "<rootDir>/helpers/**/*.test.js",
    "<rootDir>/helpers/**/*.int.test.js",
    "<rootDir>/middlewares/**/*.test.js",
    "<rootDir>/middlewares/**/*.int.test.js",
    "<rootDir>/routes/**/*.test.js",
    "<rootDir>/routes/**/*.int.test.js",
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/tests/**/*.int.test.js",
  ],

  // jest code coverage
  collectCoverage: true,

  collectCoverageFrom: [
    "<rootDir>/controllers/*.js",
    "<rootDir>/models/*.js",
    "<rootDir>/helpers/*.js",
    "<rootDir>/middlewares/*.js",
    "<rootDir>/routes/*.js",
    "!**/*.test.js",
    "!**/*.int.test.js",
    "!<rootDir>/routes/test.js",
  ],

  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },

  setupFiles: ["dotenv/config"],
};
