module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/test/asyncStorageMock.ts',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/core/**/*.{ts,tsx}',
    'src/features/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
  ],
};
