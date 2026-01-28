import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const IndexPage = () => (
  <Layout>
    <section className="py-12 bg-gradient-to-b from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-5xl font-bold mb-4 text-foreground">Refusal Dice</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          The game plays much like poker in that it is played with groups of
          people typically 2-8 (anymore than 8 and partners are encouraged -
          more on that later) and five, six sided dice.
        </p>
      </div>
    </section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>How do I play?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Read through an example game and how calls are made and why.
            </p>
            <Link to="/rules">
              <Button>Rules</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What do I call?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              A list of the games you can call in Refusal Dice.
            </p>
            <Link to="/games">
              <Button>Games</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What'd they say?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you're confused about what's being said, read the glossary of
              common phrases and terms.
            </p>
            <Link to="/glossary">
              <Button>Glossary</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  </Layout>
)

export default IndexPage
