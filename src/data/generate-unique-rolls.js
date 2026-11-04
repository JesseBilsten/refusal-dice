/**
 * Generates unique-rolls.json: the 252 distinct rolls of five dice (sorted
 * low to high), how many of the 7,776 ordered rolls each one is, and every
 * game it plays (analyzeRoll: the game, variant, kicker and dice used).
 *
 * Rules facts only, so the output is deterministic: regenerate it
 * (npm run generate:unique-rolls) when game-validation.js changes a rule.
 * How good each call is lives in the computed odds in src/strategy/.
 */
const fs = require('fs')
const path = require('path')
const { analyzeRoll } = require('../lib/game-validation')

const unique = new Map()
for (let i = 0; i < 7776; i++) {
  const roll = [0, 1, 2, 3, 4].map((d) => (Math.floor(i / Math.pow(6, d)) % 6) + 1).sort((a, b) => a - b)
  const key = roll.join('')
  if (!unique.has(key)) unique.set(key, { roll, count: 0 })
  unique.get(key).count++
}

const uniqueRolls = [...unique.values()]
  .sort((a, b) => a.roll.join('').localeCompare(b.roll.join('')))
  .map((r) => ({ ...r, analysis: analyzeRoll(r.roll) }))

const out = { totalRolls: 7776, uniqueCount: uniqueRolls.length, uniqueRolls }
const outputPath = path.join(__dirname, 'unique-rolls.json')
fs.writeFileSync(outputPath, JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${uniqueRolls.length} unique rolls to ${outputPath}`)
