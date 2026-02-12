/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/browser-apis/
 */

// Redirect /odds to /games
exports.onClientEntry = () => {
  if (typeof window !== 'undefined' && window.location.pathname === '/odds') {
    window.location.replace('/games')
  }
}
