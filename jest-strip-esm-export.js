/**
 * Jest transformer that strips the trailing ESM `export { ... }` block
 * from game-validation.js so Jest can load it as CommonJS.
 *
 * The file intentionally has BOTH module.exports (for Node/CJS) and
 * export {} (for Gatsby/Webpack ESM).  Jest only needs the CJS path.
 */
module.exports = {
  process(src) {
    // Remove `export { ... }` or `export { ... };` block (possibly multiline)
    const stripped = src.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '')
    return { code: stripped }
  },
}
