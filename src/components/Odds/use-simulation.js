import { useEffect, useState } from 'react'
import { mergeHammerOptions } from '../../strategy'
import { useHouseRules } from '../Settings/house-rules'

/**
 * Run a strategy simulation in Web Workers (src/strategy/simulate.worker.ts)
 * so the page never freezes. `request` is { kind: 'hammer' | 'refusal',
 * options } or null; a new request stops the one still running.
 *
 * A Hammer simulation is split across one worker per spare CPU core (each
 * with its own seed) and merged, and reports its estimate as it goes.
 *
 * The table plays the visitor's house rules (Settings), bots included.
 *
 * Returns { result, samples, running }: `samples` simulated so far.
 */
const workerCount = () =>
  Math.max(1, Math.min(4, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) - 1 || 2))

const spawn = () => new Worker(new URL('../../strategy/simulate.worker.ts', import.meta.url))

export function useSimulation(asked) {
  const [state, setState] = useState({ result: null, samples: 0, running: false })
  const [rules] = useHouseRules()
  const request = asked && { ...asked, options: { ...asked.options, rules } }
  const key = request ? JSON.stringify(request) : null

  useEffect(() => {
    if (!request) {
      setState({ result: null, samples: 0, running: false })
      return undefined
    }
    setState({ result: null, samples: 0, running: true })
    let stopped = false

    if (request.kind !== 'hammer') {
      const w = spawn()
      w.onmessage = ({ data }) => {
        if (stopped || !data.done) return
        setState({ result: data.done, samples: request.options.samples, running: false })
        w.terminate()
      }
      w.postMessage(request)
      return () => {
        stopped = true
        w.terminate()
      }
    }

    const k = workerCount()
    const total = request.options.samples
    const share = Math.ceil(total / k)
    // Each worker's latest estimate and how many samples it covers
    const parts = Array.from({ length: k }, () => null)
    const workers = parts.map((_, i) => {
      const w = spawn()
      const samples = Math.min(share, total - share * i)
      w.onmessage = ({ data }) => {
        if (stopped) return
        parts[i] = data.done
          ? { options: data.done, samples, done: true }
          : { options: data.progress, samples: data.samples, done: false }
        const ready = parts.filter(Boolean)
        const done = ready.length === k && ready.every((p) => p.done)
        setState({
          result: mergeHammerOptions(ready),
          samples: ready.reduce((s, p) => s + p.samples, 0),
          running: !done,
        })
        if (data.done) w.terminate()
      }
      w.postMessage({ kind: 'hammer', options: { ...request.options, samples, seed: i + 1, every: 50 } })
      return w
    })
    return () => {
      stopped = true
      workers.forEach((w) => w.terminate())
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
