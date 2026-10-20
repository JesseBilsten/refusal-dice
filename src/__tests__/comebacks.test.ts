import { comebackOf, comebackTable, comebacksAfter } from '../strategy'

describe('comebacks: the Hammer’s second call, exact over every roll', () => {
  const table = comebackTable()

  test('every roll is counted once, and each first call’s comebacks add up to all its rolls', () => {
    expect(table.reduce((s, f) => s + f.ways, 0)).toBe(7776)
    table.forEach((f) => {
      expect(f.comebacks.reduce((s, c) => s + c.ways, 0)).toBe(f.ways)
      expect(f.comebacks.reduce((s, c) => s + c.share, 0)).toBeCloseTo(1, 12)
    })
  })

  test('a comeback is always a different game (§2: not just the other variant)', () => {
    table.forEach((f) => f.comebacks.forEach((c) => expect(c.call.game).not.toBe(f.call.game)))
  })

  test('the table’s hunch holds: after 10-3 Low or Monterey Low, 10-4 Low is the likeliest comeback', () => {
    for (const first of [
      { game: '10-3', variant: 'low' },
      { game: 'monterey', variant: 'low' },
    ] as const) {
      expect(comebacksAfter(first)!.comebacks[0].call).toEqual({ game: '10-4', variant: 'low' })
    }
    const tops = comebackOf('10-4').filter((x) => x.top).map((x) => `${x.first.game} ${x.first.variant}`)
    expect(tops).toEqual(expect.arrayContaining(['10-3 low', 'monterey low']))
  })
})
