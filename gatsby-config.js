module.exports = {
  siteMetadata: {
    title: 'Refusal Dice',
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'gatsby-starter-default',
        short_name: 'starter',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: 'src/images/game-die.png', // This path is relative to the root of the site.
      },
    },
    {
    resolve: `gatsby-plugin-sass`,
    options: {
      precision: 8,
    },
  },
    'gatsby-plugin-offline',
  ],
}
