/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/jest.config.js'],
  collectCoverageFrom: [
    "./src/**/*.{ts,js}",
    "!src/**/*.styled.ts",
    "!src/**/*.mock.ts",
    "!src/pages/**",
    "!src/config/**",
    "!src/data/**",
    "!src/model/**",
    "!src/**/*.types.ts",
    "!src/*.ts"
  ]
};
