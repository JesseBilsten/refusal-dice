/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const webpack = require('webpack')

exports.onCreateWebpackConfig = ({
  stage,
  rules,
  loaders,
  plugins,
  actions,
}) => {
  if (stage === 'build-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: require.resolve('bootstrap'),
            use: loaders.null(),
          },
          {
            test: require.resolve('jquery'),
            use: loaders.null(),
          },
        ],
      },
    })
  }
  actions.setWebpackConfig({
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        Popper: 'popper.js',
        Bootstrap: 'bootstrap.js',
      }),
    ],
  })
}
