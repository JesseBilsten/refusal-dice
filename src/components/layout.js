import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import Header from './header'
import Footer from './Footer/'

import 'bootstrap/dist/css/bootstrap.min.css'
import './layout.scss'

const Layout = ({ children }) => (
  <StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={data => (
      <>
        <Helmet
          title={data.site.siteMetadata.title}
          meta={[
            {
              name: 'description',
              content:
                'Refusal Dice is a betting game of chance and maybe skill.',
            },
            {
              name: 'keywords',
              content: 'dice, game, betting, san luis obispo, country club',
            },
          ]}
        >
          <html lang="en" />
        </Helmet>
        <div className="site">
          <a id="skippy" className="visually-hidden visually-hidden-focusable" href="#content">
            Skip to main content
          </a>
          <Header siteTitle={data.site.siteMetadata.title} />
          <main id="content" role="main">{children}</main>
          <Footer />
        </div>
      </>
    )}
  />
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
