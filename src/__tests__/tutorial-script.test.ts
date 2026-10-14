/**
 * The tutorial's scripted round plays out as the lesson says.
 */
import { applyAction, evaluateKickerHand, GameState } from '../engine'
import {
  AVA_ROLLS,
  BEN_ROLLS,
  CALL,
  newTutorialGame,
} from '../components/Tutorial/script'

const kickers = (g: GameState, id: string) => {
  const hand = evaluateKickerHand(g.dice[id], '10-3', 'high')
  return hand.made ? hand.kickerTotal : null
}

test('everyone re-rolls both kickers; you beat Ben, who takes the pencil', () => {
  let g = newTutorialGame()
  g = [
    { type: 'call', player: 'you', call: CALL },
    { type: 'refuse', player: 'ava' },
    { type: 'accept', player: 'ben' },
  ].reduce((s, a) => applyAction(s, a as never), g)
  // At the reveal: you 10, Ava 7, Ben 8
  expect([kickers(g, 'you'), kickers(g, 'ava'), kickers(g, 'ben')]).toEqual([
    10, 7, 8,
  ])

  g = [...AVA_ROLLS, ...BEN_ROLLS].reduce(applyAction, g)
  // Ava 12; Ben ties you at 10
  expect([kickers(g, 'ava'), kickers(g, 'ben'), kickers(g, 'you')]).toEqual([
    12, 10, 10,
  ])

  // You can't keep one 5: kickers are rolled together
  expect(() =>
    applyAction(g, { type: 'reroll', player: 'you', keep: [0, 1, 2, 3] })
  ).toThrow(/rolled together/)
  g = applyAction(g, { type: 'reroll', player: 'you', keep: [0, 1, 2] })
  expect(kickers(g, 'you')).toBe(11)
  g = applyAction(g, { type: 'stand', player: 'you' })
  expect(g.phase).toMatchObject({ kind: 'roundOver', loser: 'ben' })
})
