import { GameState, applyAction, createGame, scripted, seeded } from '../engine'
import { actors, botAction, botActionFor, simulateDecision } from '../strategy'
import { hintStats } from '../components/Play/hint-stats'

const names = {
  call: (c: { game: string; variant?: string }) => (c.variant ? `${c.game} ${c.variant}` : c.game),
  player: (id: string) => id,
  hand: (dice: number[]) => dice.join(''),
}
const players = ['a', 'b', 'c'].map((id) => ({ id, name: id }))

describe('hint stats', () => {
  // a 3,3,3,3,3 · b 6,4,1,1,2 · c 5,5,2,3,4
  const deal = [3, 3, 3, 3, 3, 6, 4, 1, 1, 2, 5, 5, 2, 3, 4, ...Array(30).fill(1)]
  const game = () => createGame({ players, hammer: 'a', source: scripted(deal) })

  test('the Hammer: the calls this hand loses least, best first, the pick marked, and a bark', () => {
    const g = game()
    const stats = hintStats(g, 'a', botAction(g), names)!
    expect(stats.kind).toBe('loss')
    const calls = stats.rows.filter((r) => r.label !== 'Bark')
    expect(calls.map((r) => r.value)).toEqual([...calls.map((r) => r.value)].sort((x, y) => x - y))
    expect(stats.rows.filter((r) => r.best)).toHaveLength(1)
    expect(stats.rows.at(-1)!.label).toBe('Bark')
    expect(stats.why).toMatch(/3-3-3-3-3/)
  })

  test('a refusal is played out: accept vs. refuse', () => {
    const g = applyAction(game(), { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } })
    const stats = hintStats(g, 'b', botAction(g), names)!
    expect(stats.refusal).toEqual({ dice: [6, 4, 1, 1, 2], call: { game: '10-2', variant: 'high' }, position: 1, players: 3 })
  })

  test('Tres Away: putting out five 3s can’t lose', () => {
    let g = applyAction(game(), { type: 'call', player: 'a', call: { game: 'tres-away' } })
    g = applyAction(g, { type: 'accept', player: 'b' })
    const stats = hintStats(g, 'a', botAction(g), names)!
    const best = stats.choices!.find((c) => c.best)!
    expect(best.label).toBe('Put out 3 3 3 3 3')
    const [p] = simulateDecision({ state: g, me: 'a', choices: [best], samples: 50 })
    expect(p.pencil).toBe(0)
  })

  test('every choice offered is a legal move, with exactly one the pick', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      let g: GameState = createGame({ players, source: seeded(seed) })
      for (let step = 0; step < 400 && g.phase.kind !== 'gameOver'; step++) {
        const who = actors(g)
        if (who.includes('a')) {
          const action = botActionFor(g, 'a')
          const stats = hintStats(g, 'a', action, names)
          if (stats?.choices) {
            expect(stats.choices.filter((c) => c.best)).toHaveLength(1)
            stats.choices.forEach((c) => expect(() => c.actions.reduce(applyAction, g)).not.toThrow())
          }
        }
        g = applyAction(g, who.length ? botActionFor(g, who[0]) : botAction(g))
      }
    }
  })
})
