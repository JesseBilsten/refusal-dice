import React from 'react'
import { Link } from 'gatsby'
import DarkModeToggle from './DarkModeToggle'
import MobileNav from './MobileNav'

const Header = ({ siteTitle }) => (
  <nav className="border-b border-border bg-background" role="navigation">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
      <Link to="/" className="text-xl font-bold hover:text-primary transition-colors">
        {siteTitle}
      </Link>
      <div className="flex items-center gap-4">
        <ul className="hidden md:flex flex-row gap-6">
          <li>
            <Link 
              to="/rules" 
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Rules
            </Link>
          </li>
          <li>
            <Link 
              to="/games" 
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Games
            </Link>
          </li>
          <li>
            <Link 
              to="/rolls" 
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Rolls
            </Link>
          </li>
          <li>
            <Link 
              to="/strategy-assistant" 
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Strategy
            </Link>
          </li>
          <li>
            <Link 
              to="/glossary" 
              className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              activeClassName="text-primary"
            >
              Glossary
            </Link>
          </li>
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
