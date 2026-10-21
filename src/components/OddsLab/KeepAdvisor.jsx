import React, { useEffect, useMemo, useRef, useState } from 'react'
import { isKickerGame, tresAwayScore } from '../../engine'
import { keepOptions, tresAwayExpected, tresAwayPutOut } from '../../strategy'
import { CALLABLE_GAMES, getGameName } from '../../lib/games-config'
import { cn } from '../../lib/utils'
import { COUNT_WORDS, DiceGroup, Hand, RollInput, razzleName } from '../Dice'
import { Disclosure, OddsDecision, Questions, fmtPct } from '../Odds'
import { Chip, Panel } from '../Page'
import { SITUATIONS } from './situations-catalog'
import { bossName, goalFor, lockedPositions, optionLabel, rerollsFor, situationRules } from './keep-model'
import SituationWhy from './SituationWhy'
import { useHouseRules } from '../Settings/house-rules'

/**
 * "What should I keep?": pick a game, enter your dice and what you need,
 * and every keep is ranked by its exact chance (src/strategy/situations.ts).
 * The state lives in the URL, so a situation can be shared or linked to
 * from a game page.
 */


/** What each kicker game lets you keep before it's made (docs/RULES.md §3.1) */
const KEEP_RULE = {
  '10-2': '10-2 has to come in one roll: nothing can be kept until you have it.',
  '10-3': '10-3 has to come in one roll: nothing can be kept until you have it.',
  '10-4': '10-4 has to come in one roll: nothing can be kept until you have it.',
  'ship-captain-crew': 'In Ship Captain Crew you may keep 1-2 or 5-6, one or the other, toward the straight.',
  monterey: 'In Monterey you may keep 2-3, 3-4 or 4-5 toward the straight (a lone 3 or 4 too, if your table allows it: see House rules in Settings).',
  vegas: 'In 7’s you may keep one pair that sums to 7 or 11 toward the second. The kept pair stays a pair: the second has to come from the dice you roll.',
  pairs: 'In Pairs you may keep one pair toward the second.',
}

const EMPTY = ['', '', '', '', '']
const toValues = (digits) =>
  /^[1-6]{5}$/.test(digits || '') ? digits.split('') : [...EMPTY]

/** Questions people actually ask at the table, one click away */
const EXAMPLES = Object.values(SITUATIONS)

/** The example question on screen, untouched (null once anything is edited) */
const exampleShown = (s, dice, beat) =>
  EXAMPLES.find((e) =>
    Object.entries(e.s).every(([k, v]) =>
      k === 'roll' ? dice.join('') === v : k === 'beat' ? beat.join('') === v : k === 'ask' ? s.ask.join() === v.join() : s[k] === v
    )
  ) ?? null

const DEFAULT = { game: 'monterey', roll: '', rolls: 2, goal: 'make', variant: 'high', total: 7, count: 3, face: 5, beat: '', kept: '', ask: [] }

function readUrl() {
  const p = new URLSearchParams(window.location.search)
  const num = (k, d) => (p.get(k) && !Number.isNaN(Number(p.get(k))) ? Number(p.get(k)) : d)
  const game = CALLABLE_GAMES.some((g) => g.id === p.get('game')) ? p.get('game') : DEFAULT.game
  return {
    game,
    roll: p.get('roll') || '',
    rolls: num('rolls', 2) === 1 ? 1 : 2,
    goal: p.get('goal') === 'kicker' ? 'kicker' : 'make',
    variant: p.get('variant') === 'low' ? 'low' : 'high',
    total: num('total', DEFAULT.total),
    count: num('count', DEFAULT.count),
    face: num('face', DEFAULT.face),
    beat: p.get('beat') || '',
    kept: /^[1-6]{1,4}$/.test(p.get('kept') || '') ? p.get('kept') : '',
    ask: p.get('ask') !== null ? p.get('ask').split(',') : [],
  }
}

const Field = ({ label, children, hint }) => (
  <div className="space-y-2">
    <div className="text-sm font-semibold">{label}</div>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
)

const NumberSelect = ({ value, onChange, options, label }) => (
  <select
    aria-label={label}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

export default function KeepAdvisor() {
  const [s, setS] = useState(DEFAULT)
  const [tableRules, setRules] = useHouseRules()
  const [dice, setDice] = useState([...EMPTY])
  const [beat, setBeat] = useState([...EMPTY])
  const hydrated = useRef(false)

  useEffect(() => {
    const fromUrl = readUrl()
    setS(fromUrl)
    setDice(toValues(fromUrl.roll))
    setBeat(toValues(fromUrl.beat))
    hydrated.current = true
  }, [])

  // Keep the URL shareable
  useEffect(() => {
    if (!hydrated.current) return
    const p = new URLSearchParams({ tab: 'keep', game: s.game })
    const roll = dice.join('')
    if (roll.length === 5) p.set('roll', roll)
    if (isKickerGame(s.game) || s.game === 'razzle') p.set('rolls', s.rolls)
    if (isKickerGame(s.game)) {
      if (s.rolls === 1 && s.kept) p.set('kept', s.kept)
      p.set('goal', s.goal)
      if (s.goal === 'kicker') {
        p.set('variant', s.variant)
        p.set('total', s.total)
      }
    }
    if (s.game === 'razzle') {
      p.set('count', s.count)
      p.set('face', s.face)
    }
    if (s.game === 'boss' && beat.join('').length === 5) p.set('beat', beat.join(''))
    window.history.replaceState(null, '', `${window.location.pathname}?${p}`)
  }, [s, dice, beat])

  const update = (patch) => setS((cur) => ({ ...cur, ask: [], kept: '', ...patch }))
  const load = (example) => {
    setS({ ...DEFAULT, ...example.s })
    setDice(toValues(example.s.roll))
    setBeat(toValues(example.s.beat))
  }

  const roll = dice.every(Boolean) ? dice.map(Number) : null
  const hand = beat.every(Boolean) ? beat.map(Number) : null
  const example = exampleShown(s, dice, beat)
  // A question that assumes a house rule this table hasn't turned on is still answered under it
  const needsRule = example?.rules && Object.entries(example.rules).some(([k, v]) => tableRules[k] !== v)
  const rules = example ? situationRules(example, tableRules) : tableRules
  const kicker = isKickerGame(s.game)
  const name = getGameName(s.game)
  const kickerDice = { '10-2': 3, '10-3': 2, '10-4': 1 }[s.game] ?? (s.game === 'vegas' || s.game === 'pairs' ? 1 : 2)

  // What you need, as a goal for the solver and in words
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goal = useMemo(() => goalFor(s, hand), [s, hand && hand.join('')])

  const target = !goal
    ? null
    : goal.kind === 'make'
      ? { outcome: `make ${name}`, win: `make ${name}` }
      : goal.kind === 'kicker'
        ? { outcome: `beat a kicker of ${goal.total}`, win: `beat ${goal.total}`, tie: `tie at ${goal.total}: replay` }
        : goal.kind === 'razzle'
          ? { outcome: `beat ${razzleName(goal.count, goal.face)}`, win: 'beat it', tie: 'tie: replay' }
          : { outcome: `beat ${bossName(goal.hand)}`, win: 'beat it', tie: 'tie: replay' }

  const rerolls = rerollsFor(s)
  // Kicker games, last roll next: the dice kept last roll stay kept. The choices are the legal keeps in this roll
  const lockChoices = useMemo(() => {
    if (!roll || !kicker || s.rolls !== 1) return []
    const seen = new Set()
    return keepOptions(roll, 1, { kind: 'make', game: s.game }, { rules })
      .filter((o) => !o.stand && o.dice.length > 0)
      .map((o) => o.dice.join(''))
      .filter((d) => !seen.has(d) && seen.add(d))
      .sort((a, b) => a.length - b.length || a.localeCompare(b))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roll && roll.join(''), kicker, s.rolls, s.game, rules.montereyLoneKeep])
  const kept = lockChoices.includes(s.kept) ? s.kept : ''
  const locked = useMemo(() => lockedPositions(roll, kept), [roll, kept])
  const options = useMemo(
    () => (roll && goal ? keepOptions(roll, rerolls, goal, { locked, rules }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roll && roll.join(''), rerolls, JSON.stringify(goal), kept, rules.montereyLoneKeep]
  )

  // Options with identical chances are one choice: show the first, list the rest as "same odds"
  const distinct = useMemo(() => {
    if (!options) return []
    const out = []
    options.forEach((o) => {
      const twin = out.find(
        (d) => !d.stand && !o.stand && Math.abs(d.win - o.win) < 1e-9 && Math.abs(d.tie - o.tie) < 1e-9
      )
      if (twin) twin.same.push(o)
      else out.push({ ...o, same: [] })
    })
    return out
  }, [options])

  // The top few, the keeps the question asked about, and "roll all five" (and
  // standing, when it can work) so the obvious choices are always there
  // A keep's chance with n rolls left, for comparing (RollsPct)
  const withRolls = (o) => (n) => {
    if (n === rerolls) return o.win + o.tie
    const x = keepOptions(roll, n, goal, { locked, rules }).find((y) => !y.stand && y.dice.join('') === o.dice.join(''))
    return x ? x.win + x.tie : null
  }

  const shown = useMemo(() => {
    const pick = distinct.slice(0, 3)
    const add = (o) => o && !pick.includes(o) && pick.push(o)
    const keeps = (o, digits) => !o.stand && [o, ...o.same].some((x) => x.dice.join('') === digits)
    ;(s.ask || []).forEach((digits) => add(distinct.find((o) => keeps(o, digits))))
    add(distinct.find((o) => o.stand && o.win + o.tie > 0))
    add(distinct.find((o) => keeps(o, '')))
    return pick
  }, [distinct, s.ask])

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-semibold">Try a question from the table</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <Chip key={e.label} onClick={() => load(e)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Panel tone="tool" title="Your situation" as="div">
          <div className="space-y-5">
            <Field label="Game">
              <div className="flex flex-wrap gap-1.5">
                {CALLABLE_GAMES.map((g) => (
                  <Chip key={g.id} active={s.game === g.id} onClick={() => update({ game: g.id })}>
                    <span aria-hidden>{g.emoji}</span> {g.name}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Your dice">
              <RollInput size="md" diceValues={dice} onDiceChange={setDice} />
            </Field>

            {(kicker || s.game === 'razzle') && (
              <Field label="Rolls left after this one">
                <div className="flex gap-1.5">
                  {[2, 1].map((n) => (
                    <Chip key={n} active={s.rolls === n} onClick={() => update({ rolls: n })}>
                      {n === 2 ? '2 (this is your first roll)' : '1 (your last roll is next)'}
                    </Chip>
                  ))}
                </div>
              </Field>
            )}

            {lockChoices.length > 0 && (
              <Field label="Dice you kept last roll" hint="Kept dice stay kept, so every option holds them.">
                <div className="flex flex-wrap gap-1.5">
                  {['', ...lockChoices].map((d) => (
                    <Chip key={d || 'none'} active={kept === d} onClick={() => setS((cur) => ({ ...cur, kept: d }))}>
                      {d ? d.split('').join('-') : 'None'}
                    </Chip>
                  ))}
                </div>
              </Field>
            )}

            {kicker && (
              <Field label="What you need">
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={s.goal === 'make'} onClick={() => update({ goal: 'make' })}>
                    Just make {name}
                  </Chip>
                  <Chip active={s.goal === 'kicker'} onClick={() => update({ goal: 'kicker' })}>
                    Make it and beat a kicker
                  </Chip>
                </div>
                {s.goal === 'kicker' && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <NumberSelect
                      label="Variant"
                      value={s.variant === 'high' ? 1 : 0}
                      onChange={(v) => update({ variant: v ? 'high' : 'low' })}
                      options={[
                        { value: 1, label: 'High' },
                        { value: 0, label: 'Low' },
                      ]}
                    />
                    <span>kicker to beat:</span>
                    <NumberSelect
                      label="Kicker total to beat"
                      value={s.total}
                      onChange={(v) => update({ total: v })}
                      options={Array.from({ length: 5 * kickerDice + 1 }, (_, i) => ({
                        value: kickerDice + i,
                        label: String(kickerDice + i),
                      }))}
                    />
                  </div>
                )}
              </Field>
            )}

            {s.game === 'razzle' && (
              <Field label="Hand to beat" hint="1s are wild. Equal counts go to the higher number.">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <NumberSelect
                    label="How many"
                    value={s.count}
                    onChange={(v) => update({ count: v })}
                    options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: COUNT_WORDS[n] }))}
                  />
                  <NumberSelect
                    label="Of which number"
                    value={s.face}
                    onChange={(v) => update({ face: v })}
                    options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}s` }))}
                  />
                </div>
              </Field>
            )}

            {s.game === 'boss' && (
              <Field
                label="Hand to beat"
                hint="Your last roll after the Boss says “come up”: you need to beat the worst hand showing so far."
              >
                <RollInput size="sm" label="Hand to beat" diceValues={beat} onDiceChange={setBeat} />
              </Field>
            )}
          </div>
        </Panel>

        <div className="min-w-0">
          {s.game === 'tres-away' ? (
            <TresAwayAdvice roll={roll} />
          ) : !roll ? (
            <Empty>Enter your five dice, or tap Roll.</Empty>
          ) : !goal ? (
            <Empty>Enter the hand you need to beat.</Empty>
          ) : (
            <div className="space-y-4">
              {needsRule && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <span>This question is about a house rule: keeping a lone 3 or 4 in Monterey.</span>
                  <Chip onClick={() => setRules(example.rules)}>Use that rule at my table</Chip>
                </div>
              )}
              <Hand dice={roll} game={s.game} variant={kicker ? s.variant : null} />
              <OddsDecision
                // The bars stack wins and ties, so with ties in play they measure "beat or tie"
                outcome={shown.some((o) => o.tie > 0) ? target.outcome.replace(/^beat /, 'beat or tie ') : target.outcome}
                // Every option's odds run to your last roll: say how many rolls that is
                when={rerolls > 1 ? `With ${rerolls} rolls left` : 'On your last roll'}
                lowerIsBetter={false}
                options={shown.map((o, i) => ({
                  id: String(i),
                  label: optionLabel(o),
                  ...(o.stand ? {} : { rolls: rerolls, over: s.game === 'boss' ? null : withRolls(o) }),
                  visual: o.stand ? null : (
                    <span className="flex items-center gap-1.5">
                      {o.dice.length > 0 && <DiceGroup compact dice={o.dice} size="xs" />}
                      <span className="text-xs text-muted-foreground">
                        {o.dice.length ? '+' : ''} roll {5 - o.dice.length}
                        {o.same.length > 0 &&
                          ` · same odds: keep ${o.same.map((x) => x.dice.join('-') || 'none').join(', ')}`}
                      </span>
                    </span>
                  ),
                  segments: [
                    { p: o.win, label: target.win, kind: 'safe' },
                    ...(o.tie > 0 ? [{ p: o.tie, label: target.tie, kind: 'coin' }] : []),
                  ],
                }))}
              />
              {example?.why && (
                <Disclosure title={example.whyTitle}>
                  <SituationWhy situation={example} rules={rules} />
                </Disclosure>
              )}
              <Disclosure title="How this is worked out">
                <p>
                  Every way the dice you throw can land is counted exactly. After this roll, you're assumed to keep the
                  best dice each time{rerolls > 1 ? ', so later rolls are played as well as possible too' : ''}.
                  {kicker &&
                    ' Only keeps the rules allow are counted: dice toward the game, never a kicker die, and dice you keep stay kept.'}
                </p>
                {target.tie && (
                  <p>A tie is a replay, so it counts as half a win when the options are ranked.</p>
                )}
                <p>
                  These are the chances of reaching what you need, not of avoiding the pencil: that also depends on
                  everyone else's dice.
                </p>
              </Disclosure>
              <Disclosure title="Questions">
                <Questions
                  items={[
                    ...(kicker
                      ? [
                          {
                            q: 'Why can’t I keep any dice I like?',
                            a: `${KEEP_RULE[s.game]} Once you keep dice you’re committed to them and they’re part of your game. Once you’ve made the game its dice can’t be re-rolled: only the kicker is, all of it at once.`,
                          },
                        ]
                      : []),
                    {
                      q: 'Why does the answer change with the rolls left?',
                      a: 'With one roll left you need the hand now, so the most direct keep wins. With two, a keep that leaves more ways open has time to pay off.',
                    },
                    {
                      q: 'What does the best option give me?',
                      a: `${fmtPct(shown[0]?.win ?? 0, 1)} to ${target.outcome}${shown[0]?.tie ? `, and ${fmtPct(shown[0].tie, 1)} to tie` : ''}.`,
                    },
                  ]}
                />
              </Disclosure>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Empty = ({ children }) => (
  <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed p-6 text-center text-muted-foreground">
    {children}
  </div>
)

/** Tres Away: which dice to put out, by expected final score */
function TresAwayAdvice({ roll }) {
  if (!roll) return <Empty>Enter your five dice, or tap Roll.</Empty>
  const v = tresAwayExpected()
  const order = [0, 1, 2, 3, 4].sort((a, b) => tresAwayScore([roll[a]]) - tresAwayScore([roll[b]]))
  const best = tresAwayPutOut(roll)
  const rows = [1, 2, 3, 4, 5].map((k) => {
    const out = order.slice(0, k)
    const now = tresAwayScore(out.map((i) => roll[i]))
    return { k, out, now, expected: now + v[5 - k] }
  })
  return (
    <div className="space-y-4">
      <Hand dice={roll} game="tres-away" />
      <p className="text-base">
        <strong>Put out {best.length === 1 ? 'one die' : `${best.length} dice`}.</strong> Your final score averages{' '}
        <strong>{rows[best.length - 1].expected.toFixed(2)}</strong>, the lowest of any choice. Lowest score wins; 3s
        count 0.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.k}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-md border p-3',
              r.k === best.length ? 'border-primary ring-1 ring-primary' : 'border-border'
            )}
          >
            <span className="flex items-center gap-2">
              <DiceGroup compact dice={r.out.map((i) => roll[i])} size="xs" />
              <span className="text-sm">
                Put out {r.k === 5 ? 'all five' : r.k}
                {r.k < 5 && `, roll ${5 - r.k}`}
              </span>
            </span>
            <span className="text-right">
              <span className="text-xl font-semibold tabular-nums">{r.expected.toFixed(2)}</span>
              <span className="block text-xs text-muted-foreground">average final score</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Exact over every roll, putting out the best dice each time after this one. The lowest average is a strong
        guide; whether you end up highest also depends on the other players.
      </p>
    </div>
  )
}
