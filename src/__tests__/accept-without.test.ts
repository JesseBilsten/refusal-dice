import {
  ACCEPT_ODDS,
  acceptLean,
  acceptOddsFor,
  acceptOddsOf,
  holdingOf,
} from '../strategy'
import { DEFAULT_HOUSE_RULES, Dice, KICKER_GAMES, KeepRules } from '../engine'

const SCC_LOW = { game: 'ship-captain-crew' as const, variant: 'low' as const }

describe('holdingOf', () => {
  it('reads a partial match, its keep and its exact chance', () => {
    const h = holdingOf([1, 5, 2, 4, 1], SCC_LOW)!
    expect(h.kind).toBe('partial')
    expect(h.kept).toEqual([1, 2])
    // Keep 1-2, roll three dice twice for a 3
    expect(h.chance).toBeCloseTo(1 - (5 / 6) ** 6, 6)
  })

  it('reads a made game and nothing to keep', () => {
    expect(holdingOf([1, 2, 3, 6, 6], SCC_LOW)!.kind).toBe('made')
    // The 10s come in one roll: nothing to keep
    const tens = holdingOf([1, 1, 2, 3, 3], { game: '10-2', variant: 'high' })!
    expect(tens).toMatchObject({ kind: 'nothing', key: 'nothing' })
    // Two fresh rolls of five
    const one =
      1 - holdingOf([1, 1, 2, 2, 3], { game: '10-2', variant: 'high' })!.chance
    expect(tens.chance).toBeCloseTo(1 - one, 9)
  })

  it('keeps 3-4 in Monterey, and a lone 3 only under the house rule', () => {
    const monterey = { game: 'monterey' as const, variant: 'high' as const }
    expect(holdingOf([1, 3, 4, 6, 6], monterey)!.key).toBe('34')
    const lone: KeepRules = { ...DEFAULT_HOUSE_RULES, montereyLoneKeep: true }
    expect(holdingOf([1, 1, 3, 6, 6], monterey)!.kind).toBe('nothing')
    expect(holdingOf([1, 1, 3, 6, 6], monterey, lone)!.key).toBe('3')
  })

  it('has no holding for a specialty game', () => {
    expect(holdingOf([1, 2, 3, 4, 5], { game: 'razzle' })).toBeNull()
  })
})

describe('accept-odds.ts', () => {
  const calls = KICKER_GAMES.flatMap((game) =>
    (['high', 'low'] as const).map((variant) => ({ game, variant }))
  )

  it('covers every kicker call from both seats, for both rule sets', () => {
    for (const set of ['standard', 'lone-keep'] as const)
      for (const c of calls)
        for (const pos of [1, 2] as const)
          expect(
            ACCEPT_ODDS[set][`${c.game} ${c.variant}`][pos].length
          ).toBeGreaterThan(1)
  })

  it('splits every roll between the holdings, made it first and nothing last', () => {
    for (const c of calls)
      for (const pos of [1, 2] as const) {
        const rows = acceptOddsFor(c, pos, 3)
        expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 1)
        expect(rows.reduce((s, r) => s + r.rolls, 0)).toBe(252)
        expect(rows[0].kind).toBe('made')
        expect(rows[rows.length - 1].kind).toBe('nothing')
      }
  })

  it('matches each holding to the rolls holdingOf sorts into it', () => {
    // The share of SCC rolls that keep 1-2, counted here over all 7,776 rolls
    let ways = 0
    const rec = (acc: number[]) => {
      if (acc.length === 5) {
        if (holdingOf(acc as Dice, SCC_LOW)!.key === '12') ways++
        return
      }
      for (let f = 1; f <= 6; f++) rec([...acc, f])
    }
    rec([])
    const row = acceptOddsFor(SCC_LOW, 2, 6).find((r) => r.key === '12')!
    expect(row.share).toBeCloseTo(ways / 7776, 2)
  })

  it('says accept when the game is made', () => {
    for (const c of calls)
      expect(acceptOddsFor(c, 2, 3)[0].verdict).toBe('accept')
  })

  it('reads 2–4 players from the 3-player figures and 5–8 from the 6-player', () => {
    expect(acceptOddsFor(SCC_LOW, 1, 4)[0].players).toBe(3)
    expect(acceptOddsFor(SCC_LOW, 1, 8)[0].players).toBe(6)
  })

  it('reads the lone-keep figures under that rule', () => {
    const monterey = { game: 'monterey' as const, variant: 'low' as const }
    const lone = { ...DEFAULT_HOUSE_RULES, montereyLoneKeep: true }
    const keys = (r?: KeepRules) =>
      acceptOddsFor(monterey, 1, 3, r).map((o) => o.key)
    expect(keys()).not.toContain('3')
    expect(keys(lone)).toContain('3')
  })

  it('finds a roll’s own holding', () => {
    const r = acceptOddsOf([1, 5, 2, 4, 1], SCC_LOW, 2, 6)!
    expect(r.holding.key).toBe('12')
    expect(r.odds!.key).toBe('12')
    expect(r.odds!.players).toBe(6)
  })

  it('words the lean', () => {
    const o = acceptOddsFor(SCC_LOW, 2, 3)[0]
    expect(acceptLean({ ...o, verdict: 'accept', gain: 0.052 })).toBe(
      'accept by 5 points'
    )
    expect(acceptLean({ ...o, verdict: 'refuse', gain: -0.006 })).toBe(
      'refuse by 1 point'
    )
    expect(acceptLean({ ...o, verdict: 'tossup' })).toBe('a toss-up')
  })
})
