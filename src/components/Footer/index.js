import React from 'react'
import { Link } from 'gatsby'
import { NAV_GROUPS, SITE_NAV } from '../nav-items'

/** The foot of every page: the whole site map, in the navigation's groups, then the credit */
const Footer = () => (
  <footer className="mt-24 border-t border-border bg-muted/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav
        aria-label="Site map"
        className="grid grid-cols-2 gap-8 sm:grid-cols-4"
      >
        {[...NAV_GROUPS, { title: 'About', items: SITE_NAV }].map((group) => (
          <div key={group.title}>
            <h2 className="eyebrow mb-3 text-muted-foreground">
              {group.title}
            </h2>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-foreground/80 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
        <p className="text-sm text-muted-foreground">
          This site built and designed by{' '}
          <a
            href="http://bilsten.net"
            className="text-primary hover:underline font-medium"
          >
            Jesse Bilsten
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm text-primary hover:underline font-medium"
        >
          Back to top
        </button>
      </div>
    </div>
  </footer>
)

export default Footer
