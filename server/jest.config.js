module.exports = {
  testEnvironment: 'node',
  preset: '@shelf/jest-mongodb',
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>'],
  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', '/client/'],
  // Automatically clear mock calls, instances and results before every test
  clearMocks: true,
  // Global setup file path. This file will be executed once before all test suites.
  // globalSetup: '<rootDir>/test-global-setup.js', // If needed later
  // Global teardown file path. This file will be executed once after all test suites.
  // globalTeardown: '<rootDir>/test-global-teardown.js', // If needed later
  // A path to a module which exports an async function that is triggered once before all test suites
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'], // For setup after environment but before tests
};
