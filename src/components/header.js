import React from 'react'
import { Link } from 'gatsby'

const Header = ({ siteTitle }) => (
  <header className="navbar navbar-expand navbar-dark flex-column flex-md-row bd-navbar">
    <Link to="/" className="navbar-brand mr-0 mr-md-2">
      {siteTitle}
    </Link>
    <Link to="/rules">
      Rules
    </Link>
  </header>
)

export default Header
