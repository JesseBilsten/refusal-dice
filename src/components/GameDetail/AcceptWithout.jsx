import React, { useMemo, useState } from 'react'
import { ChoiceGroup, Panel } from '../Page'
import { DiceGroup } from '../Dice'
import { Badge } from '../ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { fmtPct } from '../Odds'
import { useHouseRules } from '../Settings/house-rules'
import { GAMES_MAP, getGameName } from '../../lib/games-config'
import { ACCEPT_ODDS_SAMPLES, acceptLean, acceptOddsFor } from '../../strategy'

const SEATS = [
  { value: 1, label: '1st refusal' },
  { value: 2, label: '2nd refusal' },
]
const TABLES = [
  { value: 3, label: '3 players' },
  { value: 6, label: '6 players' },
]
const VARIANTS = [
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' },
]

const BADGE = { accept: 'default', refuse: 'secondary', tossup: 'outline' }
const VERDICT = { accept: 'Accept', refuse: 'Refuse', tossup: 'Toss-up' }

/**
 * A kicker game's page: you're a refusal and haven't made the game. Is what
 * you hold (a partial match like 1-2 in Ship Captain Crew, or nothing)
 * worth accepting? Every roll played both ways against solid bots, averaged
 * by holding (src/strategy/accept-odds.ts, generated).
 */
export function AcceptWithoutGame({ gameId, className }) {
  const [rules] = useHouseRules()
  const [variant, setVariant] = useState('high')
  const [position, setPosition] = useState(2)
  const [players, setPlayers] = useState(3)
  const name = getGameName(gameId)
  const tens = gameId.startsWith('10-')
  const rows = useMemo(
    () => acceptOddsFor({ game: gameId, variant }, position, players, rules),
    [gameId, variant, position, players, rules]
  )
  if (!rows.length) return null

  return (
    <Panel
      className={className}
      title="Accepting without the game"
      description={`You’re a refusal and don’t have ${name} yet. Is what you hold worth accepting? Your chance of the pencil each way, by what your roll holds.`}
    >
      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3">
        {GAMES_MAP[gameId]?.hasVariants && (
          <ChoiceGroup
            label="Call"
            options={VARIANTS.map((v) => ({
              ...v,
              label: `${name} ${v.label}`,
            }))}
            value={variant}
            onChange={setVariant}
          />
        )}
        <ChoiceGroup
          label="You are the"
          options={SEATS}
          value={position}
          onChange={setPosition}
        />
        <ChoiceGroup
          label="Table"
          options={TABLES}
          value={players}
          onChange={setPlayers}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>You hold</TableHead>
            <TableHead className="text-right">Accept</TableHead>
            <TableHead className="text-right">Refuse</TableHead>
            <TableHead>Verdict</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.key}>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  {o.kind === 'made' ? (
                    'Made it'
                  ) : o.kind === 'nothing' ? (
                    tens ? (
                      'Not made'
                    ) : (
                      'Nothing to keep'
                    )
                  ) : (
                    <>
                      Keep <DiceGroup compact dice={o.kept} size="xs" />
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fmtPct(o.share, 0)} of rolls
                  {o.kind !== 'made' && `, make it ${fmtPct(o.chance, 0)}`}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmtPct(o.accept, 0)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {fmtPct(o.refuse, 0)}
              </TableCell>
              <TableCell>
                <Badge variant={BADGE[o.verdict]} className="whitespace-nowrap">
                  {VERDICT[o.verdict]}
                </Badge>
                {o.verdict !== 'tossup' && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {acceptLean(o).replace(/^\w+ /, '')}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
        <li>
          {tens
            ? `The 10s come in one roll, so there’s nothing to keep: each roll is a fresh try.`
            : gameId === 'monterey'
              ? 'Two ways to finish beat one: 3-4 fills with a 2 or a 5.'
              : 'Count your outs: a start that needs one exact die is worth less than it looks.'}
        </li>
        <li>
          Refusing hands the Hammer a second call. If your roll already plays it
          (see the comeback on this page), refusing costs you less.
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Your chance of the pencil this round, against solid bots: every roll
        played {ACCEPT_ODDS_SAMPLES} rounds each way, averaged by what it holds
        and weighted by how often it comes. The Hammer holds a roll they’d call
        this with. “Make it” is the exact chance with 2 rolls left. A toss-up is
        within about two standard errors.
      </p>
    </Panel>
  )
}

export default AcceptWithoutGame
