import React, { useMemo, useState } from 'react'
import { Link, navigate } from 'gatsby'
import Helmet from 'react-helmet'
import { Palette, X } from 'lucide-react'
import Layout from '../components/layout'
import { Container } from '../components/Page'
import { Input } from '../components/ui/input'
import { NativeSelect } from '../components/ui/native-select'
import { cn } from '../lib/utils'
import { DOCS, GROUPS, SECTIONS, docPath } from './registry'
import { StatusDot } from './DocKit'
import { isEmptyDraft, useThemeDraft } from './theme-draft'

/**
 * The design system's frame, modelled on Ant Design and Material: a sidebar
 * of every section (Overview, Foundations, Components by group, Patterns)
 * with a filter, and the page beside it. On phones the sidebar becomes a
 * "Jump to" menu. Any theme draft (theme-draft.js) is applied here, with a
 * bar saying so.
 */

const navTree = () =>
  SECTIONS.map((section) => {
    const docs = DOCS.filter((d) => d.section === section.id)
    const groups = GROUPS[section.id]
    return {
      ...section,
      groups: groups
        ? groups
            .map((g) => ({ title: g, docs: docs.filter((d) => d.group === g) }))
            .filter((g) => g.docs.length)
        : [{ title: null, docs }],
    }
  })

function Sidebar({ current }) {
  const [filter, setFilter] = useState('')
  const tree = useMemo(navTree, [])
  const q = filter.trim().toLowerCase()
  const match = (d) =>
    !q ||
    d.title.toLowerCase().includes(q) ||
    (d.summary || '').toLowerCase().includes(q)
  return (
    <nav aria-label="Design system" className="space-y-5 text-sm">
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter…"
        aria-label="Filter the design system"
        className="h-9"
      />
      {tree.map((section) => {
        const groups = section.groups
          .map((g) => ({ ...g, docs: g.docs.filter(match) }))
          .filter((g) => g.docs.length)
        if (!groups.length) return null
        return (
          <div key={section.id}>
            <h2 className="eyebrow mb-2 text-muted-foreground">
              {section.title}
            </h2>
            {groups.map((g) => (
              <div
                key={g.title ?? section.id}
                className={g.title ? 'mb-3' : undefined}
              >
                {g.title && (
                  <p className="mb-1 pl-2 text-xs font-semibold text-foreground/70">
                    {g.title}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {g.docs.map((d) => (
                    <li key={d.id}>
                      <Link
                        to={docPath(d.id)}
                        aria-current={current === d.id ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent',
                          current === d.id
                            ? 'bg-primary/10 font-semibold text-primary'
                            : 'text-foreground/80',
                          d.status === 'deprecated' && 'line-through opacity-70'
                        )}
                      >
                        {d.title}
                        <StatusDot status={d.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

function JumpTo({ current }) {
  const options = DOCS.map((d) => ({
    value: d.id,
    label: `${SECTIONS.find((s) => s.id === d.section).title} · ${d.title}`,
  }))
  return (
    <NativeSelect
      label="Jump to a page of the design system"
      value={current}
      options={options}
      onChange={(id) => navigate(docPath(id))}
      className="h-11 w-full"
    />
  )
}

function DraftBar() {
  const [draft, setDraft] = useThemeDraft()
  if (isEmptyDraft(draft)) return null
  return (
    <div
      className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-odds-coin/60 bg-odds-coin/10 p-3 text-sm"
      role="status"
    >
      <Palette aria-hidden className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        A theme draft is showing
        {draft.siteWide
          ? ' on the whole site, in this browser'
          : ' on these pages'}
        .{' '}
        <Link
          to="/design/theming/"
          className="font-medium text-primary hover:underline"
        >
          Edit it
        </Link>
      </span>
      <button
        type="button"
        onClick={() =>
          setDraft({ light: {}, dark: {}, shared: {}, siteWide: false })
        }
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X aria-hidden className="h-4 w-4" /> Reset to the site’s theme
      </button>
    </div>
  )
}

export default function DesignLayout({ current, children }) {
  const doc = DOCS.find((d) => d.id === current)
  return (
    <Layout>
      <Helmet>
        <title>
          {doc ? `${doc.title} · Design system` : 'Design system'} · Refusal
          Dice
        </title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Container width="wide" className="py-8 sm:py-10">
        <div className="mb-6 lg:hidden">
          <JumpTo current={current} />
        </div>
        <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 pr-2">
              <Sidebar current={current} />
            </div>
          </aside>
          <div className="min-w-0 max-w-4xl">
            <DraftBar />
            {children}
          </div>
        </div>
      </Container>
    </Layout>
  )
}
