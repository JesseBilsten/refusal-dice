module.exports = {
  testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
  // game-validation.js uses both CJS module.exports and an ESM export block.
  // Strip the ESM export so Node/Jest can load it as CJS.
  transform: {
    'game-validation\\.js$': '<rootDir>/jest-strip-esm-export.js',
  },
  // Don't ignore src/lib since our code lives there
  transformIgnorePatterns: ['/node_modules/'],
}
