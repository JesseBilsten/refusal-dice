/**
 * The tutorial's scripted round plays out as the lesson says, on both paths.
 */
import { Action, GameState, applyAction, evaluateKickerHand } from '../engine'
import { freshMakeChance, rollOrTakeTie } from '../strategy'
import {
  AVA_ROLLS,
  BEN_REPLAY_ROLLS,
  BEN_ROLLS,
  CALL,
  ROLL_PATH_DICE,
  TIE_PATH_DICE,
  newTutorialGame,
  withDice,
} from '../components/Tutorial/script'

const kickers = (g: GameState, id: string) => {
  const hand = evaluateKickerHand(g.dice[id], '10-3', 'high')
  return hand.made ? hand.kickerTotal : null
}
const play = (g: GameState, ...actions: Action[]) =>
  actions.reduce(applyAction, g)

/** Up to the decision: you and Ben tied at 10, Ava 12 */
function toDecision() {
  let g = play(
    newTutorialGame(),
    { type: 'call', player: 'you', call: CALL },
    { type: 'refuse', player: 'ava' },
    { type: 'accept', player: 'ben' }
  )
  // At the reveal: you 10, Ava 7, Ben 8
  expect([kickers(g, 'you'), kickers(g, 'ava'), kickers(g, 'ben')]).toEqual([
    10, 7, 8,
  ])
  g = play(g, ...AVA_ROLLS, ...BEN_ROLLS)
  expect([kickers(g, 'ava'), kickers(g, 'ben'), kickers(g, 'you')]).toEqual([
    12, 10, 10,
  ])
  // You can't keep one 5: kickers are rolled together
  expect(() =>
    applyAction(g, { type: 'reroll', player: 'you', keep: [0, 1, 2, 3] })
  ).toThrow(/rolled together/)
  return g
}

test('the odds say take the tie with 5+5, even counting both rolls', () => {
  const odds = rollOrTakeTie({
    kickerDice: 2,
    rolls: 2,
    variant: 'high',
    total: 10,
    tied: 2,
  })
  // 5+6, 6+5, 6+6 beat it; 4+6, 5+5, 6+4 tie it; 30 of 36 fall short
  expect(odds.better).toBeCloseTo(3 / 36, 12)
  expect(odds.equal).toBeCloseTo(3 / 36, 12)
  expect(odds.worse).toBeCloseTo(30 / 36, 12)
  // A last roll: fall short and lose, or tie and lose the replay half the time
  expect(odds.loseIfLastRoll).toBeCloseTo(30 / 36 + (3 / 36) * 0.5, 12)
  // Two rolls: tie → take it (½); short → last roll (87.5%)
  expect(odds.loseIfRoll).toBeCloseTo(
    (3 / 36) * 0.5 + (30 / 36) * (30 / 36 + (3 / 36) * 0.5),
    12
  )
  expect(odds.loseIfRoll).toBeCloseTo(0.7708, 4)
  expect(odds.choice).toBe('tie')
  // Missing 10 on both rolls
  expect(odds.worse ** 2).toBeCloseTo(0.6944, 4)
  // How the math works: miss twice, plus half the ties met along the way
  expect(
    odds.worse ** 2 + 0.5 * (odds.equal + odds.worse * odds.equal)
  ).toBeCloseTo(odds.loseIfRoll, 12)
  // The replay: making 10-3 from fresh dice within 1, 2 and 3 rolls
  expect(freshMakeChance('10-3', 1)).toBeCloseTo(0.6385, 4)
  expect(freshMakeChance('10-3', 2)).toBeGreaterThan(freshMakeChance('10-3', 1))
  expect(freshMakeChance('10-3')).toBeCloseTo(0.9805, 4)
  expect(freshMakeChance('10-3', 3)).toBe(freshMakeChance('10-3'))
})

test('taking the tie: you and Ben replay, and Ben loses the replay', () => {
  let g = applyAction(withDice(toDecision(), TIE_PATH_DICE), {
    type: 'stand',
    player: 'you',
  })
  expect(g.phase).toMatchObject({ kind: 'play', cycle: 1 })
  expect(Object.keys(g.phase.kind === 'play' ? g.phase.rolling : {})).toEqual([
    'you',
    'ben',
  ])
  expect([kickers(g, 'you'), kickers(g, 'ben')]).toEqual([12, 2])
  g = play(g, ...BEN_REPLAY_ROLLS)
  expect(kickers(g, 'ben')).toBe(5)
  g = applyAction(g, { type: 'stand', player: 'you' })
  expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'ben' })
})

test('rolling anyway: 6+5 beats Ben, who takes the pencil', () => {
  let g = applyAction(withDice(toDecision(), ROLL_PATH_DICE), {
    type: 'reroll',
    player: 'you',
    keep: [0, 1, 2],
  })
  expect(kickers(g, 'you')).toBe(11)
  g = applyAction(g, { type: 'stand', player: 'you' })
  expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'ben' })
})
