import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Page, { PageHeader } from '../components/Page'
import Play from '../components/Play'

const PlayPage = () => (
  <Layout>
    <Page width="tool">
      <PageHeader
        title="Play"
        description={
          <>
            Play full games against solid bots: call, refuse, roll and keep. Hints show what a solid player would do.
            New to the game?{' '}
            <Link to="/learn" className="text-primary hover:underline">
              Learn by playing one guided round first
            </Link>
            .
          </>
        }
      />
      <Play />
    </Page>
  </Layout>
)

export default PlayPage
