module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 86,
      lines: 96,
      statements: 92,
    },
  },
}
