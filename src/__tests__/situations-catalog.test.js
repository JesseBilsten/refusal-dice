/**
 * The Odds Lab's questions from the table (situations-catalog.js) must ask
 * about keeps the rules allow (docs/RULES.md §3.1).
 */
const { isKickerGame, isLegalKeep } = require('../engine')
const { keepOptions } = require('../strategy')
const { SITUATIONS } = require('../components/OddsLab/situations-catalog')
const { goalFor, lockedPositions } = require('../components/OddsLab/keep-model')

const LONE_KEEP = { montereyLoneKeep: true }

test.each(Object.entries(SITUATIONS).filter(([, q]) => isKickerGame(q.s.game)))(
  '%s: every keep asked about, and every keep offered, is legal',
  (_, { s }) => {
    const dice = s.roll.split('').map(Number)
    const lockedAt = lockedPositions(dice, s.kept)
    const locked = lockedAt.map((i) => dice[i])
    // Legal by the standard rules, or (a lone 3 or 4) only under the Monterey house rule
    ;(s.ask || []).forEach((digits) => {
      const kept = digits.split('').map(Number)
      expect(isLegalKeep(kept, s.game, locked) || isLegalKeep(kept, s.game, locked, LONE_KEEP)).toBe(true)
    })
    keepOptions(dice, s.rolls, goalFor(s, null), { locked: lockedAt })
      .filter((o) => !o.stand)
      .forEach((o) => expect(isLegalKeep(o.dice, s.game, locked)).toBe(true))
  }
)
