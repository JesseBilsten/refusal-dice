import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'gatsby'
import { Check, Link2, RotateCcw } from 'lucide-react'
import Layout from '../components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group'
import QueryBuilder, { newPattern, withIds } from '../components/OddsLab/QueryBuilder'
import RollGrid from '../components/OddsLab/RollGrid'
import OutcomeMap from '../components/OddsLab/OutcomeMap'
import {
  MAX_DICE,
  PRESETS,
  RULE_TYPES,
  OPS,
  atLeastOneOf,
  evaluateQuery,
  validateQuery,
} from '../lib/roll-query'
import { checkGame } from '../lib/game-validation'
import { GAMES, isSpecialtyGame } from '../lib/games-config'
import { cn } from '../lib/utils'

/**
 * ODDS LAB
 * Describe any roll with requirements (specific dice, runs, of-a-kinds,
 * sums, per-die limits, counts) and watch every possible outcome light up
 * or fade out. Probabilities are exact (see src/lib/roll-query.js).
 */

const COMPARABLE_GAMES = GAMES.filter((g) => !isSpecialtyGame(g.id) && g.id !== 'barking')

const emptyQuery = (diceCount = 5) => ({
  diceCount,
  invert: false,
  patterns: [newPattern()],
})

/* ── URL state: ?q=<base64url JSON>&compare=<gameId> ── */

const encodeQuery = (query) => {
  const json = JSON.stringify(query, (k, v) => (k === 'id' ? undefined : v))
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

const decodeQuery = (param) => {
  try {
    const q = JSON.parse(atob(param.replace(/-/g, '+').replace(/_/g, '/')))
    if (!Number.isInteger(q.diceCount) || q.diceCount < 1 || q.diceCount > MAX_DICE) return null
    if (!Array.isArray(q.patterns)) return null
    const patterns = q.patterns.map((p) => ({
      rules: (Array.isArray(p.rules) ? p.rules : []).filter(
        (r) =>
          r &&
          RULE_TYPES[r.type] &&
          (r.op == null || r.op === 'any' || OPS[r.op]) &&
          (r.values == null || (Array.isArray(r.values) && r.values.every(isNum)))
      ),
    }))
    return withIds({ diceCount: q.diceCount, invert: !!q.invert, patterns })
  } catch (e) {
    return null
  }
}

const formatPct = (p) => {
  if (p === 0) return '0%'
  if (p === 1) return '100%'
  const v = p * 100
  if (v >= 10) return `${v.toFixed(1)}%`
  if (v >= 1) return `${v.toFixed(2)}%`
  return `${v.toPrecision(2)}%`
}

const formatOneIn = (p) => {
  if (p <= 0) return 'never'
  const x = 1 / p
  if (x < 10) return `1 in ${x.toFixed(2)}`
  if (x < 100) return `1 in ${x.toFixed(1)}`
  return `1 in ${Math.round(x).toLocaleString()}`
}

const Stat = ({ label, value, sub }) => (
  <div>
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="text-2xl font-bold tabular-nums">{value}</div>
    {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
  </div>
)

const OddsLabPage = () => {
  const [query, setQuery] = useState(() => withIds(PRESETS[0].query))
  const [compareGame, setCompareGame] = useState(PRESETS[0].gameId)
  const [view, setView] = useState('unique')
  const [matchesFirst, setMatchesFirst] = useState(false)
  const [copied, setCopied] = useState(false)
  const hydrated = useRef(false)

  // Load a shared query from the URL once, on the client
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('q') && decodeQuery(params.get('q'))
    if (fromUrl) {
      setQuery(fromUrl)
      const compare = params.get('compare')
      setCompareGame(COMPARABLE_GAMES.some((g) => g.id === compare) ? compare : null)
    }
    if (params.get('view') === 'ordered') setView('ordered')
    hydrated.current = true
  }, [])

  // Keep the URL shareable as the query changes
  useEffect(() => {
    if (!hydrated.current) return
    const params = new URLSearchParams({ q: encodeQuery(query) })
    if (compareGame) params.set('compare', compareGame)
    if (view === 'ordered') params.set('view', view)
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`)
    setCopied(false)
  }, [query, compareGame, view])

  const result = useMemo(() => evaluateQuery(query), [query])
  const issues = useMemo(() => validateQuery(query), [query])
  const matchByKey = useMemo(() => new Map(result.rolls.map((r) => [r.key, r.match])), [result])

  // Compare against the site's own definition of a game (5 dice only)
  const comparison = useMemo(() => {
    if (!compareGame || query.diceCount !== 5) return null
    let siteCount = 0
    const diffKeys = new Set()
    let diffUnique = 0
    result.rolls.forEach((r) => {
      const site = checkGame(r.roll, compareGame)
      if (site) siteCount += r.count
      if (site !== r.match) {
        diffKeys.add(r.key)
        diffUnique += 1
      }
    })
    return { siteCount, diffKeys, diffUnique }
  }, [compareGame, query.diceCount, result])

  const loadPreset = (preset) => {
    setQuery(withIds(preset.query))
    setCompareGame(preset.gameId || null)
  }

  const setDiceCount = (n) => setQuery((q) => ({ ...q, diceCount: n }))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch (e) {
      setCopied(false)
    }
  }

  const compareName = COMPARABLE_GAMES.find((g) => g.id === compareGame)?.name

  return (
    <Layout>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Odds Lab</h1>
          <p className="mx-auto mt-2 max-w-2xl text-base text-muted-foreground">
            Describe any roll and see exactly how often it happens. Every possible outcome is shown
            below; the ones that don't fit your requirements fade out. Use it to check the
            site's odds against your own rules for a game or situation.
          </p>
        </div>

        {/* ── Presets ── */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Start from
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button key={p.id} variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => loadPreset(p)}>
                {p.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => {
                setQuery(emptyQuery(query.diceCount))
                setCompareGame(null)
              }}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Blank
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Builder ── */}
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-sm font-medium">Dice rolled</Label>
              <ToggleGroup
                type="single"
                value={String(query.diceCount)}
                onValueChange={(v) => v && setDiceCount(Number(v))}
                aria-label="Number of dice"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <ToggleGroupItem key={n} value={String(n)} className="h-8 w-9 text-sm">
                    {n}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <QueryBuilder query={query} onChange={setQuery} />

            <div className="flex items-center gap-2">
              <Switch
                id="invert"
                checked={query.invert}
                onCheckedChange={(invert) => setQuery((q) => ({ ...q, invert }))}
              />
              <Label htmlFor="invert" className="text-sm">
                Flip it: highlight rolls that <strong>don't</strong> match
              </Label>
            </div>

            {issues.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-4">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* ── Results ── */}
          <div className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Odds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-live="polite">
                  <Stat label="Chance" value={formatPct(result.probability)} sub={formatOneIn(result.probability)} />
                  <Stat
                    label="Outcomes"
                    value={result.matched.toLocaleString()}
                    sub={`of ${result.total.toLocaleString()}`}
                  />
                  <Stat
                    label="Unique rolls"
                    value={result.uniqueMatched}
                    sub={`of ${result.rolls.length}`}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Chance at least one player at the table rolls it:
                  </p>
                  <div className="grid grid-cols-4 gap-1 text-center text-xs tabular-nums sm:grid-cols-7">
                    {[2, 3, 4, 5, 6, 7, 8].map((players) => (
                      <div key={players} className="rounded bg-muted/50 px-1 py-1.5">
                        <div className="text-muted-foreground">{players}p</div>
                        <div className="font-semibold">{formatPct(atLeastOneOf(result.probability, players))}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">The link updates as you edit.</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={copyLink}>
                    {copied ? <Check className="mr-1 h-3 w-3" /> : <Link2 className="mr-1 h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy link'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ── Compare with the site ── */}
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="compare" className="text-sm font-medium">
                    Check against the site's odds for
                  </Label>
                  <select
                    id="compare"
                    value={compareGame || ''}
                    onChange={(e) => setCompareGame(e.target.value || null)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">nothing</option>
                    {COMPARABLE_GAMES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                {compareGame && query.diceCount !== 5 && (
                  <p className="text-sm text-muted-foreground">The site's game odds are for 5 dice. Switch to 5 dice to compare.</p>
                )}
                {comparison && (
                  <div className="text-sm">
                    <p>
                      The site counts <strong>{compareName}</strong> as{' '}
                      <strong className="tabular-nums">{comparison.siteCount.toLocaleString()}</strong> of 7,776 outcomes (
                      {formatPct(comparison.siteCount / 7776)}).{' '}
                      <Link to={`/odds?game=${compareGame}`} className="text-primary hover:underline">
                        View on the Odds page
                      </Link>
                    </p>
                    {comparison.diffUnique === 0 ? (
                      <p className="mt-1 flex items-center gap-1 font-medium text-uncommon-foreground">
                        <Check className="h-4 w-4" /> Your query matches exactly the same rolls.
                      </p>
                    ) : (
                      <p className="mt-1">
                        Your query differs on{' '}
                        <strong>
                          {comparison.diffUnique} unique {comparison.diffUnique === 1 ? 'roll' : 'rolls'}
                        </strong>{' '}
                        ({(result.matched - comparison.siteCount >= 0 ? '+' : '') +
                          (result.matched - comparison.siteCount).toLocaleString()}{' '}
                        outcomes). They're outlined in gold below.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Visualization ── */}
        <div className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Every possibility</h2>
            <div className="flex flex-wrap items-center gap-4">
              {view === 'unique' && (
                <div className="flex items-center gap-2">
                  <Switch id="matches-first" checked={matchesFirst} onCheckedChange={setMatchesFirst} />
                  <Label htmlFor="matches-first" className="text-sm">
                    Matches first
                  </Label>
                </div>
              )}
              <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)} aria-label="View">
                <ToggleGroupItem value="unique" className="h-8 px-3 text-xs">
                  Unique rolls ({result.rolls.length})
                </ToggleGroupItem>
                <ToggleGroupItem value="ordered" className="h-8 px-3 text-xs">
                  Every outcome ({result.total.toLocaleString()})
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-uncommon-border bg-uncommon" /> Matches
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-muted" /> Doesn't match
            </span>
            {comparison && comparison.diffUnique > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm ring-2 ring-epic-border" /> Differs from the site
              </span>
            )}
            {view === 'unique' && <span>Dimmed dice inside a match weren't needed by any requirement (the kicker). ×N is how many ordered outcomes give that roll.</span>}
          </div>

          <div className={cn(view !== 'unique' && 'hidden')}>
            <RollGrid
              rolls={result.rolls}
              total={result.total}
              diffKeys={comparison?.diffKeys}
              matchesFirst={matchesFirst}
            />
          </div>
          {view === 'ordered' && (
            <OutcomeMap diceCount={query.diceCount} matchByKey={matchByKey} diffKeys={comparison?.diffKeys} />
          )}
        </div>

        {/* ── How it works ── */}
        <div className="mt-10 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          <h2 className="mb-2 font-semibold text-foreground">How requirements combine</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>All requirements in a pattern must hold. If you add more than one pattern, a roll counts when <em>any</em> pattern fits.</li>
            <li>
              Requirements that name a number of dice each use their <strong>own</strong> dice, so "2 dice add up to 7"
              twice needs two separate pairs, just like 7's.
            </li>
            <li>"Remaining dice" means the dice no other requirement used (the kicker). "All dice" looks at the whole roll.</li>
            <li>Odds are exact: every one of the {result.total.toLocaleString()} outcomes is counted, not sampled.</li>
          </ul>
        </div>
      </section>
    </Layout>
  )
}

export default OddsLabPage
