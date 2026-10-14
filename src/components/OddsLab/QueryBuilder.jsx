import React, { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Die from '../Die'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'
import { describePattern, diceClaimed } from '../../lib/roll-query'

const FACES = [1, 2, 3, 4, 5, 6]

let nextId = 1
export const uid = () => nextId++

/** Attach React keys to a plain query (from a preset or the URL). */
export const withIds = (query) => ({
  ...query,
  patterns: (query.patterns || []).map((p) => ({
    ...p,
    id: uid(),
    rules: (p.rules || []).map((r) => ({ ...r, id: uid() })),
  })),
})

export const newPattern = () => ({ id: uid(), rules: [] })

export const newRule = (type, diceCount) => {
  const base = { id: uid(), type }
  switch (type) {
    case 'faces':
      return { ...base, values: [] }
    case 'straight':
      return { ...base, length: Math.min(3, diceCount), start: null }
    case 'kind':
      return { ...base, size: 2, op: 'any', value: 6, values: [1, 6] }
    case 'sum':
      return { ...base, dice: diceCount >= 2 ? 2 : 'all', op: 'eq', value: 7, values: [7, 11] }
    case 'each':
      return { ...base, dice: 'rest', op: 'gte', value: 4, values: [4, 5, 6] }
    case 'count':
      return { ...base, quant: 'atLeast', n: 1, op: 'eq', value: 6, values: [1, 6] }
    default:
      return base
  }
}

const ADDABLE = [
  { type: 'faces', label: 'Specific dice', hint: 'e.g. 6, 5, 4' },
  { type: 'straight', label: 'Run', hint: 'e.g. 3 in a row', minDice: 2 },
  { type: 'kind', label: 'Of a kind', hint: 'e.g. a pair', minDice: 2 },
  { type: 'sum', label: 'Sum', hint: 'e.g. 2 dice = 10' },
  { type: 'each', label: 'Each die', hint: 'e.g. all ≥ 4' },
  { type: 'count', label: 'Count', hint: 'e.g. no 1s' },
]

const OP_OPTIONS = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'in', label: 'one of' },
]

const range = (from, to) =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)

const selectClass =
  'h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring'

const NativeSelect = ({ label, value, options, onChange, className }) => (
  <select
    aria-label={label}
    value={String(value)}
    onChange={(e) => onChange(e.target.value)}
    className={cn(selectClass, className)}
  >
    {options.map((o) => (
      <option key={String(o.value)} value={String(o.value)}>
        {o.label}
      </option>
    ))}
  </select>
)

const Word = ({ children }) => (
  <span className="text-sm text-muted-foreground">{children}</span>
)

/** Toggle a set of die faces (used for "one of" conditions). */
const FaceSet = ({ values, onChange, label }) => (
  <div className="flex items-center gap-0.5" role="group" aria-label={label}>
    {FACES.map((f) => {
      const on = values.includes(f)
      return (
        <button
          key={f}
          type="button"
          aria-pressed={on}
          aria-label={`${f}`}
          onClick={() =>
            onChange(on ? values.filter((v) => v !== f) : [...values, f].sort())
          }
          className={cn(
            'rounded p-0.5 text-base transition-opacity focus:outline-none focus:ring-2 focus:ring-ring',
            on ? 'ring-2 ring-primary' : 'opacity-40 hover:opacity-80'
          )}
        >
          <Die inline number={f} />
        </button>
      )
    })}
  </div>
)

/** Comma-separated number list, e.g. "7, 11". Keeps the raw text while typing. */
const NumberList = ({ values, onChange, label }) => {
  const [text, setText] = useState(values.join(', '))
  useEffect(() => {
    const parsed = text.split(/[,\s]+/).filter(Boolean).map(Number)
    if (parsed.join() !== values.join()) setText(values.join(', '))
    // Only resync when the values change from outside (preset, URL, op switch)
  }, [values]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      aria-label={label}
      value={text}
      placeholder="7, 11"
      onChange={(e) => {
        setText(e.target.value)
        onChange(
          e.target.value
            .split(/[,\s]+/)
            .filter(Boolean)
            .map(Number)
            .filter(Number.isFinite)
        )
      }}
      className={cn(selectClass, 'w-24')}
    />
  )
}

/**
 * Operator + value. `faces` mode limits values to die faces 1–6;
 * otherwise any number (for sums).
 */
const Condition = ({ rule, onChange, faces, allowAny, label }) => {
  const ops = allowAny ? [{ value: 'any', label: 'any value' }, ...OP_OPTIONS] : OP_OPTIONS
  return (
    <>
      <NativeSelect
        label={`${label} comparison`}
        value={rule.op}
        options={ops}
        onChange={(op) => onChange({ op })}
      />
      {rule.op === 'in' &&
        (faces ? (
          <FaceSet
            label={`${label} values`}
            values={rule.values || []}
            onChange={(values) => onChange({ values })}
          />
        ) : (
          <NumberList
            label={`${label} values`}
            values={rule.values || []}
            onChange={(values) => onChange({ values })}
          />
        ))}
      {rule.op !== 'in' &&
        rule.op !== 'any' &&
        (faces ? (
          <NativeSelect
            label={`${label} value`}
            value={rule.value}
            options={FACES.map((f) => ({ value: f, label: f }))}
            onChange={(v) => onChange({ value: Number(v) })}
          />
        ) : (
          <input
            type="number"
            aria-label={`${label} value`}
            value={rule.value}
            min={0}
            max={30}
            onChange={(e) => onChange({ value: Number(e.target.value) || 0 })}
            className={cn(selectClass, 'w-16')}
          />
        ))}
    </>
  )
}

const scopeOptions = (diceCount, current) => {
  const max = Math.max(diceCount, typeof current === 'number' ? current : 0)
  return [
    ...range(1, max).map((n) => ({ value: n, label: n === 1 ? '1 die' : `${n} dice` })),
    { value: 'rest', label: 'remaining dice' },
    { value: 'all', label: 'all dice' },
  ]
}

const parseScope = (v) => (v === 'rest' || v === 'all' ? v : Number(v))

const RuleFields = ({ rule, diceCount, onChange }) => {
  switch (rule.type) {
    case 'faces':
      return (
        <>
          <Word>Dice showing</Word>
          <div className="flex flex-wrap items-center gap-0.5">
            {rule.values.map((v, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Remove ${v}`}
                title="Remove"
                onClick={() => onChange({ values: rule.values.filter((_, j) => j !== i) })}
                className="rounded p-0.5 text-lg ring-2 ring-primary hover:opacity-60 focus:outline-none focus:ring-ring"
              >
                <Die inline number={v} />
              </button>
            ))}
            {rule.values.length === 0 && (
              <span className="text-xs italic text-muted-foreground">tap faces to add →</span>
            )}
          </div>
          {rule.values.length < diceCount && (
            <div className="flex items-center gap-0.5 border-l border-border pl-2" role="group" aria-label="Add a die face">
              {FACES.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-label={`Add a ${f}`}
                  onClick={() => onChange({ values: [...rule.values, f] })}
                  className="rounded p-0.5 text-base opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Die inline number={f} />
                </button>
              ))}
            </div>
          )}
        </>
      )
    case 'straight':
      return (
        <>
          <NativeSelect
            label="Run length"
            value={rule.length}
            options={range(2, Math.max(diceCount, rule.length)).map((n) => ({ value: n, label: n }))}
            onChange={(v) => onChange({ length: Number(v) })}
          />
          <Word>in a row, starting at</Word>
          <NativeSelect
            label="Run starts at"
            value={rule.start == null ? 'any' : rule.start}
            options={[
              { value: 'any', label: 'any value' },
              ...range(1, 7 - rule.length).map((f) => ({ value: f, label: f })),
            ]}
            onChange={(v) => onChange({ start: v === 'any' ? null : Number(v) })}
          />
        </>
      )
    case 'kind':
      return (
        <>
          <NativeSelect
            label="How many of a kind"
            value={rule.size}
            options={range(2, Math.max(diceCount, rule.size)).map((n) => ({
              value: n,
              label: n === 2 ? 'a pair' : `${n} of a kind`,
            }))}
            onChange={(v) => onChange({ size: Number(v) })}
          />
          <Word>of</Word>
          <Condition rule={rule} faces allowAny label="Of a kind" onChange={onChange} />
        </>
      )
    case 'sum':
      return (
        <>
          <NativeSelect
            label="Which dice to add"
            value={rule.dice}
            options={scopeOptions(diceCount, rule.dice)}
            onChange={(v) => onChange({ dice: parseScope(v) })}
          />
          <Word>add up to</Word>
          <Condition rule={rule} label="Sum" onChange={onChange} />
        </>
      )
    case 'each':
      return (
        <>
          <NativeSelect
            label="Which dice"
            value={rule.dice}
            options={scopeOptions(diceCount, rule.dice)}
            onChange={(v) => onChange({ dice: parseScope(v) })}
          />
          <Word>each show</Word>
          <Condition rule={rule} faces label="Each die" onChange={onChange} />
        </>
      )
    case 'count':
      return (
        <>
          <NativeSelect
            label="Count quantifier"
            value={rule.quant}
            options={[
              { value: 'atLeast', label: 'at least' },
              { value: 'exactly', label: 'exactly' },
              { value: 'atMost', label: 'at most' },
            ]}
            onChange={(quant) => onChange({ quant })}
          />
          <NativeSelect
            label="Number of dice"
            value={rule.n}
            options={range(0, Math.max(diceCount, rule.n)).map((n) => ({ value: n, label: n }))}
            onChange={(v) => onChange({ n: Number(v) })}
          />
          <Word>{rule.n === 1 ? 'die shows' : 'dice show'}</Word>
          <Condition rule={rule} faces label="Count" onChange={onChange} />
        </>
      )
    default:
      return null
  }
}

const PatternCard = ({ pattern, index, diceCount, canRemove, onChange, onRemove }) => {
  const letter = String.fromCharCode(65 + index)
  const claimed = pattern.rules.reduce((acc, r) => acc + diceClaimed(r), 0)

  const updateRule = (ruleId, patch) =>
    onChange({
      ...pattern,
      rules: pattern.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
    })

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Pattern {letter}
            <span className="ml-2 font-normal text-muted-foreground">
              {claimed > 0 && `uses ${claimed} of ${diceCount} dice`}
            </span>
          </h3>
          {canRemove && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onRemove} aria-label={`Remove pattern ${letter}`}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {pattern.rules.length > 0 && (
          <ul className="space-y-2">
            {pattern.rules.map((rule, i) => (
              <li key={rule.id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 p-2">
                {i > 0 && <span className="text-xs font-semibold uppercase text-primary">and</span>}
                <RuleFields rule={rule} diceCount={diceCount} onChange={(patch) => updateRule(rule.id, patch)} />
                <button
                  type="button"
                  aria-label="Remove requirement"
                  onClick={() => onChange({ ...pattern, rules: pattern.rules.filter((r) => r.id !== rule.id) })}
                  className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {pattern.rules.length === 0 ? 'Add a requirement:' : 'Add another requirement (all must hold):'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ADDABLE.filter((a) => !a.minDice || diceCount >= a.minDice).map((a) => (
              <Button
                key={a.type}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                title={a.hint}
                onClick={() => onChange({ ...pattern, rules: [...pattern.rules, newRule(a.type, diceCount)] })}
              >
                <Plus className="mr-1 h-3 w-3" />
                {a.label}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-sm">
          <span className="text-muted-foreground">Matches </span>
          <span className="font-medium">{describePattern(pattern)}</span>
        </p>
      </CardContent>
    </Card>
  )
}

const QueryBuilder = ({ query, onChange }) => {
  const setPattern = (id, next) =>
    onChange({ ...query, patterns: query.patterns.map((p) => (p.id === id ? next : p)) })

  return (
    <div className="space-y-3">
      {query.patterns.map((pattern, i) => (
        <React.Fragment key={pattern.id}>
          {i > 0 && (
            <div className="flex items-center gap-3" aria-hidden="true">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}
          <PatternCard
            pattern={pattern}
            index={i}
            diceCount={query.diceCount}
            canRemove={query.patterns.length > 1}
            onChange={(next) => setPattern(pattern.id, next)}
            onRemove={() => onChange({ ...query, patterns: query.patterns.filter((p) => p.id !== pattern.id) })}
          />
        </React.Fragment>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full border border-dashed border-border"
        onClick={() => onChange({ ...query, patterns: [...query.patterns, newPattern()] })}
      >
        <Plus className="mr-1 h-4 w-4" /> Add another pattern (either one counts)
      </Button>
    </div>
  )
}

export default QueryBuilder
