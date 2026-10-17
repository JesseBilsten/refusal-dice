import { applyAction, createGame, scripted } from '../engine'
import { botAction, callLoss } from '../strategy'
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

  test('a refusal compares the call against an even share', () => {
    const g = applyAction(game(), { type: 'call', player: 'a', call: { game: '10-2', variant: 'high' } })
    const stats = hintStats(g, 'b', botAction(g), names)!
    expect(stats.rows[0].value).toBe(callLoss([6, 4, 1, 1, 2], { game: '10-2', variant: 'high' }))
    expect(stats.rows[1].value).toBeCloseTo(1 / 3)
    expect(stats.rows[0].best).toBe(botAction(g).type === 'accept')
  })

  test('Tres Away: average final scores, lowest first, the pick marked', () => {
    let g = applyAction(game(), { type: 'call', player: 'a', call: { game: 'tres-away' } })
    g = applyAction(g, { type: 'accept', player: 'b' })
    const stats = hintStats(g, 'a', botAction(g), names)!
    expect(stats.kind).toBe('score')
    expect(stats.rows[0].best).toBe(true)
    expect(stats.rows[0].value).toBe(0) // five 3s out: a score of 0
  })
})
