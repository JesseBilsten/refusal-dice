import React, { useMemo } from 'react'
import { fmtPct } from '../Odds'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { situationTable, situationWhy } from './keep-model'

/**
 * A question's reasoning (situations-catalog.js): its paragraphs, then its
 * table of where the answer flips. Shared by SituationCard and KeepAdvisor.
 */
export default function SituationWhy({ situation, rules, className }) {
  const { why, table } = useMemo(
    () => {
      const pct = (p) => fmtPct(p, 1)
      return { why: situationWhy(situation, rules, pct), table: situationTable(situation, rules, pct) }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [situation, rules.montereyLoneKeep]
  )
  if (!why) return null
  return (
    <div className={className}>
      {why.map((para) => (
        <p key={para} className="mt-2 text-muted-foreground">
          {para}
        </p>
      ))}
      {table && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-muted-foreground">{table.caption}</p>
          <Table>
            <TableHeader>
              <TableRow>
                {table.head.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row) => (
                <TableRow key={row[0]}>
                  {row.map((cell, i) => (
                    <TableCell key={i} className={i === 0 ? 'font-medium tabular-nums' : 'tabular-nums'}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
