export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/models/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/tests/integration/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "models/**",
    "helpers/**",
    "middlewares/**"],

  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
