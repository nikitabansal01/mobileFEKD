module.exports = {
  preset: 'jest-expo',
  // Previously '<rootDir>/src' only, which made every module outside src/
  // structurally untestable: a test placed beside a screen or a legacy
  // service simply would not run, and the suite still reported green.
  roots: ['<rootDir>/src', '<rootDir>/app', '<rootDir>/components', '<rootDir>/services'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/test/asyncStorageMock.ts',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/core/**/*.{ts,tsx}',
    'src/features/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test/**',
    '!src/core/api/v2.generated.ts',
  ],
  // A floor, not a target. It is set at the level the suite already clears so
  // coverage cannot silently regress; raise it as coverage grows rather than
  // setting an aspirational number that has to be disabled the first time CI
  // goes red.
  coverageThreshold: {
    global: {
      statements: 34,
      branches: 31,
      functions: 29,
      lines: 36,
    },
  },
};
