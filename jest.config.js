const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '__tests__/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(remark.*)/)',
  ],
};

module.exports = createJestConfig(customJestConfig);
