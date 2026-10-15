import React from 'react'
import { ChevronRight } from 'lucide-react'

/**
 * The detail layers of the odds-decision pattern, closed by default
 * (progressive disclosure): the worked math, and answers to the questions
 * people ask when a number surprises them.
 */

export function Disclosure({ title, children }) {
  return (
    <details className="group rounded-md border border-border">
      <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 font-medium [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden
          className="h-4 w-4 transition-transform group-open:rotate-90"
        />
        {title}
      </summary>
      <div className="space-y-3 px-3 pb-3 text-sm">{children}</div>
    </details>
  )
}

/**
 * Worked math, one line per step: what it is, the arithmetic, the result.
 * steps: [{ label, expr, result, total?: true }]
 */
export function MathSteps({ title, steps }) {
  return (
    <div>
      {title && <p className="mb-1 font-medium">{title}</p>}
      <dl className="divide-y divide-border">
        {steps.map((s) => (
          <div
            key={s.label}
            className={
              s.total ? 'py-1.5 font-semibold' : 'py-1.5 text-foreground'
            }
          >
            <dt>{s.label}</dt>
            <dd className="font-mono text-xs tabular-nums text-muted-foreground">
              {s.expr && <>{s.expr} = </>}
              <span className="text-foreground">{s.result}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Anticipated questions, each answered in a sentence or two */
export function Questions({ items }) {
  return (
    <dl className="space-y-2">
      {items.map((q) => (
        <div key={q.q}>
          <dt className="font-medium">{q.q}</dt>
          <dd className="text-muted-foreground">{q.a}</dd>
        </div>
      ))}
    </dl>
  )
}
