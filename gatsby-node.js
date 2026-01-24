/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const webpack = require('webpack')

exports.onCreateWebpackConfig = ({ actions, stage, loaders }) => {
  const config = {
    plugins: [
      new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery',
        jquery: 'jquery',
      }),
    ],
  }
  if (stage === 'build-html') {
    const rules = []

    const tryResolve = (mod) => {
      try {
        return require.resolve(mod)
      } catch (e) {
        return null
      }
    }

    const pushIf = (mod) => {
      const resolved = tryResolve(mod)
      if (resolved) rules.push({ test: resolved, use: loaders.null() })
    }

    pushIf('bootstrap')
    pushIf('bootstrap-table')
    pushIf('bootstrap-table/dist/extensions/mobile/bootstrap-table-mobile')
    pushIf('bootstrap-table/dist/extensions/sticky-header/bootstrap-table-sticky-header')
    pushIf('bootstrap-table/dist/extensions/cookie/bootstrap-table-cookie')
    pushIf('jquery')

    if (rules.length) {
      config.module = { rules }
    }
  }
  actions.setWebpackConfig(config)
}
