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

  testMatch: ["<rootDir>/controllers/categoryController.test.js"],

  // jest code coverage
  collectCoverage: true,

  // "controllers/**", "models/**",
  //   "helpers/**",
  //   "middlewares/**"
  collectCoverageFrom: ["<rootDir>/controllers/categoryController.js"],

  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
