import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Tutorial from '../components/Tutorial'

const LearnPage = () => (
  <Layout>
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Learn by playing
        </h1>
        <p className="mt-2 text-muted-foreground">
          Play one guided round against Ava and Ben. It takes about two minutes.
          Prefer reading?{' '}
          <Link to="/rules" className="text-primary hover:underline">
            Here are the rules
          </Link>
          .
        </p>
      </div>
      <Tutorial />
    </section>
  </Layout>
)

export default LearnPage
