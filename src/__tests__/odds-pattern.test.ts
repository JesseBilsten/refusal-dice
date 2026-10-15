/**
 * The odds-decision pattern's helpers (src/components/Odds/model.ts).
 */
import {
  fmtPct,
  inWords,
  rankOptions,
  twoDiceGrid,
} from '../components/Odds/model'

test('fmtPct never shows a possible outcome as 0% or 100%', () => {
  expect(fmtPct(0.7708)).toBe('77%')
  expect(fmtPct(0.7708, 1)).toBe('77.1%')
  expect(fmtPct(0)).toBe('0%')
  expect(fmtPct(1)).toBe('100%')
  expect(fmtPct(0.0004)).toBe('<1%')
  expect(fmtPct(0.0004, 1)).toBe('<0.1%')
  expect(fmtPct(0.9996)).toBe('>99%')
})

test('inWords gives a simple natural frequency', () => {
  expect(inWords(0.5)).toBe('1 in 2')
  expect(inWords(1 / 12)).toBe('1 in 12')
  expect(inWords(1 / 6)).toBe('1 in 6')
  expect(inWords(0.7708)).toBe('about 3 in 4')
  expect(inWords(25 / 36)).toBe('about 2 in 3')
  expect(inWords(0)).toBe('never')
  expect(inWords(1)).toBe('always')
})

test('rankOptions totals the slices and marks the best', () => {
  const ranked = rankOptions([
    {
      id: 'tie',
      label: 'Take the tie',
      segments: [{ p: 0.5, label: 'x', kind: 'coin' }],
    },
    {
      id: 'roll',
      label: 'Roll',
      segments: [
        { p: 0.69, label: 'a', kind: 'lose' },
        { p: 0.08, label: 'b', kind: 'coin' },
      ],
    },
  ])
  expect(ranked.map((o) => [o.id, o.best])).toEqual([
    ['tie', true],
    ['roll', false],
  ])
  expect(ranked[1].total).toBeCloseTo(0.77, 12)
  // Higher is better (e.g. the chance of making a game)
  expect(
    rankOptions(
      [
        {
          id: 'a',
          label: 'A',
          segments: [{ p: 0.3, label: 'x', kind: 'safe' }],
        },
        {
          id: 'b',
          label: 'B',
          segments: [{ p: 0.6, label: 'x', kind: 'safe' }],
        },
      ],
      false
    ).find((o) => o.best)?.id
  ).toBe('b')
  // A real toss-up marks both
  expect(
    rankOptions([
      { id: 'a', label: 'A', segments: [{ p: 0.5, label: 'x', kind: 'coin' }] },
      {
        id: 'b',
        label: 'B',
        segments: [{ p: 0.502, label: 'x', kind: 'coin' }],
      },
    ]).every((o) => o.best)
  ).toBe(true)
})

test('twoDiceGrid covers all 36 ordered rolls', () => {
  const cells = twoDiceGrid((a, b) =>
    a + b > 10 ? 'better' : a + b === 10 ? 'equal' : 'worse'
  )
  expect(cells).toHaveLength(36)
  const count = (k: string) => cells.filter((c) => c.kind === k).length
  expect([count('better'), count('equal'), count('worse')]).toEqual([3, 3, 30])
})
