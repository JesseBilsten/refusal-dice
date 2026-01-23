import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import PageShell from '../components/PageShell'

const GlossaryPage = () => (
  <Layout>
    <Alert className="mb-6">
      <h4 className="font-semibold">In progress</h4>
      <p>
        I'll be working on linking all the terms used around the site to the
        glossary page, but for now it's stubbed out.
      </p>
      <hr className="site-hr" />
      <p className="mb-0">Jesse Bilsten</p>
    </Alert>

    <PageShell title={"Glossary"} lead={"A list of commonly used colloquialisms in the game"} badge={<Badge>incomplete</Badge>}>
      <article className="content-prose">
        <h2 id="bark" className="mt-6">
          Bark <small className="text-muted-foreground">you ain't got <span role="img" aria-label="poop">💩</span></small>
        </h2>
        <p>
          If you don't have a good hand on your First Call, you can choose to
          "Bark" and give the hammer to the player to your left.
        </p>
      </article>

      <article className="content-prose">
        <h2 id="frankie" className="mt-6">
          Frankie{' '}
          <small className="text-muted-foreground">
            if I didn't have bad luck, I'd have no luck at all
          </small>
        </h2>
        <p>
          Another name for <Link to="/games">10-3</Link> due to a member at SLO CC
          (Frank Richardson) who commonly struggles to roll it.
        </p>
      </article>

      <article className="content-prose">
        <h2 id="hammer" className="mt-6">
          Hammer <small className="text-muted-foreground">the play caller <span role="img" aria-label="hammer">🔨</span></small>
        </h2>
        <p>
          The <em>hammer</em> is when a player has the call. You can pass the{' '}
          <em>hammer</em> if you bark on a call or get the <em>hammer</em> if
          someone goes out in front of you.
        </p>
      </article>

      <article className="content-prose">
        <h2 id="parity" className="mt-6">
          Parity <small className="text-muted-foreground">2 <span role="img" aria-label="pencil">✏️</span>'s</small>
        </h2>
        <p>
          When every player has 2 pencils. Some groups will put their pencils back
          in the jar at this point, some will require the remaining players to put
          $5 in again.
        </p>
      </article>
    </PageShell>
  </Layout>
)

export default GlossaryPage
