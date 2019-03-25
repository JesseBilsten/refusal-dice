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
    config.module = {
      rules: [
        {
          test: require.resolve('bootstrap'),
          use: loaders.null(),
        },
        {
          test: require.resolve('bootstrap-table'),
          use: loaders.null(),
        },
        {
          test: require.resolve(
            'bootstrap-table/dist/extensions/mobile/bootstrap-table-mobile'
          ),
          use: loaders.null(),
        },
        {
          test: require.resolve(
            'bootstrap-table/dist/extensions/sticky-header/bootstrap-table-sticky-header'
          ),
          use: loaders.null(),
        },
        {
          test: require.resolve(
            'bootstrap-table/dist/extensions/cookie/bootstrap-table-cookie'
          ),
          use: loaders.null(),
        },
        {
          test: require.resolve('jquery'),
          use: loaders.null(),
        },
      ],
    }
  }
  actions.setWebpackConfig(config)
}
