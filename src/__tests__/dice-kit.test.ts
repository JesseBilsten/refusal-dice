/**
 * How the dice kit groups a roll for a game (src/components/Dice/hand-groups.ts):
 * every Hand on the site uses this.
 */
import { Dice } from '../engine'
import { handGroups } from '../components/Dice/hand-groups'

const all = [0, 1, 2, 3, 4]

test('a kicker game: the dice that make it, then the kicker', () => {
  // 1+3+6 makes 10-3; the kicker is 5+5
  expect(handGroups([1, 3, 6, 5, 5], '10-3', 'high')).toEqual([
    { tone: 'game', label: 'game', indices: [0, 1, 2] },
    { tone: 'kicker', label: 'kicker', indices: [3, 4], kickerTotal: 10 },
  ])
})

test('the variant picks the kicker when several sets make the game', () => {
  // 7's: 6+5 and 1+6 leave a 2; 6+1 and 5+2 leave a 6
  const roll: Dice = [6, 5, 1, 6, 2]
  expect(handGroups(roll, 'vegas', 'high')[1].kickerTotal).toBe(6)
  expect(handGroups(roll, 'vegas', 'low')[1].kickerTotal).toBe(2)
})

test('a miss, a specialty game, no game, or dice not rolled yet', () => {
  expect(handGroups([1, 1, 2, 2, 4], '10-3', 'high')).toEqual([
    { tone: 'plain', label: 'miss', indices: all },
  ])
  expect(handGroups([3, 3, 1, 2, 6])).toEqual([
    { tone: 'plain', label: null, indices: all },
  ])
  expect(handGroups([null, null, null, null, null] as never, '10-3')).toEqual([
    { tone: 'plain', label: null, indices: all },
  ])
})

test('Boss: the dice that make the poker hand', () => {
  // Two pair: the four dice of the pairs; the 1 is left out
  expect(handGroups([6, 4, 6, 1, 4], 'boss')).toEqual([
    { tone: 'game', label: 'game', indices: [0, 1, 2, 4], detail: 'two pair' },
    { tone: 'plain', label: null, indices: [3] },
  ])
  // High die: just the highest die
  expect(handGroups([2, 6, 4, 1, 5], 'boss')[0]).toMatchObject({
    indices: [1],
    detail: 'high die',
  })
  expect(handGroups([5, 5, 5, 2, 2], 'boss')).toEqual([
    { tone: 'game', label: 'game', indices: all, detail: 'full house' },
  ])
})

test('Razzle: the chosen number and the wild 1s', () => {
  expect(handGroups([1, 4, 4, 2, 6], 'razzle')).toEqual([
    { tone: 'game', label: 'game', indices: [0, 1, 2], detail: 'three 4s' },
    { tone: 'plain', label: null, indices: [3, 4] },
  ])
})

test('Tres Away: the dice put out, scored with 3s as 0', () => {
  expect(
    handGroups([3, 2, 6, 3, 1], 'tres-away', null, { putOut: [0, 3, 4] })
  ).toEqual([
    { tone: 'game', label: 'game', indices: [0, 3, 4], detail: '1' },
    { tone: 'plain', label: null, indices: [1, 2] },
  ])
  // Nothing put out yet: no group
  expect(
    handGroups([3, 2, 6, 3, 1], 'tres-away', null, { putOut: [] })
  ).toEqual([{ tone: 'plain', label: null, indices: all }])
  // A fresh roll: the best first put-out (the 3s, not the 1 or 2)
  expect(handGroups([3, 2, 6, 3, 1], 'tres-away')[0]).toMatchObject({
    indices: [0, 3],
    detail: 'put out first',
  })
})
