import React from 'react'
import { Link } from 'gatsby'

const Header = ({ siteTitle }) => (
  <nav
    className="navbar navbar-expand navbar-dark flex-column flex-md-row bg-dark"
    role="navigation"
  >
    <Link to="/" className="navbar-brand mr-0 mr-md-2">
      {siteTitle}
    </Link>
    <div className="navbar nav-scroll">
      <ul className="navbar-nav mr-auto">
        <li className="nav-item">
          <Link to="/rules" className="nav-link">
            Rules
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/games" className="nav-link">
            Games
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/odds" className="nav-link">
            Odds
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/glossary" className="nav-link">
            Glossary
          </Link>
        </li>
      </ul>
    </div>
  </nav>
)

export default Header
