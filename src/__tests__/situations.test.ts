import { Dice } from '../engine'
import { Goal, judge, keepOptions, makeChance } from '../strategy'

const best = (dice: Dice, rerolls: number, goal: Parameters<typeof keepOptions>[2]) =>
  keepOptions(dice, rerolls, goal)[0]

const show = (dice: Dice, rerolls: number, goal: Parameters<typeof keepOptions>[2]) =>
  keepOptions(dice, rerolls, goal).map((o) => `${o.stand ? 'stand' : o.dice.join('') || 'none'} ${(o.win * 100).toFixed(1)}`)

test('making a game: the best option matches the exact make odds', () => {
  const rolls: Dice[] = [
    [2, 3, 6, 6, 1],
    [1, 1, 2, 5, 6],
    [4, 4, 4, 4, 4],
  ]
  for (const dice of rolls)
    for (const game of ['monterey', '10-4', 'pairs'] as const)
      for (const r of [1, 2])
        expect(best(dice, r, { kind: 'make', game }).win).toBeCloseTo(
          makeChance(dice, game, r),
          10
        )
})

test('Monterey 2-3-6-6-1: hold just the 3 with two rolls left, 2-3 with one', () => {
  const pick = (r: number, kept: string) =>
    keepOptions([2, 3, 6, 6, 1], r, { kind: 'make', game: 'monterey' }).find(
      (o) => !o.stand && o.dice.join('') === kept
    )!.win
  // A lone 3 keeps both 2-3-4 and 3-4-5 open, which pays off over two rolls
  expect(pick(2, '3')).toBeGreaterThan(pick(2, '23'))
  // With one roll, 2-3 needs only a 4
  expect(pick(1, '23')).toBeGreaterThan(pick(1, '3'))
  expect(pick(1, '23')).toBeCloseTo(1 - (5 / 6) ** 3, 10)
})

test('a made game stands at 100%', () => {
  const [top] = keepOptions([2, 3, 4, 6, 6], 2, { kind: 'make', game: 'monterey' })
  expect(top).toMatchObject({ stand: true, win: 1 })
})

test('kicker goal: a made hand re-rolls only its whole kicker', () => {
  const goal = { kind: 'kicker', game: '10-3', variant: 'high', total: 9 } as const
  // 1+3+6 = 10, kicker 2+2 = 4: worse than 9
  expect(judge([1, 3, 6, 2, 2], goal)).toBe('lose')
  const opts = keepOptions([1, 3, 6, 2, 2], 1, goal)
  // Keeping the game dice plus a kicker die is not allowed
  expect(opts.some((o) => !o.stand && o.dice.join('') === '1236')).toBe(false)
  // Re-rolling the kicker beats 9 with 10, 11 or 12: 6/36
  const reroll = opts.find((o) => o.dice.join('') === '136')!
  expect(reroll.win).toBeCloseTo(6 / 36, 10)
  expect(reroll.tie).toBeCloseTo(4 / 36, 10)
})

test('Boss: hold a 6 or roll all five, against a pair of 3s', () => {
  const goal: Goal = { kind: 'boss', hand: [3, 3, 1, 2, 5] }
  const opts = keepOptions([6, 4, 2, 1, 5], 1, goal)
  const six = opts.find((o) => !o.stand && o.dice.join('') === '6')!
  const none = opts.find((o) => !o.stand && o.dice.length === 0)!
  expect(six.win).toBeGreaterThan(0)
  expect(none.win).toBeGreaterThan(0)
  expect(show([6, 4, 2, 1, 5], 1, goal).length).toBeGreaterThan(5)
})

test('Razzle: three 5s beats three 4s and ties three 5s', () => {
  expect(judge([5, 5, 1, 2, 3], { kind: 'razzle', count: 3, face: 4 })).toBe('win')
  expect(judge([5, 5, 1, 2, 3], { kind: 'razzle', count: 3, face: 5 })).toBe('tie')
  expect(judge([5, 5, 2, 2, 3], { kind: 'razzle', count: 3, face: 4 })).toBe('lose')
})
