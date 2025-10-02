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
  // Daniel: Updated from pages/Auth/*.test.js  to **/**/*.test.js to include all test files in pages directory
  testMatch: ["<rootDir>/client/src/pages/**/*.test.js", "<rootDir>/client/src/components/**/*.test.js"],

  // jest code coverage
  // Daniel: Updated collectCoverageFrom from pages/Auth/*.js to pages/**/*.js to include all js files in pages directory
  collectCoverage: true,
  collectCoverageFrom: ["client/src/pages/Auth/*.js", "client/src/pages/user/Orders.js","client/src/pages/user/Profile.js", "client/src/components/Footer.js","client/src/components/Header.js","client/src/components/Layout.js","client/src/components/Spinner.js", "client/src/pages/About.js", "client/src/pages/Pagenotfound.js"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
