import type { Call } from '../../engine'
import type { Estimate, HammerOption } from '../../strategy'
import type { Option } from '../Odds/model'

/**
 * The numbers behind the Strategy Assistant's what-to-call screen, from a
 * simulateHammer() estimate and the bark's (seat-odds.ts). Pure, so
 * src/__tests__ can check every bar adds up. Call names come in through
 * `name` (games-config.js is plain JS).
 */

export interface HammerChoice extends Option {
  /** The call, or null for a bark */
  call: Call | null
}

export interface HammerView {
  options: HammerChoice[]
  /** Totals closer than this are a toss-up: about 2 standard errors */
  tieMargin: number
}

export function hammerView(input: {
  calls: HammerOption[]
  bark: Estimate
  name: (call: Call) => string
  /** How many calls to show, best first */
  top?: number
}): HammerView {
  const { calls, bark, name, top = 5 } = input
  const shown: HammerChoice[] = calls.slice(0, top).map((o) => ({
    id: `${o.call.game}:${o.call.variant ?? ''}`,
    label: `Call ${name(o.call)}`,
    call: o.call,
    error: o.error,
    segments: o.paths.map((p) =>
      p.path === 'accepted'
        ? { p: p.share * p.pencil, label: `accepted (${Math.round(p.share * 100)}% of rounds) and you lose`, kind: 'lose' as const }
        : {
            p: p.share * p.pencil,
            label: `both refuse (${Math.round(p.share * 100)}%), you call ${name(p.call!)} and lose`,
            kind: 'lose' as const,
          }
    ),
  }))
  const barkChoice: HammerChoice = {
    id: 'bark',
    label: 'Bark',
    call: null,
    error: bark.error,
    segments: [{ p: bark.pencil, label: 'new dice for everyone, and you lose from the last seat', kind: 'lose' }],
  }
  const options = [...shown, barkChoice].sort(
    (a, b) => a.segments.reduce((s, x) => s + x.p, 0) - b.segments.reduce((s, x) => s + x.p, 0)
  )
  return { options, tieMargin: 2 * Math.max(calls[0].error, bark.error) }
}
