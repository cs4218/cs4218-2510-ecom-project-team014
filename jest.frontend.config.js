export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: [
    "<rootDir>/client/src/hooks/useCategory.test.js",
    "<rootDir>/client/src/pages/Categories.test.js",
    "<rootDir>/client/src/pages/ProductDetails.test.js",
    "<rootDir>/client/src/pages/CategoryProduct.test.js",
  ],

  // jest code coverage
  // Daniel: Updated collectCoverageFrom from pages/Auth/*.js to pages/**/*.js to include all js files in pages directory
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/client/src/hooks/useCategory.js",
    "<rootDir>/client/src/pages/Categories.js",
    "<rootDir>/client/src/pages/ProductDetails.js",
    "<rootDir>/client/src/pages/CategoryProduct.js",
  ],
  // "client/src/hooks/**"
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
