module.exports = {
  siteMetadata: {
    title: 'Refusal Dice',
  },
  plugins: [
    'gatsby-plugin-postcss',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'Refusal Dice',
        short_name: 'Refusal Dice',
        start_url: '/',
        background_color: '#ffffff',
        theme_color: '#2563eb', // --color-primary
        display: 'minimal-ui',
        icon: 'src/images/game-die.png', // This path is relative to the root of the site.
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `src`,
        path: `${__dirname}/src/`,
      },
    },
  ],
}
