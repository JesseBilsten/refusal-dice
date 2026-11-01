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

  test('the table’s hunch: 10-4 Low comes back after 10-3 Low, and is a top-two comeback after Monterey Low', () => {
    const tenFourLow = { game: '10-4', variant: 'low' }
    expect(comebacksAfter({ game: '10-3', variant: 'low' })!.comebacks[0].call).toEqual(tenFourLow)
    // Since ties became offers (2026-10-29), 7's Low edges it out after Monterey Low
    const afterMonterey = comebacksAfter({ game: 'monterey', variant: 'low' })!.comebacks.slice(0, 2).map((c) => c.call)
    expect(afterMonterey).toContainEqual(tenFourLow)
    const tops = comebackOf('10-4').filter((x) => x.top).map((x) => `${x.first.game} ${x.first.variant}`)
    expect(tops).toContain('10-3 low')
  })
})
