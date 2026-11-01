import React from 'react'
import { Badge } from '../ui/badge'
import TextLink from '../Page/TextLink'
import { inlineTokens } from '../../lib/changelog'
import { cn } from '../../lib/utils'

/** One line of changelog Markdown: bold, emphasis, code and links */
export function InlineMarkdown({ text }) {
  return inlineTokens(text).map((t, i) => {
    if (t.type === 'strong') return <strong key={i}>{t.text}</strong>
    if (t.type === 'em') return <em key={i}>{t.text}</em>
    if (t.type === 'code')
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          {t.text}
        </code>
      )
    if (t.type === 'link')
      return t.to.startsWith('/') ? (
        <TextLink key={i} to={t.to}>
          {t.text}
        </TextLink>
      ) : (
        <a key={i} href={t.to} className="text-primary hover:underline">
          {t.text}
        </a>
      )
    return <React.Fragment key={i}>{t.text}</React.Fragment>
  })
}

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

/**
 * The site's releases, newest first, from CHANGELOG.md (lib/changelog.js):
 * each version with its date, then what changed. The newest is marked
 * Latest. A release merged but not dated yet (dates are set at the next
 * handoff) says "Not dated yet" rather than guess one.
 *
 * releases: [{ version, date, intro, items }]
 */
export default function ReleaseNotes({ releases, className }) {
  return (
    <ol className={cn('space-y-10', className)}>
      {releases.map((r, i) => (
        <li key={r.version}>
          <article aria-labelledby={`v${r.version}`}>
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2">
              <h2 id={`v${r.version}`} className="text-heading">
                Version {r.version}
              </h2>
              {r.date ? (
                <time dateTime={r.date} className="text-sm text-muted-foreground">
                  {formatDate(r.date)}
                </time>
              ) : (
                <span className="text-sm text-muted-foreground">Not dated yet</span>
              )}
              {i === 0 && <Badge variant="secondary">Latest</Badge>}
            </header>
            {r.intro.map((p) => (
              <p key={p} className="mt-3">
                <InlineMarkdown text={p} />
              </p>
            ))}
            {r.items.length > 0 && (
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-muted-foreground">
                {r.items.map((item) => (
                  <li key={item}>
                    <InlineMarkdown text={item} />
                  </li>
                ))}
              </ul>
            )}
          </article>
        </li>
      ))}
    </ol>
  )
}
