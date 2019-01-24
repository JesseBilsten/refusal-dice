import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'

export default () => (
  <Layout>
    <section className="container mt-5">
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-heading">In progress</h4>
        <p>
          I'll be working on linking all the terms used around the site to the
          glossary page, but for now it's stubbed out.
        </p>
        <hr />
        <p className="mb-0">Jesse Bilsten</p>
      </div>
      <div className="my-5 text-center">
        <h1>
          Glossary <span className="badge badge-warning">incomplete</span>
        </h1>
        <p className="lead">
          A list of commonly used colloquialisms in the game
        </p>
      </div>
      <h2 id="bark">
        Bark <small class="text-muted">you ain't got 💩</small>
      </h2>
      <p>
        If you don't have a good hand on your First Call, you can choose to
        "Bark" and give the hammer to the player to your left.
      </p>
      <h2 id="parity">
        Parity <small class="text-muted">2 ✏️'s'</small>
      </h2>
      <p>
        When every player has 2 pencils. Some groups will put their pencils back
        in the jar at this point, some will require the remaining players to put
        $5 in again.
      </p>
      <h2 id="frankie">
        Frankie{' '}
        <small class="text-muted">
          if I didn't have bad luck, I'd have no luck at all
        </small>
      </h2>
      <p>
        Another name for <Link to="/games">10-3</Link> due to a member at SLO CC
        (Frank Richardson) who commonly struggles to roll it.
      </p>
      <h2 id="hammer">
        Hammer <small class="text-muted">the play caller</small>
      </h2>
      <p>
        The <em>hammer</em> is when a player has the call. You can pass the{' '}
        <em>hammer</em> if you bark on a call or get the <em>hammer</em> if
        someone goes out in front of you.
      </p>
    </section>
  </Layout>
)
