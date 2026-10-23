import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { StaticQuery, graphql } from 'gatsby'
import Header from './header'
import Footer from './Footer/'
import { useThemeDraft } from '../design-system/theme-draft'

import '../styles/global.css'

/** A theme draft from the design system's playground, when it's switched on for the whole site */
function SiteWideDraft() {
  useThemeDraft({ apply: false })
  return null
}

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
          <a id="skippy" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50" href="#content">
            Skip to main content
          </a>
          <SiteWideDraft />
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
