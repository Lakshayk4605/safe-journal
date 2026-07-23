module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/tests/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/tests/setupEnv.ts'],
  clearMocks: true,
  verbose: true,
};
