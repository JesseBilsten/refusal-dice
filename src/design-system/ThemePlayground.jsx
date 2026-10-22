import React, { useEffect, useState } from 'react'
import { Check, Copy, RotateCcw } from 'lucide-react'
import { Chip, PageHeader, Panel, Stat } from '../components/Page'
import { Hand } from '../components/Dice'
import { ProbabilityBar } from '../components/Odds'
import Seat from '../components/Table/Seat'
import TableFelt from '../components/Table/TableFelt'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { NativeSelect } from '../components/ui/native-select'
import { Code, DocSection } from './DocKit'
import { ContrastTable } from './guides'
import {
  DRAFT_TOKENS,
  FONTS,
  PRESETS,
  activeValues,
  currentValue,
  draftCss,
  hexToHsl,
  hslToHex,
  isEmptyDraft,
  typeScale,
  useThemeDraft,
  withToken,
} from './theme-draft'

/**
 * The theme playground: change tokens and see the result at once, here and
 * across the design system (or the whole site, in this browser). Nothing is
 * saved to the site until the CSS it produces is put in global.css.
 */

const EMPTY = { light: {}, dark: {}, shared: {}, siteWide: false }
const GROUP_ORDER = ['Color', 'Brand', 'Odds', 'Type', 'Shape']

/** Re-read token values whenever the theme or the draft changes */
function useLiveValues() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    setTick((t) => t + 1)
    return () => obs.disconnect()
  }, [])
}

function TokenControl({ token, draft, setDraft }) {
  const dark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
  const changed = token.name in activeValues(draft, dark)
  const value = currentValue(token.name)
  const set = (v) => setDraft((d) => withToken(d, token, v))
  let control = null
  if (token.type === 'color') {
    const hex = /^\d/.test(value) ? hslToHex(value) : '#000000'
    control = (
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => set(hexToHsl(e.target.value))}
          aria-label={`${token.label} color`}
          className="h-9 w-12 cursor-pointer rounded-md border bg-background p-0.5"
        />
        <Code>{value}</Code>
      </span>
    )
  } else if (token.type === 'font') {
    const name =
      Object.keys(FONTS).find(
        (f) =>
          FONTS[f] === value ||
          value.startsWith(`'${f}'`) ||
          value.startsWith(f)
      ) || 'Inter'
    control = (
      <NativeSelect
        label={token.label}
        value={name}
        onChange={(f) => set(FONTS[f])}
        options={Object.keys(FONTS).map((f) => ({ value: f, label: f }))}
      />
    )
  } else {
    control = (
      <Input
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-label={`${token.label} (CSS value)`}
        className="h-9 w-28 font-mono text-xs"
      />
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          {token.label}
          {changed && <Badge variant="warning">changed</Badge>}
        </div>
        {token.hint && (
          <p className="text-xs text-muted-foreground">{token.hint}</p>
        )}
      </div>
      <span className="flex items-center gap-1">
        {control}
        {changed && (
          <button
            type="button"
            onClick={() => set(null)}
            aria-label={`Reset ${token.label}`}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
          </button>
        )}
      </span>
    </div>
  )
}

function Preview() {
  return (
    <div className="space-y-4">
      <PageHeader
        className="mb-0"
        eyebrow="Preview"
        title="How to play"
        description="2–8 players · 5 dice each · about 30 minutes"
      />
      <div className="flex flex-wrap gap-2">
        <Button>Roll for 10-3 High</Button>
        <Button variant="outline">Refuse</Button>
        <Chip active>✌️ 10-2</Chip>
        <Chip>👑 Boss</Chip>
        <Badge>Your roll plays it</Badge>
      </div>
      <Panel
        title="A question from the table"
        description="10-2 High, tied at a kicker of 12 on your last roll."
      >
        <div className="space-y-3">
          <Hand dice={[5, 5, 6, 3, 3]} game="10-2" variant="high" />
          <ProbabilityBar label="Take the tie" p={0.5} tone="coin" />
          <ProbabilityBar label="Roll" p={0.317} tone="lose" />
          <p className="text-sm text-muted-foreground">
            Exact over every roll. <a href="#preview">A link in running text</a>
            .
          </p>
        </div>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat value="49.1%" label="Made on one roll" sub="exact" />
        <Panel tone="note" title="Note panel">
          <p className="text-sm">An aside, a tip or a rule of thumb.</p>
        </Panel>
      </div>
      <TableFelt>
        <Seat
          name="You"
          you
          turn
          badges={['🔨 Hammer']}
          pencils={1}
          said={{ text: 'Calls 10-3 High', at: 1 }}
        >
          <Hand dice={[1, 3, 6, 5, 5]} game="10-3" variant="high" />
        </Seat>
      </TableFelt>
    </div>
  )
}

export default function ThemePlayground() {
  const [draft, setDraft] = useThemeDraft()
  const [copied, setCopied] = useState(false)
  const [ratio, setRatio] = useState('')
  useLiveValues()
  const css = draftCss(draft)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable: the CSS is on screen to copy by hand
    }
  }
  return (
    <div className="space-y-10">
      <p className="text-lg text-muted-foreground">
        Try a change without rebuilding the site. Edits show at once on every
        design system page, and stay in this browser until you reset them.
        Colors change for the theme you’re in now (switch it in Settings to edit
        the other); fonts, sizes and radius change for both.
      </p>

      <DocSection title="Start from a preset">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Chip
              key={p.id}
              onClick={() =>
                setDraft({ ...EMPTY, ...p.draft, siteWide: draft.siteWide })
              }
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </DocSection>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          {GROUP_ORDER.map((group) => (
            <Panel key={group} title={group} className="p-4 sm:p-4">
              <div className="divide-y">
                {DRAFT_TOKENS.filter((t) => t.group === group).map((t) => (
                  <TokenControl
                    key={t.name}
                    token={t}
                    draft={draft}
                    setDraft={setDraft}
                  />
                ))}
              </div>
              {group === 'Type' && (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
                  <div className="space-y-1">
                    <Label htmlFor="ratio">
                      Set all heading sizes from a ratio
                    </Label>
                    <Input
                      id="ratio"
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value)}
                      placeholder="1.25"
                      className="h-9 w-24"
                      inputMode="decimal"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const r = parseFloat(ratio)
                      if (r > 1 && r < 2)
                        setDraft((d) => ({
                          ...d,
                          shared: { ...d.shared, ...typeScale(r) },
                        }))
                    }}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </Panel>
          ))}
        </div>
        <div id="preview" className="min-w-0 space-y-6">
          <div className="rounded-xl border border-dashed p-4 sm:p-6">
            <Preview />
          </div>
          <Panel title="Contrast">
            <ContrastTable />
          </Panel>
        </div>
      </div>

      <DocSection title="Keep it, or throw it away">
        <div className="flex flex-wrap items-center gap-3">
          <Switch
            id="site-wide"
            checked={!!draft.siteWide}
            onCheckedChange={(on) => setDraft((d) => ({ ...d, siteWide: on }))}
          />
          <Label htmlFor="site-wide">
            Show this draft on the whole site (this browser only)
          </Label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={copy} disabled={isEmptyDraft(draft)}>
            {copied ? (
              <Check aria-hidden className="mr-1 h-4 w-4" />
            ) : (
              <Copy aria-hidden className="mr-1 h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy CSS'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setDraft(EMPTY)}
            disabled={isEmptyDraft(draft) && !draft.siteWide}
          >
            Reset to the site’s theme
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-xl border bg-muted/50 p-4 text-xs">
          <code>{css}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          To make it real, put these values in{' '}
          <Code>src/styles/global.css</Code> on a branch, check every page in
          both themes, and open a pull request (Proposing a pattern explains the
          rest).
        </p>
      </DocSection>
    </div>
  )
}
