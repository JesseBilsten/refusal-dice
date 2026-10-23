#!/usr/bin/env node
/**
 * CI: a pull request must bump package.json's version above the base
 * branch's (docs/WORKFLOW.md). Usage: node scripts/check-version.js <base version>
 */
const { version } = require('../package.json')
const base = process.argv[2]
const parse = (v) => v.split('.').map(Number)
const [a, b] = [parse(version), parse(base)]
const higher =
  a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2]
if (!higher) {
  console.error(
    `package.json is ${version}, not higher than the base branch's ${base}. Bump it (major.minor.patch) and add the release to CHANGELOG.md.`
  )
  process.exit(1)
}
if (
  !require('fs')
    .readFileSync(require('path').join(__dirname, '../CHANGELOG.md'), 'utf8')
    .includes(`## ${version}`)
) {
  console.error(`CHANGELOG.md has no entry for ${version}.`)
  process.exit(1)
}
console.log(`Version ${base} → ${version}`)
