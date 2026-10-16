import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import Page, { PageHeader, NextStep } from '../components/Page'
import Tutorial from '../components/Tutorial'

const LearnPage = () => (
  <Layout>
    <Page width="tool">
      <PageHeader
        title="Learn by playing"
        description={
          <>
            Play one guided round against Ava and Ben. It takes about two
            minutes. Prefer reading?{' '}
            <Link to="/rules" className="text-primary hover:underline">
              Here are the rules
            </Link>
            .
          </>
        }
      />
      <Tutorial />
      <NextStep to="/rules" title="The rules, in one page" text="Everything the round covered, plus barking, second calls and the specialty games." />
    </Page>
  </Layout>
)

export default LearnPage
