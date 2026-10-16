import { applyAction } from '../engine'
import { botAction } from '../strategy'
import {
  YOU,
  actor,
  callAllowed,
  describeEvent,
  newTable,
  rolledPositions,
} from '../components/Play/play-model'

const label = (c: { game: string; variant?: string }) => `${c.game}${c.variant ? ` ${c.variant}` : ''}`

test('a table seats you and the bots', () => {
  const g = newTable(3, 1)
  expect(g.seats.map((s) => s.name)).toEqual(['You', 'Ava', 'Ben', 'Cass'])
  expect(actor(g)).toBe(g.hammer)
})

test('bots and a bot-played "you" finish whole games, with every event in words', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    let g = newTable(1 + (seed % 7), seed)
    const names = Object.fromEntries(g.seats.map((s) => [s.id, s.name]))
    for (let steps = 0; g.phase.kind !== 'gameOver'; steps++) {
      expect(steps).toBeLessThan(20000)
      g = applyAction(g, botAction(g))
    }
    g.log.forEach((e) => expect(describeEvent(e, names, label)).toEqual(expect.any(String)))
  }
})

test('a second call must be a different game', () => {
  let g = newTable(2, 7)
  // Play until someone has to make a second call
  for (let i = 0; i < 2000 && g.phase.kind !== 'secondCall'; i++) {
    const a = botAction(g)
    g = applyAction(g, g.phase.kind === 'refusal' ? { type: 'refuse', player: (a as any).player } : a)
  }
  expect(g.phase.kind).toBe('secondCall')
  if (g.phase.kind !== 'secondCall') return
  expect(callAllowed(g, g.phase.refused)).toBe(false)
  expect(callAllowed(g, { game: 'boss' })).toBe(g.phase.refused.game !== 'boss')
})

test('rolled positions skip the kept dice', () => {
  expect(
    rolledPositions([
      { type: 'rolled', player: YOU, dice: [1, 2, 3, 4, 5], kept: [0, 2] },
      { type: 'cycle', players: ['ava'], reason: 'tie' },
    ])
  ).toEqual({ you: [1, 3, 4], ava: [0, 1, 2, 3, 4] })
})
