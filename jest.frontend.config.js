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
  testMatch: ["<rootDir>/client/src/pages/Auth/*.test.js", "<rootDir>/client/src/pages/admin/*.test.js", "<rootDir>/client/src/components/Form/*.test.js", "<rootDir>/client/src/components/Routes/*.test.js", "<rootDir>/client/src/components/*.test.js", "<rootDir>/client/src/pages/user/*.test.js", "<rootDir>/client/src/context/*.test.js",],

  // jest code coverage
  // Daniel: Updated collectCoverageFrom from pages/Auth/*.js to pages/**/*.js to include all js files in pages directory
  collectCoverage: true,
  collectCoverageFrom: ["client/src/pages/Auth/**", "client/src/pages/admin/**", "client/src/components/Form/**", "client/src/components/Routes/**", "client/src/components/**", "client/src/pages/user/**", "client/src/context/auth.js"],

  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
