import { simulateHammer } from '../strategy'
import { hammerView } from '../components/HammerDecision/odds'

const name = (c: { game: string; variant?: string }) => (c.variant ? `${c.game} ${c.variant}` : c.game)
const bark = { pencil: 0.418, error: 0.0035, samples: 20000 }

describe('hammerView', () => {
  const calls = simulateHammer({ dice: [1, 2, 4, 4, 5], samples: 200 })
  const view = hammerView({ calls, bark, name })

  test('shows the best calls plus a bark, best first', () => {
    expect(view.options).toHaveLength(6)
    expect(view.options.filter((o) => o.call === null)).toHaveLength(1)
    const totals = view.options.map((o) => o.segments.reduce((s, x) => s + x.p, 0))
    totals.slice(1).forEach((t, i) => expect(t).toBeGreaterThanOrEqual(totals[i]))
  })

  test("each call's slices add up to its chance of the pencil", () => {
    view.options
      .filter((o) => o.call)
      .forEach((o) => {
        const sim = calls.find((c) => name(c.call) === name(o.call!))!
        expect(o.segments.reduce((s, x) => s + x.p, 0)).toBeCloseTo(sim.pencil, 10)
      })
  })

  test('a bark is one slice: its chance from the last seat', () => {
    const b = view.options.find((o) => o.call === null)!
    expect(b.segments).toEqual([expect.objectContaining({ p: bark.pencil })])
    expect(b.label).toBe('Bark')
  })

  test('the second call is named in its slice', () => {
    const decoy = view.options.find((o) => o.call && o.call.game === '10-4' && o.call.variant === 'low')
    if (decoy) expect(decoy.segments.some((s) => s.label.includes('you call 10-3 low'))).toBe(true)
  })
})
