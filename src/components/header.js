import React from 'react'
import { Link } from 'gatsby'
import DarkModeToggle from './DarkModeToggle'
import MobileNav from './MobileNav'
import { DieFace } from './Dice'
import { PRIMARY_NAV } from './nav-items'

const Header = ({ siteTitle }) => (
  <nav className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75" role="navigation">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
      <Link to="/" className="group flex items-center gap-2 font-display text-xl font-extrabold tracking-tight hover:text-primary transition-colors">
        <span aria-hidden className="inline-flex -rotate-12 transition-transform group-hover:rotate-12">
          <DieFace value={5} size={26} />
        </span>
        {siteTitle}
      </Link>
      <div className="flex items-center gap-4">
        <ul className="hidden md:flex flex-row gap-6">
          {PRIMARY_NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                activeClassName="text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
          <DarkModeToggle />
        </div>
        <MobileNav />
      </div>
    </div>
  </nav>
)

export default Header
