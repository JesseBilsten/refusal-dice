import React, { useMemo } from 'react'
import { Link } from 'gatsby'
import { ArrowRight } from 'lucide-react'
import { keepOptions, tresAwayExpected, tresAwayPutOut } from '../../strategy'
import { Hand } from '../Dice'
import { fmtPct } from '../Odds'
import { Panel } from '../Page'
import { goalFor, lockedPositions, optionLabel, rerollsFor, situationRules, situationWhy } from './keep-model'
import { useHouseRules } from '../Settings/house-rules'
import { SITUATIONS, situationPath } from './situations-catalog'

/**
 * A game page's "question from the table": the situation, the exact best
 * answer and the options the question asked about, with a link to work it
 * through in the Odds Lab.
 */
export default function SituationCard({ gameId, className }) {
  const situation = SITUATIONS[gameId]
  const [rules] = useHouseRules()
  const s = situation?.s
  const dice = s ? s.roll.split('').map(Number) : null

  const answer = useMemo(() => {
    if (!s) return null
    if (s.game === 'tres-away') {
      const out = tresAwayPutOut(dice)
      const v = tresAwayExpected()
      const avg = (k) => {
        const sorted = [...dice].map((d) => (d === 3 ? 0 : d)).sort((a, b) => a - b)
        return sorted.slice(0, k).reduce((a, b) => a + b, 0) + v[5 - k]
      }
      return {
        best: `Put out ${out.map((i) => dice[i]).join('-')}`,
        line: `average final score ${avg(out.length).toFixed(2)}, against ${avg(out.length + 1).toFixed(2)} if you also put out the next die`,
      }
    }
    const beat = s.beat ? s.beat.split('').map(Number) : null
    const opts = keepOptions(dice, rerollsFor(s), goalFor(s, beat), {
      locked: lockedPositions(dice, s.kept),
      rules: situationRules(situation, rules),
    })
    const best = opts[0]
    const others = (s.ask || [])
      .map((d) => opts.find((o) => !o.stand && o.dice.join('') === d))
      .filter((o) => o && o !== best)
    const pct = (o) =>
      o.tie === 1 ? 'a sure tie (a replay)' : `${fmtPct(o.win, 1)}${o.tie > 0 ? ` (+${fmtPct(o.tie, 1)} ties)` : ''}`
    const same = (o) => Math.abs(o.win - best.win) < 1e-9 && Math.abs(o.tie - best.tie) < 1e-9
    return {
      best: optionLabel(best),
      line: [
        best.tie === 1 ? 'A sure tie (a replay)' : `${pct(best)} to get what you need`,
        ...others.map((o) => `${optionLabel(o).toLowerCase()}: ${same(o) ? 'the same odds' : pct(o)}`),
      ].join(' · '),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, rules.montereyLoneKeep])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const why = useMemo(() => situationWhy(situation, rules, (p) => fmtPct(p, 1)), [gameId, rules.montereyLoneKeep])

  if (!situation) return null
  return (
    <Panel tone="tool" title="A question from the table" className={className}>
      <p className="mb-3 font-medium">{situation.label}</p>
      <Hand dice={dice} game={s.game} variant={s.variant} />
      <p className="mt-4">
        <strong>{answer.best}.</strong> <span className="text-muted-foreground">{answer.line}.</span>
      </p>
      {why && (
        <>
          <p className="mt-4 font-medium">{situation.whyTitle}</p>
          {why.map((para) => (
            <p key={para} className="mt-2 text-muted-foreground">
              {para}
            </p>
          ))}
        </>
      )}
      <Link
        to={situationPath(s)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        Work it through in the Odds Lab <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </Panel>
  )
}
