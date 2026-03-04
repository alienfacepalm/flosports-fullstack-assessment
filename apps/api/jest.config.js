module.exports = {
  displayName: 'api',
  testEnvironment: 'node',
  preset: '../../jest.preset.js',
  roots: ['<rootDir>/src', '<rootDir>/../../libs/api/events/data-access/src'],
  moduleNameMapper: {
    '^data-access$': '<rootDir>/../../libs/api/events/data-access/src/index.ts',
  },
  modulePathIgnorePatterns: ['<rootDir>/../../dist/'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../coverage/apps/api',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts'],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
