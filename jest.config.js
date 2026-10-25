const transform = { '^.+\\.[jt]sx?$': 'babel-jest' };
module.exports = {
  watchman: false,
  projects: [
    {
      displayName: 'domain',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.domain.setup.js'],
      testMatch: ['<rootDir>/__tests__/domain/**/*.test.ts'],
      transform,
    },
    {
      displayName: 'ui',
      preset: '@react-native/jest-preset',
      testMatch: ['<rootDir>/__tests__/ui/**/*.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*)/)',
      ],
    },
  ],
};
