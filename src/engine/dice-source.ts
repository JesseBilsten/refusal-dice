import { Dice, Die, EngineError } from './types'

/**
 * Where dice come from. Pure: drawing dice returns the next source, so the
 * whole game state stays serializable and every game is replayable.
 *
 * - seeded:   mulberry32 PRNG, for real play and simulations
 * - scripted: a fixed queue of faces, for tutorials and tests
 */
export type DiceSource =
  | { kind: 'seeded'; state: number }
  | { kind: 'scripted'; queue: Die[] }

export const seeded = (seed: number): DiceSource => ({ kind: 'seeded', state: seed | 0 })

export const scripted = (faces: number[]): DiceSource => {
  faces.forEach((f) => {
    if (!Number.isInteger(f) || f < 1 || f > 6) throw new EngineError(`Not a die face: ${f}`)
  })
  return { kind: 'scripted', queue: faces as Die[] }
}

/** One mulberry32 step: returns a float in [0, 1) and the next state. */
const step = (state: number): [number, number] => {
  const a = (state + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a]
}

export function rollDice(source: DiceSource, count: number): [Dice, DiceSource] {
  if (source.kind === 'scripted') {
    if (source.queue.length < count) {
      throw new EngineError(`Scripted dice ran out (needed ${count}, had ${source.queue.length})`)
    }
    return [source.queue.slice(0, count), { kind: 'scripted', queue: source.queue.slice(count) }]
  }
  const dice: Dice = []
  let state = source.state
  for (let i = 0; i < count; i++) {
    const [r, next] = step(state)
    state = next
    dice.push((Math.floor(r * 6) + 1) as Die)
  }
  return [dice, { kind: 'seeded', state }]
}
