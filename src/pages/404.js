import React, { useEffect, useState } from 'react'
import { Link, graphql, navigate, useStaticQuery } from 'gatsby'
import { Dices } from 'lucide-react'
import Layout from '../components/layout'
import Page from '../components/Page'
import TableFault from '../components/Errors/TableFault'
import { Button, buttonVariants } from '../components/ui/button'
import { NAV_GROUPS, SITE_NAV } from '../components/nav-items'
import { GAMES, getGameFullName } from '../lib/games-config'
import {
  closestPage,
  normalizePath,
  randomPage,
  requestedGame,
} from '../lib/page-match'

/** Names for the pages we might suggest; anything else shows its address */
const LABELS = Object.fromEntries([
  ['/', 'the home page'],
  ...[...NAV_GROUPS.flatMap((g) => g.items), ...SITE_NAV].map((i) => [
    normalizePath(i.to),
    i.label,
  ]),
  ...GAMES.map((g) => [normalizePath(`/games/${g.id}`), getGameFullName(g.id)]),
])

const NotFoundPage = ({ location }) => {
  const paths = useStaticQuery(graphql`
    query NotFoundPaths {
      allSitePage {
        nodes {
          path
        }
      }
    }
  `).allSitePage.nodes.map((n) => n.path)

  // The address is only known in the browser: the build renders this page once, for every miss
  const [here, setHere] = useState(null)
  useEffect(() => {
    // Opened as /404 itself: nothing was asked for, so name nothing
    const p = location.pathname
    setHere(/^\/404/.test(p) ? null : p)
  }, [location.pathname])

  const game = here && requestedGame(here)
  const unknownGame = game && !GAMES.some((g) => g.id === game)
  const suggestion = here && closestPage(here, paths)
  const reroll = () => navigate(randomPage(paths, here))

  return (
    <Layout>
      <Page width="reading">
        <TableFault
          fault={unknownGame ? 'unknown-game' : 'not-found'}
          detail={unknownGame ? game : here}
        >
          {suggestion && (
            <Link to={suggestion} className={buttonVariants({ size: 'lg' })}>
              Go to {LABELS[suggestion] || suggestion}
            </Link>
          )}
          <Button
            size="lg"
            variant={suggestion ? 'outline' : 'default'}
            onClick={reroll}
          >
            <Dices aria-hidden className="mr-2 h-4 w-4" />
            Re-roll: a random page
          </Button>
          {suggestion !== '/' && (
            <Link to="/" className={buttonVariants({ size: 'lg', variant: 'ghost' })}>
              Home
            </Link>
          )}
        </TableFault>
      </Page>
    </Layout>
  )
}

export default NotFoundPage
