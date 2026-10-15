/**
 * The Strategy Assistant's accept-or-refuse screen: every figure it shows
 * adds up (src/components/RefusalDecision/odds.ts).
 */
import { Call } from '../engine'
import { simulateRefusal } from '../strategy'
import { rankOptions } from '../components/Odds/model'
import { refusalView } from '../components/RefusalDecision/odds'

const name = (c: Call) => `${c.game}${c.variant ? ` ${c.variant}` : ''}`

function view(position: 1 | 2, players: number, call: Call) {
  const dice = [1, 2, 4, 5, 6] as const
  const estimate = simulateRefusal({
    dice: [...dice],
    call,
    position,
    players,
    samples: 150,
  })
  return {
    estimate,
    view: refusalView({
      estimate,
      dice: [...dice],
      call,
      position,
      players,
      name,
    }),
  }
}

test('as 1st refusal at a 4-player table, refusing splits into two paths', () => {
  const { estimate, view: v } = view(1, 4, { game: '10-3', variant: 'high' })
  const [accept, refuse] = rankOptions(v.options)
  expect(accept.total).toBeCloseTo(estimate.accept.pencil, 12)
  // The refuse bar's slices add up to the simulated total
  expect(refuse.total).toBeCloseTo(estimate.refuse.pencil, 12)
  expect(v.nextCanAccept).toBe(true)
  // Branches cover every round, and weight back up to the refuse total
  expect(v.branches.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1, 10)
  expect(v.branches.reduce((s, b) => s + b.share * b.p, 0)).toBeCloseTo(
    estimate.refuse.pencil,
    10
  )
  expect(v.refuseSteps[v.refuseSteps.length - 1]).toMatchObject({ total: true })
  // Exact chance of making 10-3 from 1-2-4-5-6 with two re-rolls
  expect(v.makeIt).toBeGreaterThan(0.9)
  expect(v.tieMargin).toBeCloseTo(
    2 * Math.max(estimate.accept.error, estimate.refuse.error),
    12
  )
})

test('as 2nd refusal, refusing always means a second call', () => {
  const { view: v } = view(2, 3, { game: 'tres-away' })
  expect(v.nextCanAccept).toBe(false)
  expect(v.options[1].segments).toHaveLength(1)
  // One way to lose: just the total, no repeated product line
  expect(v.refuseSteps).toHaveLength(1)
  expect(v.branches.every((b) => b.label.startsWith('Second call'))).toBe(true)
  // Tres Away isn't a kicker game: no exact make chance
  expect(v.makeIt).toBeNull()
})
