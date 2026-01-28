import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'

const GlossaryPage = () => (
  <Layout>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Alert variant="warning" className="mb-6">
        <AlertTitle>In progress</AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            I'll be working on linking all the terms used around the site to the
            glossary page, but for now it's stubbed out.
          </p>
          <hr className="my-4 border-border" />
          <p className="mb-0">Jesse Bilsten</p>
        </AlertDescription>
      </Alert>
      <div className="my-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Glossary <Badge variant="warning">incomplete</Badge>
        </h1>
        <p className="text-lg text-muted-foreground">
          A list of commonly used colloquialisms in the game
        </p>
      </div>
      <h2 id="bark" className="text-3xl font-semibold mb-2 mt-6 text-foreground">
        Bark <small className="text-muted-foreground">you ain't got <span role="img" aria-label="poop">💩</span></small>
      </h2>
      <p>
        If you don't have a good hand on your First Call, you can choose to
        "Bark" and give the hammer to the player to your left.
      </p>
      <h2 id="frankie" className="text-3xl font-semibold mb-2 mt-6 text-foreground">
        Frankie{' '}
        <small className="text-muted-foreground">
          if I didn't have bad luck, I'd have no luck at all
        </small>
      </h2>
      <p>
        Another name for <Link to="/games">10-3</Link> due to a member at SLO CC
        (Frank Richardson) who commonly struggles to roll it.
      </p>
      <h2 id="hammer" className="text-3xl font-semibold mb-2 mt-6 text-foreground">
        Hammer <small className="text-muted-foreground">the play caller <span role="img" aria-label="hammer">🔨</span></small>
      </h2>
      <p>
        The <em>hammer</em> is when a player has the call. You can pass the{' '}
        <em>hammer</em> if you bark on a call or get the <em>hammer</em> if
        someone goes out in front of you.
      </p>
      <h2 id="parity" className="text-3xl font-semibold mb-2 mt-6 text-foreground">
        Parity <small className="text-muted-foreground">2 <span role="img" aria-label="pencil">✏️</span>'s</small>
      </h2>
      <p>
        When every player has 2 pencils. Some groups will put their pencils back
        in the jar at this point, some will require the remaining players to put
        $5 in again.
      </p>
    </section>
  </Layout>
)

export default GlossaryPage
