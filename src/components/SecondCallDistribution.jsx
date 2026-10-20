import React, { useMemo, useState } from 'react'
import { Badge } from './ui/badge'
import { Panel } from './Page'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import VariantSelector from './VariantSelector'
import { GAMES_MAP, formatCallLabel, getGameName } from '../lib/games-config'
import { fmtPct } from './Odds'
import { comebackOf, comebacksAfter } from '../strategy'
import { useHouseRules } from './Settings/house-rules'
import { Hand } from './Dice'

const callKey = (c) => `${c.game}:${c.variant ?? ''}`

/** The comebacks after any of `firsts` together, most likely first */
function merged(firsts) {
  const total = firsts.reduce((s, f) => s + f.ways, 0)
  const byCall = new Map()
  firsts.forEach((f) =>
    f.comebacks.forEach((c) => {
      const m = byCall.get(callKey(c.call)) ?? { ...c, ways: 0, examples: [] }
      m.ways += c.ways
      m.examples = [...m.examples, ...c.examples].slice(0, 3)
      byCall.set(callKey(c.call), m)
    })
  )
  return [...byCall.values()].map((c) => ({ ...c, share: c.ways / total })).sort((a, b) => b.ways - a.ways)
}

/**
 * The Hammer's comeback: when both refusals turn down a call of `gameId`,
 * what do they call instead? Exact over every roll (src/strategy/comebacks.ts),
 * for a Hammer who calls the site's recommended call both times. Then the
 * other way round: after which first calls is this game the comeback?
 *
 * `variant` fixes the first call's variant; `showTabs` lets the reader pick
 * All, High or Low instead.
 */
export default function SecondCallDistribution({ gameId, variant = null, showTabs = false, title, description }) {
  const [rules] = useHouseRules()
  const [picked, setPicked] = useState('all')
  const hasVariants = GAMES_MAP[gameId]?.hasVariants
  const shown = showTabs && hasVariants ? picked : variant
  const name = getGameName(gameId)

  const rows = useMemo(() => {
    const variants = !hasVariants ? [undefined] : shown && shown !== 'all' ? [shown] : ['high', 'low']
    const firsts = variants.map((v) => comebacksAfter({ game: gameId, ...(v ? { variant: v } : {}) }, rules)).filter(Boolean)
    return firsts.length ? merged(firsts) : []
  }, [gameId, hasVariants, shown, rules])

  const after = useMemo(() => comebackOf(gameId, rules), [gameId, rules])

  return (
    <Panel title={title} description={description}>
      {showTabs && hasVariants && <VariantSelector selectedVariant={picked} onChange={(v) => v && setPicked(v)} className="mb-4" />}
      {rows.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">The site never calls this first.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Comeback</TableHead>
              <TableHead className="text-right">Chance</TableHead>
              <TableHead className="hidden sm:table-cell">Example rolls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 8).map((c, i) => (
              <TableRow key={callKey(c.call)}>
                <TableCell>
                  <Badge variant={i === 0 ? 'default' : 'secondary'}>#{i + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{GAMES_MAP[c.call.game]?.emoji}</span>
                    {formatCallLabel(c.call)}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtPct(c.share, 0)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex flex-wrap items-center gap-2">
                    {c.examples.map((dice) => (
                      <Hand key={dice.join('')} dice={dice} game={c.call.game} variant={c.call.variant} size="xs" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Exact over every roll: the call the site recommends, then its best call once {name} is refused. A Hammer who
        calls differently changes these. Refusers decide from their own dice, so a refusal doesn’t change the odds.
      </p>

      {after.length > 0 && (
        <div className="mt-5">
          <p className="font-medium">When is {name} the comeback?</p>
          <ul className="mt-2 space-y-1 text-sm">
            {after.slice(0, 4).map((x) => (
              <li key={`${callKey(x.first)}>${callKey(x.comeback.call)}`}>
                After <strong>{formatCallLabel(x.first)}</strong>: {formatCallLabel(x.comeback.call)}{' '}
                {fmtPct(x.comeback.share, 0)} of the time
                {x.top && <span className="text-muted-foreground"> (the likeliest comeback)</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
