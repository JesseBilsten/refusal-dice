import React from 'react'
import { Link } from 'gatsby'
import { ExternalLink } from 'lucide-react'
import { PageHeader } from '../components/Page'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { DOCS, SECTIONS, docPath } from './registry'
import { Code, DocSection, Rich, StatusBadge } from './DocKit'
import { EXAMPLES } from './examples'
import { GUIDES } from './guides'
import ThemePlayground from './ThemePlayground'
import DesignLayout from './DesignLayout'

/**
 * One page of the design system, for registry entry `id`: a guide
 * (Overview, Foundations), or a component or pattern with its status,
 * source, live examples and where it's used.
 */

const PAGES = { ...GUIDES, theming: ThemePlayground }

function ComponentDoc({ doc }) {
  const Example = EXAMPLES[doc.id]
  const replacement =
    doc.status === 'deprecated' ? doc.summary.split('. ').slice(-1)[0] : null
  return (
    <div className="space-y-10">
      {doc.status === 'proposed' && (
        <Alert variant="warning">
          <AlertTitle>Proposed: waiting for approval</AlertTitle>
          <AlertDescription>
            {doc.replaces && (
              <>
                Replaces: <Rich>{doc.replaces}</Rich>.{' '}
              </>
            )}
            Until the site owner approves it, only the design system may use it;
            the tests block it anywhere else.
          </AlertDescription>
        </Alert>
      )}
      {doc.status === 'deprecated' && (
        <Alert variant="destructive">
          <AlertTitle>Deprecated</AlertTitle>
          <AlertDescription>
            {replacement} Nothing may import it.
          </AlertDescription>
        </Alert>
      )}
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="font-semibold">Source</dt>
        <dd>
          <Code>src/{doc.source}</Code>
        </dd>
        {doc.exports.length > 0 && (
          <>
            <dt className="font-semibold">Exports</dt>
            <dd className="flex flex-wrap gap-1">
              {doc.exports.map((e) => (
                <Code key={e}>{e}</Code>
              ))}
            </dd>
          </>
        )}
        {doc.liveAt && (
          <>
            <dt className="font-semibold">See it live</dt>
            <dd>
              <Link
                to={doc.liveAt}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {doc.liveAt}{' '}
                <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </dd>
          </>
        )}
      </dl>
      {Example && (
        <DocSection title="Examples">
          <Example />
        </DocSection>
      )}
    </div>
  )
}

export default function DocPage({ id }) {
  const doc = DOCS.find((d) => d.id === id)
  const section = SECTIONS.find((s) => s.id === doc.section)
  const Guide = PAGES[id]
  return (
    <DesignLayout current={id}>
      <PageHeader
        eyebrow={doc.group ? `${section.title} · ${doc.group}` : section.title}
        title={doc.title}
        description={<Rich>{doc.summary}</Rich>}
        badge={
          doc.section !== 'overview' && doc.section !== 'foundations' ? (
            <StatusBadge status={doc.status} />
          ) : null
        }
        breadcrumbs={
          id === 'introduction'
            ? undefined
            : [
                { to: docPath('introduction'), label: 'Design system' },
                { label: doc.title },
              ]
        }
      />
      {Guide ? <Guide /> : <ComponentDoc doc={doc} />}
    </DesignLayout>
  )
}
