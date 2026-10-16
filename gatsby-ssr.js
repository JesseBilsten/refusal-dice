/**
 * Gatsby SSR APIs: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
const React = require('react')

// Set the theme before first paint so dark mode doesn't flash
// (the same rule as src/components/Settings/theme.js)
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`

exports.onRenderBody = ({ setPreBodyComponents }) => {
  setPreBodyComponents([
    React.createElement('script', { key: 'theme', dangerouslySetInnerHTML: { __html: THEME_SCRIPT } }),
  ])
}
