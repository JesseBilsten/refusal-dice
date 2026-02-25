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
          A fast-paced social dice game for 2-8 players. Roll five dice, call a game,
          and let others accept or refuse. Each round has one loser who takes a pencil.
          Get 3 pencils and you're out. Last player standing wins.
        </p>
      </div>
    </section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New to the game?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how to play with the complete rules, examples, and variations.
            </p>
            <Link to="/rules">
              <Button>Read the Rules</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What should I call?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your dice and get the best strategic call for your hand.
            </p>
            <Link to="/strategy-assistant">
              <Button>Strategy Assistant</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Browse all games</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              See the complete list of games with probabilities and examples.
            </p>
            <Link to="/games">
              <Button>View Games</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>
  </Layout>
)

export default IndexPage
