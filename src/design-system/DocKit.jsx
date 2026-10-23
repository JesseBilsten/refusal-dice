import React from 'react'
import { cn } from '../lib/utils'

/**
 * Building blocks for the design system's own pages (src/design-system/):
 * a live specimen, a status badge, and do/don't guidance. Only the design
 * system uses these.
 */

/** A live example on a canvas, with an optional caption */
export function Specimen({ title, className, children }) {
  return (
    <figure className="space-y-2">
      {title && (
        <figcaption className="text-sm font-medium text-muted-foreground">
          {title}
        </figcaption>
      )}
      <div
        className={cn(
          'rounded-xl border border-dashed bg-background p-4 sm:p-6',
          className
        )}
      >
        {children}
      </div>
    </figure>
  )
}

const STATUS_STYLE = {
  approved: 'border-odds-safe/50 bg-odds-safe/10',
  proposed: 'border-odds-coin/60 bg-odds-coin/15',
  deprecated: 'border-border bg-muted text-muted-foreground line-through',
}
const STATUS_TEXT = {
  approved: 'Approved',
  proposed: 'Proposed',
  deprecated: 'Deprecated',
}

/** A registry entry's status, in words (never color alone) */
export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        STATUS_STYLE[status],
        className
      )}
    >
      {STATUS_TEXT[status]}
    </span>
  )
}

/** A small dot for the sidebar, with the status for screen readers */
export function StatusDot({ status }) {
  if (status === 'approved') return null
  return (
    <span
      title={STATUS_TEXT[status]}
      className={cn(
        'ml-auto h-2 w-2 shrink-0 rounded-full',
        status === 'proposed' ? 'bg-odds-coin' : 'bg-muted-foreground/50'
      )}
    >
      <span className="sr-only">({STATUS_TEXT[status].toLowerCase()})</span>
    </span>
  )
}

/** Do and don't, side by side */
export function DoDont({ dos = [], donts = [] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border-t-4 border-odds-safe bg-card p-4 shadow-sm">
        <p className="eyebrow mb-2 text-odds-safe">Do</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {dos.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border-t-4 border-odds-lose bg-card p-4 shadow-sm">
        <p className="eyebrow mb-2 text-odds-lose">Don’t</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {donts.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** A section of a doc page */
export function DocSection({ title, children, id }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-section">{title}</h2>
      {children}
    </section>
  )
}

/** A plain table of facts (tokens, sizes): rows of cells */
export function SpecTable({ head, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Inline code */
export const Code = ({ children }) => (
  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
    {children}
  </code>
)

/** Text with `backticks` shown as code (registry summaries) */
export function Rich({ children }) {
  return String(children)
    .split(/(`[^`]+`)/)
    .map((part, i) =>
      part.startsWith('`') ? <Code key={i}>{part.slice(1, -1)}</Code> : part
    )
}
