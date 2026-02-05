import React from 'react'
import { Link } from 'gatsby'
import DarkModeToggle from './ui/DarkModeToggle'

const Header = ({ siteTitle }) => (
  <header className="bg-primary text-on-primary shadow-sm dark:bg-primary">
    <div className="container-custom py-3 flex items-center justify-between">
         <Link to="/" className="text-xl font-semibold text-on-primary nav-link transition-colors">{siteTitle}</Link>
      <div className="flex items-center">
        <nav>
          <ul className="flex space-x-6 text-sm font-medium tracking-wide">
            <li>
                 <Link to="/rules" className="text-on-primary nav-link hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40 rounded">Rules</Link>
            </li>
            <li>
                <Link to="/games" className="text-on-primary nav-link hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40 rounded">Games</Link>
            </li>
            <li>
                <Link to="/odds" className="text-on-primary nav-link hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40 rounded">Odds</Link>
            </li>
            <li>
                <Link to="/glossary" className="text-on-primary nav-link hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/40 rounded">Glossary</Link>
            </li>
          </ul>
        </nav>
        <DarkModeToggle />
      </div>
    </div>
  </header>
)

export default Header
