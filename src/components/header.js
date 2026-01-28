import React from 'react'
import { Link } from 'gatsby'

const Header = ({ siteTitle }) => (
  <nav className="border-b border-gray-200 bg-white" role="navigation">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between py-4">
      <Link to="/" className="text-xl font-bold mb-4 md:mb-0 hover:text-blue-600 transition-colors">
        {siteTitle}
      </Link>
      <ul className="flex flex-col md:flex-row gap-4 md:gap-6">
        <li>
          <Link 
            to="/rules" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            activeClassName="text-blue-600"
          >
            Rules
          </Link>
        </li>
        <li>
          <Link 
            to="/games" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            activeClassName="text-blue-600"
          >
            Games
          </Link>
        </li>
        <li>
          <Link 
            to="/odds" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            activeClassName="text-blue-600"
          >
            Odds
          </Link>
        </li>
        <li>
          <Link 
            to="/glossary" 
            className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            activeClassName="text-blue-600"
          >
            Glossary
          </Link>
        </li>
      </ul>
    </div>
  </nav>
)

export default Header
