// TypeScript (src/engine) is compiled by babel-jest with an inline config so
// no project-level Babel config exists for Gatsby to pick up.
const tsBabel = {
  babelrc: false,
  configFile: false,
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
}

module.exports = {
  testMatch: ['<rootDir>/src/__tests__/**/*.test.{js,ts}'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    // game-validation.js uses both CJS module.exports and an ESM export block.
    // Strip the ESM export so Node/Jest can load it as CJS.
    'game-validation\\.js$': '<rootDir>/jest-strip-esm-export.js',
    '\\.ts$': ['babel-jest', tsBabel],
  },
  // Don't ignore src/lib since our code lives there
  transformIgnorePatterns: ['/node_modules/'],
}
