import type { Call, Dice, KeepRules } from '../../engine'
import { isKickerGame } from '../../engine'
import { makeChance, RefusalEstimate } from '../../strategy'
import { fmtPct, Option } from '../Odds/model'

/**
 * The numbers behind the Strategy Assistant's accept-or-refuse screen, from
 * a simulateRefusal() estimate. Pure, so src/__tests__ can check that every
 * figure adds up. Call names come in through `name` (games-config.js is
 * plain JS).
 */

export interface RefusalView {
  options: Option[]
  /** Totals closer than this are a toss-up: about 2 standard errors */
  tieMargin: number
  /** If you refuse: each thing that can happen next, as a share of all rounds */
  branches: { id: string; label: string; share: number; p: number }[]
  /** "How the math works" lines for refusing */
  refuseSteps: {
    label: string
    expr?: string
    result: string
    total?: boolean
  }[]
  /** Exact chance of making the call from your dice with both re-rolls (kicker games) */
  makeIt: number | null
  /** Whether a 2nd refusal can still accept after you refuse */
  nextCanAccept: boolean
}

export function refusalView(options: {
  estimate: RefusalEstimate
  dice: Dice
  call: Call
  position: 1 | 2
  players: number
  name: (call: Call) => string
  /** House rules that change the chance of making the call */
  rules?: KeepRules
}): RefusalView {
  const { estimate, dice, call, position, players, name, rules } = options
  const { accept, refuse, refusePaths, secondCalls } = estimate
  const nextAccepts = refusePaths.find((p) => p.path === 'nextAccepts')
  const second = refusePaths.find((p) => p.path === 'secondCall')
  const callName = name(call)

  const parts = [
    nextAccepts && {
      label: `the 2nd refusal accepts ${callName}`,
      share: nextAccepts.share,
      pencil: nextAccepts.pencil,
    },
    second && {
      label: "the Hammer's second call",
      share: second.share,
      pencil: second.pencil,
    },
  ].filter((x): x is { label: string; share: number; pencil: number } => !!x)

  return {
    options: [
      {
        id: 'accept',
        label: `Accept ${callName}`,
        segments: [
          {
            p: accept.pencil,
            label: `play ${callName} and lose`,
            kind: 'lose',
          },
        ],
        error: accept.error,
      },
      {
        id: 'refuse',
        label: 'Refuse',
        segments: parts.map((x) => ({
          p: x.share * x.pencil,
          label: `${x.label}, then you lose`,
          kind: 'lose' as const,
        })),
        error: refuse.error,
      },
    ],
    tieMargin: 2 * Math.max(accept.error, refuse.error),
    branches: [
      ...(nextAccepts
        ? [
            {
              id: 'next-accepts',
              label: `The 2nd refusal accepts ${callName}`,
              share: nextAccepts.share,
              p: nextAccepts.pencil,
            },
          ]
        : []),
      ...(second
        ? secondCalls.map((sc) => ({
            id: `${sc.call.game}:${sc.call.variant ?? ''}`,
            label: `Second call: ${name(sc.call)}`,
            share: second.share * sc.share,
            p: sc.pencil,
          }))
        : []),
    ],
    // With one way to lose, its line would just repeat the total
    refuseSteps: [
      ...(parts.length > 1 ? parts : []).map((x) => ({
        label: `${x.label.charAt(0).toUpperCase()}${x.label.slice(1)}, and you lose`,
        expr: `${fmtPct(x.share)} × ${fmtPct(x.pencil)}`,
        result: fmtPct(x.share * x.pencil, 1),
      })),
      {
        label: 'Chance you take the pencil',
        ...(parts.length > 1
          ? {
              expr: parts.map((x) => fmtPct(x.share * x.pencil, 1)).join(' + '),
            }
          : {
              expr: `lost ${Math.round(refuse.pencil * refuse.samples)} of ${refuse.samples} rounds`,
            }),
        result: fmtPct(refuse.pencil, 1),
        total: true,
      },
    ],
    makeIt: isKickerGame(call.game) ? makeChance(dice, call.game, 2, { rules }) : null,
    nextCanAccept: position === 1 && players >= 3,
  }
}
