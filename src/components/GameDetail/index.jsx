import React, { useMemo, useState } from 'react'
import { Chip } from '../Page'
import { Hand } from '../Dice'
import {
  ProbabilityBar,
  STRENGTH_GRADES,
  StrengthTag,
  fmtPct,
  strengthGrade,
} from '../Odds'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { analyzeRoll } from '../../lib/game-validation'
import { GAMES_MAP, getGamePath } from '../../lib/games-config'
import { callLoss } from '../../strategy'

/**
 * The game page's analysis sections (templates/game-detail.js): how strong
 * the game's rolls are (StrengthChart), every roll pattern strongest first
 * (SampleRolls) and the games the same rolls make (PairedGames).
 */

/**
 * A roll's call in this game: the variant it plays best (or `variant`),
 * its kicker, and `loss`, the Hammer's chance of the pencil calling it
 * (call-odds.ts, from rounds played by solid bots)
 */
export const classifyRoll = (roll, gameId, variant, rules) => {
  const analysis = analyzeRoll(roll)
  const v = analysis.variants?.find((vv) => vv.game === gameId)
  if (!v) return null
  const variants = GAMES_MAP[gameId].hasVariants
    ? variant && variant !== 'all'
      ? [variant]
      : ['high', 'low']
    : [null]
  const best = variants
    .map((vr) => ({
      variant: vr,
      loss: callLoss(
        roll,
        { game: gameId, ...(vr ? { variant: vr } : {}) },
        rules
      ),
    }))
    .sort((a, b) => a.loss - b.loss)[0]
  return { variant: best.variant, loss: best.loss, kicker: v.kicker }
}

/* ────────────────────────────────────────────────────────────── */
/*  Strength: every roll that makes it, by grade (call-odds.ts)   */
/* ────────────────────────────────────────────────────────────── */
export const StrengthChart = ({ rolls, gameId, variant, rules }) => {
  const data = useMemo(() => {
    const counts = STRENGTH_GRADES.map(() => 0)
    let total = 0
    rolls.forEach((r) => {
      const info = classifyRoll(r.roll, gameId, variant, rules)
      if (!info) return
      counts[STRENGTH_GRADES.indexOf(strengthGrade(info.loss))] += r.count
      total += r.count
    })
    return STRENGTH_GRADES.map((g, i) => ({
      grade: g,
      prev: STRENGTH_GRADES[i - 1],
      p: total ? counts[i] / total : 0,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolls, gameId, variant, rules.montereyLoneKeep])

  return (
    <div className="space-y-2">
      {data.map(({ grade, prev, p }) => (
        <ProbabilityBar
          key={grade.label}
          label={grade.label}
          sublabel={
            <span className="text-muted-foreground">
              {grade.max === Infinity
                ? `over ${fmtPct(prev.max)}`
                : `${fmtPct(grade.max)} or less`}
            </span>
          }
          p={p}
          digits={1}
          className="grid-cols-[minmax(0,9rem)_1fr_auto]"
        />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Sample Rolls Table                                           */
/* ────────────────────────────────────────────────────────────── */
export const SampleRolls = ({ rolls, gameId, variant, hasVariants, rules }) => {
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const result = rolls
      .map((r) => ({
        ...r,
        info: classifyRoll(r.roll, gameId, hasVariants ? variant : null, rules),
      }))
      .filter((r) => r.info)
    result.sort((a, b) => a.info.loss - b.info.loss)
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolls, gameId, variant, hasVariants, rules.montereyLoneKeep])

  const display = showAll ? filtered : filtered.slice(0, 20)

  if (filtered.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No matching rolls
      </p>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roll</TableHead>
            {hasVariants && <TableHead>Variant</TableHead>}
            <TableHead>Strength</TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              Occurrences
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {display.map((r, i) => (
            <TableRow key={i}>
              <TableCell>
                <Hand
                  dice={r.roll}
                  game={gameId}
                  variant={r.info.variant}
                  size="xs"
                />
              </TableCell>
              {hasVariants && (
                <TableCell>
                  <Badge
                    variant={
                      r.info.variant === 'high' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {r.info.variant || '—'}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <StrengthTag loss={r.info.loss} />
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground text-sm hidden sm:table-cell">
                {r.count}×
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filtered.length > 20 && (
        <div className="text-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? 'Show fewer' : `Show all ${filtered.length} rolls`}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Co-playable Games summary chips                              */
/* ────────────────────────────────────────────────────────────── */
export const PairedGames = ({ rolls, gameId }) => {
  const coPlayable = useMemo(() => {
    const counts = {}
    let total = 0
    rolls.forEach((r) => {
      total += r.count
      const seen = new Set()
      ;(r.analysis?.variants || []).forEach((v) => {
        if (v.game !== gameId && !seen.has(v.game)) {
          seen.add(v.game)
          counts[v.game] = (counts[v.game] || 0) + r.count
        }
      })
    })
    return Object.entries(counts)
      .map(([id, count]) => ({ id, count, pct: (count / total) * 100 }))
      .sort((a, b) => b.pct - a.pct)
  }, [rolls, gameId])

  if (coPlayable.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {coPlayable.slice(0, 8).map((g) => {
        const meta = GAMES_MAP[g.id]
        return (
          <Chip
            key={g.id}
            to={getGamePath(g.id)}
            className="inline-flex items-center gap-1.5"
          >
            <span aria-hidden>{meta?.emoji || '🎲'}</span>
            <span>{meta?.name || g.id}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {fmtPct(g.pct / 100)}
            </span>
          </Chip>
        )
      })}
    </div>
  )
}
