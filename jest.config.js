const nextJest = require('next/jest')
const defaultConfig = require('./jest.config.defaults')

const createJestConfig = nextJest({dir: './'})

/** @type {import('@jest/types').Config.InitialOptions} */
const customJestConfig = {
  ...defaultConfig,
}

module.exports = createJestConfig(customJestConfig)
