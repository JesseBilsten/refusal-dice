import React from 'react'
import { Link } from 'gatsby'
import MobileNav from './MobileNav'
import { DieFace } from './Dice'
import { NAV_GROUPS } from './nav-items'
import { SettingsMenu, useTheme } from './Settings'

const Header = ({ siteTitle }) => {
  // Keeps the saved theme applied on every page (and following the device on System)
  useTheme()
  return (
    <nav
      className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75"
      role="navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <Link
          to="/"
          className="group flex items-center gap-2 font-display text-xl font-extrabold tracking-tight hover:text-primary transition-colors"
        >
          <span
            aria-hidden
            className="inline-flex -rotate-12 transition-transform group-hover:rotate-12"
          >
            <DieFace value={5} size={26} />
          </span>
          {siteTitle}
        </Link>
        <div className="flex items-center gap-4">
          {/* The groups sit apart, so the shape of the site shows in the bar */}
          <ul className="hidden md:flex flex-row items-center gap-6">
            {NAV_GROUPS.map((group, g) => (
              <li key={group.title} className={g > 0 ? 'border-l border-border pl-6' : undefined}>
                <ul aria-label={group.title} className="flex flex-row gap-6">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                        activeClassName="text-primary underline decoration-2 underline-offset-8"
                        partiallyActive={item.to !== '/'}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <SettingsMenu />
          </div>
          <MobileNav />
        </div>
      </div>
    </nav>
  )
}

export default Header
