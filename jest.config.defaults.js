/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  coveragePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {'generated/(.*)': '<rootDir>/generated/$1'},
  testEnvironment: 'jsdom',

  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

  testRegex: '/__tests__/index.tsx?$',
}
