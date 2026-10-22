import { applyAction } from '../engine'
import { botAction } from '../strategy'
import {
  YOU,
  actor,
  callAllowed,
  describeEvent,
  latestMoves,
  newTable,
  holdFor,
  paceAfter,
  piddleSteps,
  tableOrder,
  rolledPositions,
  shortEvent,
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

test('the bots pause longer for a call than a refusal, and less after your own move', () => {
  const call = { type: 'called', player: 'ava', call: { game: '10-4', variant: 'high' }, second: false } as const
  const refuse = { type: 'refused', player: 'ava' } as const
  expect(paceAfter(call, 'normal')).toBeGreaterThan(paceAfter(refuse, 'normal'))
  expect(paceAfter({ ...refuse, player: YOU }, 'normal')).toBeLessThan(paceAfter(refuse, 'normal'))
  // A roll leaves the dice time to land (~1s), even your own
  expect(paceAfter({ type: 'rolled', player: YOU, dice: [1, 2, 3, 4, 5], kept: [] }, 'normal')).toBeGreaterThanOrEqual(1000)
  // Slowest by default; instant plays straight through
  expect(paceAfter(call)).toBeGreaterThan(paceAfter(call, 'slow'))
  expect(paceAfter(call, 'slow')).toBeGreaterThan(paceAfter(call, 'normal'))
  expect(paceAfter(call, 'fast')).toBeLessThan(paceAfter(call, 'normal'))
  expect(paceAfter(call, 'instant')).toBe(0)
  expect(holdFor(1000, 'instant')).toBe(0)
  expect(paceAfter(null, 'normal')).toBeGreaterThan(0)
})

test('realistic: every decision takes a few seconds of thinking, a different time each move', () => {
  const refuse = { type: 'refused', player: 'ava' } as const
  expect(paceAfter(refuse, 'realistic', () => 0)).toBe(2000)
  expect(paceAfter(refuse, 'realistic', () => 0.999)).toBeGreaterThan(4900)
  expect(paceAfter({ ...refuse, player: YOU }, 'realistic', () => 0)).toBeGreaterThanOrEqual(2000)
})
test('each seat shows its latest move this round', () => {
  const moves = latestMoves(
    [
      { type: 'called', player: 'ava', call: { game: '10-4', variant: 'high' }, second: false },
      { type: 'refused', player: 'ben' },
      { type: 'accepted', player: 'cass' },
      { type: 'rolled', player: 'ben', dice: [1, 2, 3, 4, 5], kept: [0, 1] },
      { type: 'cycle', players: ['ava', 'cass'], reason: 'tie' },
    ],
    label
  )
  expect(moves).toEqual({
    ava: { text: 'Tied: plays again', at: 4 },
    ben: { text: 'Keeps 2, rolls 3', at: 3 },
    cass: { text: 'Tied: plays again', at: 4 },
  })
  expect(shortEvent({ type: 'rolled', player: 'ava', dice: [], kept: [], hidden: true }, label)).toBe('Rolls in secret')
})

test('the table runs from the piddle winner, going left, all game', () => {
  const seats = [{ id: 'ava' }, { id: YOU }, { id: 'ben' }, { id: 'cass' }]
  expect(tableOrder(seats, 'ben').map((s) => s.id)).toEqual(['ben', 'cass', 'ava', YOU])
  expect(tableOrder(seats, 'ava').map((s) => s.id)).toEqual(['ava', YOU, 'ben', 'cass'])
})

test('the piddle shows each roll, then who holds the Hammer', () => {
  const rounds = [
    [{ player: 'ava', die: 6 }, { player: YOU, die: 6 }, { player: 'ben', die: 2 }],
    [{ player: 'ava', die: 3 }, { player: YOU, die: 5 }],
  ]
  expect(piddleSteps(rounds)).toEqual([
    { round: 0, done: false },
    { round: 1, done: false },
    { round: 1, done: true },
  ])
})
