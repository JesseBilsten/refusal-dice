/**
 * Runs the strategy simulations off the main thread, so the page stays
 * responsive while thousands of rounds play out. Use it through
 * useSimulation (src/components/Odds/use-simulation.js).
 *
 * In:  { kind: 'hammer', options } | { kind: 'refusal', options }
 * Out: { progress: HammerOption[], samples } while running (hammer only),
 *      then { done: result }
 */
import { simulateHammer, simulateRefusal } from './simulate'

const ctx = globalThis as unknown as {
  postMessage: (message: unknown) => void
  onmessage: ((e: { data: { kind: 'hammer' | 'refusal'; options: any } }) => void) | null
}

ctx.onmessage = ({ data }) => {
  if (data.kind === 'hammer') {
    const done = simulateHammer({
      ...data.options,
      onProgress: (progress, samples) => ctx.postMessage({ progress, samples }),
    })
    ctx.postMessage({ done })
  } else {
    ctx.postMessage({ done: simulateRefusal(data.options) })
  }
}
