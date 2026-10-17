import { tresAwayExpected, tresAwayPutOut } from '../strategy'

test('expected final score by dice in hand, exact', () => {
  const v = tresAwayExpected()
  expect(v[0]).toBe(0)
  // One die: the average of 1, 2, 0, 4, 5, 6
  expect(v[1]).toBeCloseTo(3, 10)
  expect(v[5]).toBeCloseTo(6.254, 3)
})

test('from five dice: put out every 3, otherwise just the lowest die', () => {
  expect(tresAwayPutOut([3, 2, 6, 3, 1])).toEqual([0, 3])
  expect(tresAwayPutOut([3, 1, 6, 5, 4])).toEqual([0])
  // No 3: the 1 alone, not the 2
  expect(tresAwayPutOut([1, 2, 6, 5, 2])).toEqual([0])
  expect(tresAwayPutOut([2, 4, 6, 5, 2])).toEqual([0])
  // A 1 goes out with three 3s
  expect(tresAwayPutOut([3, 3, 1, 3, 6])).toEqual([0, 1, 2, 3])
})

test('only dice still in hand are put out', () => {
  // Two dice left: a 1 or 2 goes out with the 3
  expect(tresAwayPutOut([3, 3, 3, 2, 3], [3, 4])).toEqual([3, 4])
  expect(tresAwayPutOut([3, 3, 3, 4, 3], [3, 4])).toEqual([4])
})

test('dice held from an earlier roll: put out the good ones, otherwise roll', () => {
  // Held 3s go out as they are; held 6s are rolled again
  expect(tresAwayPutOut([3, 3, 3, 3, 3], [2, 3, 4], { mayRoll: true })).toEqual([2, 3, 4])
  expect(tresAwayPutOut([3, 3, 6, 6, 6], [2, 3, 4], { mayRoll: true })).toEqual([])
})
