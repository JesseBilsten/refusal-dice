/**
 * The decision trainer (src/components/Trainer/trainer-model.ts): real
 * situations from seeded games against solid bots, options that don't give
 * the answer away, and grading against the computed odds.
 */
import { Call, evaluateKickerHand, isKickerGame } from '../engine'
import { ALL_CALLS } from '../strategy'
import { YOU } from '../components/Play/play-model'
import {
  FOCUSES,
  Focus,
  addToTally,
  describe as describeSituation,
  drawSituation,
  emptyTally,
  grade,
  isBossChoice,
  kindOf,
} from '../components/Trainer/trainer-model'

const callName = (c: Call) => `${c.game}${c.variant ? ` ${c.variant}` : ''}`
const names = {
  call: callName,
  player: (id: string) => (id === YOU ? 'You' : id),
  hand: (dice: number[]) => dice.join(''),
}

test.each(FOCUSES.map((f) => f.id))(
  '"%s" deals your own decisions, with the solid pick among the options',
  (focus) => {
    for (let seed = 1; seed <= 6; seed++) {
      const s = drawSituation(seed, focus as Focus, () => names)
      expect(kindOf(s.state)).toBe(s.kind)
      if (focus !== 'all') expect(s.kind).toBe(focus)
      expect(s.options.length).toBeGreaterThanOrEqual(2)
      expect(s.options.map((o) => o.id)).toContain(s.solid)
      expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length)
      if (s.kind !== 'refusal')
        s.options.forEach((o) => expect(o.actions?.length).toBeGreaterThan(0))
    }
  }
)

test('the same seed deals the same situation', () => {
  const a = drawSituation(11, 'all', () => names)
  const b = drawSituation(11, 'all', () => names)
  expect(b.state).toEqual(a.state)
  expect(b.options).toEqual(a.options)
})

test('calls are listed in game order, Bark last, whatever their odds', () => {
  for (let seed = 1; seed <= 8; seed++) {
    const s = drawSituation(seed, 'call', () => names)
    const calls = s.options.filter((o) => o.id !== 'Bark')
    const index = (label: string) =>
      ALL_CALLS.findIndex((c) => label === `Call ${callName(c)}`)
    const order = calls.map((o) => index(o.label))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    const bark = s.options.findIndex((o) => o.id === 'Bark')
    if (bark >= 0) expect(bark).toBe(s.options.length - 1)
    // Every option, the bark included, is played out at this table: never a fixed figure
    expect(s.stats.rows).toEqual([])
    s.options.forEach((o) => expect(o.actions?.length).toBe(1))
    if (bark >= 0) expect(s.options[bark].actions![0].type).toBe('bark')
  }
})

test('grading: the lowest chance is best, close calls are a toss-up, the rest cost the difference', () => {
  const options = [
    { id: 'a', label: 'Keep 5-6' },
    { id: 'b', label: 'Keep 6' },
    { id: 'c', label: 'Roll all five' },
  ]
  const values = { a: 0.3, b: 0.32, c: 0.41 }
  expect(grade(options, values, 'a', 0.03)).toMatchObject({
    verdict: 'best',
    cost: 0,
  })
  expect(grade(options, values, 'b', 0.03)).toMatchObject({ verdict: 'tossup' })
  const costly = grade(options, values, 'c', 0.03)
  expect(costly.verdict).toBe('costly')
  expect(costly.cost).toBeCloseTo(0.11, 10)
  expect(costly.ranked.map((o) => o.id)).toEqual(['a', 'b', 'c'])

  let t = emptyTally()
  t = addToTally(t, grade(options, values, 'a', 0.03))
  t = addToTally(t, grade(options, values, 'b', 0.03))
  t = addToTally(t, costly)
  expect(t.played).toBe(3)
  expect(t.good).toBe(2)
  expect(t.given).toBeCloseTo(0.11, 10)
})

test('every situation is described in words, with nothing left blank', () => {
  for (const focus of ['call', 'refusal', 'roll'] as Focus[])
    for (let seed = 1; seed <= 15; seed++) {
      const { heading, detail } = describeSituation(
        drawSituation(seed, focus, () => names),
        names
      )
      expect(heading.length).toBeGreaterThan(5)
      expect(detail.length).toBeGreaterThan(10)
      expect(`${heading} ${detail}`).not.toMatch(/undefined|null|NaN/)
    }
})

test('once your game is made, every roll is the kicker (§3.1), and a miss never stands', () => {
  let made = 0
  for (let seed = 1; seed <= 400; seed++) {
    const s = drawSituation(seed, 'roll', () => names)
    const phase = s.state.phase
    if (phase.kind !== 'play') continue
    const { game, variant } = phase.call
    if (!isKickerGame(game) || !variant) continue
    const hand = evaluateKickerHand(
      s.state.dice[YOU],
      game,
      variant,
      phase.rolling[YOU].kept
    )
    const labels = s.options.map((o) => o.label)
    if (hand.made) {
      made++
      labels
        .filter((l) => l !== 'Stand' && l !== 'Take the tie')
        .forEach((l) => expect(l).toMatch(/^Roll the kicker/))
    } else {
      expect(labels).not.toContain('Stand')
      expect(labels).not.toContain('Take the tie')
      labels.forEach((l) => expect(l).not.toMatch(/kicker/))
    }
  }
  expect(made).toBeGreaterThan(5)
})

test('the Boss’s own choices are scored in net pencils; everything else in your chance of the pencil', () => {
  let boss = 0
  for (let seed = 1; seed <= 300; seed++) {
    const s = drawSituation(seed, 'roll', () => names)
    expect(s.measure).toBe(isBossChoice(s.state) ? 'net' : 'pencil')
    if (s.measure === 'net') {
      boss++
      // Before the secret roll only keeps are offered; come up or pick ’em up comes after it
      const phase = s.state.phase
      if (phase.kind === 'boss' && phase.stage === 'bossRoll')
        s.options.forEach((o) => expect(o.label).toMatch(/^Keep/))
    }
  }
  expect(boss).toBeGreaterThan(0)
})
