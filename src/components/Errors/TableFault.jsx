import React from 'react'
import { PageHeader } from '../Page'
import DiceMishap from '../Dice/DiceMishap'

/**
 * Every error the site can show, told as something that went wrong at the
 * table. The eyebrow keeps the real error name, so nobody has to decode the
 * joke to know what happened; the message says what to do next.
 */
export const FAULTS = {
  'not-found': {
    code: 404,
    name: 'Page not found',
    scenes: ['stacked', 'cocked'],
    title: 'That one landed cocked',
    message: (path) =>
      `Sorry, we couldn’t find ${path || 'that page'}. At the table a cocked die doesn’t count, so you re-roll it. Let’s do the same.`,
  },
  'unknown-game': {
    code: 400,
    name: 'Bad request',
    scenes: ['unknown'],
    title: 'Nobody plays that game',
    message: (game) =>
      `You called “${game || 'that'}”, a game that doesn’t exist. The Hammer can only call a game from the list.`,
  },
  'off-table': {
    code: 500,
    name: 'Something broke',
    scenes: ['off-table'],
    title: 'Dice off the table',
    message: () =>
      'Something broke on our side and the dice went off the table. It isn’t you. Pick them up and roll again: reload the page.',
  },
}

/**
 * An error page's frame: the dice that went wrong, the error in words, and
 * the way out (`children`, usually a primary Button and an outline one).
 * It renders the page's PageHeader.
 */
export default function TableFault({ fault = 'not-found', detail, children }) {
  const f = FAULTS[fault] || FAULTS['not-found']
  return (
    <section>
      <div className="mb-6 flex items-end gap-4">
        {f.scenes.map((s) => (
          <DiceMishap key={s} kind={s} />
        ))}
      </div>
      <PageHeader
        className="mb-6"
        eyebrow={`${f.code} · ${f.name}`}
        title={f.title}
        description={f.message(detail)}
      />
      {children && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {children}
        </div>
      )}
    </section>
  )
}
