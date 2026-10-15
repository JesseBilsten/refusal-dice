import React from 'react'
import { fmtPct } from './model'

/**
 * What happens next after a choice, and your chance in each case: one row
 * per branch, with a bar for how often it happens and your chance of the
 * outcome when it does. Shows where an option's total comes from when it
 * depends on other players' choices (a refusal, the Hammer's second call).
 *
 * rows: [{ id, label, share, p }]; `p` is your chance of the outcome in
 * that branch
 */
export default function Branches({ title, rows, outcome, note }) {
  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">{title}</figcaption>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="pb-1 text-left font-normal">What happens</th>
            <th className="pb-1 text-right font-normal">How often</th>
            <th className="pb-1 text-right font-normal">You {outcome}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="py-1.5 pr-2">
                {r.label}
                <div
                  aria-hidden
                  className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full bg-foreground/40"
                    style={{ width: `${r.share * 100}%` }}
                  />
                </div>
              </td>
              <td className="py-1.5 text-right align-top tabular-nums">
                {fmtPct(r.share)}
              </td>
              <td className="py-1.5 text-right align-top tabular-nums">
                {fmtPct(r.p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </figure>
  )
}
