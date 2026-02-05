import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Container from '../components/ui/Container'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const IndexPage = () => (
  <Layout>
    <section className="section-gap">
      <div className="section-gap container-custom">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Refusal Dice</h1>
          <p className="lead mt-2 text-surface-foreground content-prose">
            The game plays much like poker in that it is played with groups of
            people typically 2-8 (anymore than 8 and partners are encouraged -
            more on that later) and five, six sided dice.
          </p>
        </header>
      </div>
    </section>
    <section className="py-12 section-gap">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h5 className="text-lg font-semibold">How do I play?</h5>
            <p className="mt-2 text-muted-foreground">Read through an example game and how calls are made and why.</p>
            <div className="mt-4">
              <Link to="/rules"><Button>Rules</Button></Link>
            </div>
          </Card>

          <Card>
            <h5 className="text-lg font-semibold">What do I call?</h5>
            <p className="text-muted-foreground mt-2">A list of the games you can call in Refusal Dice.</p>
            <div className="mt-4">
              <Link to="/games"><Button>Games</Button></Link>
            </div>
          </Card>

          <Card>
            <h5 className="text-lg font-semibold">What'd they say?</h5>
            <p className="text-muted-foreground mt-2">If you're confused about what's being said, read the glossary of common phrases and terms.</p>
            <div className="mt-4">
              <Link to="/glossary"><Button>Glossary</Button></Link>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  </Layout>
)

export default IndexPage
