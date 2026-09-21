/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
    'src/middleware/**/*.ts',
    'src/routes/webhooks.ts',
    'src/routes/matching.ts',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 20000,
};
