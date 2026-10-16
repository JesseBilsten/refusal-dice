import React from 'react'
import Layout from '../components/layout'
import Page, { PageHeader } from '../components/Page'

const NotFoundPage = () => (
  <Layout>
    <Page width="reading">
      <PageHeader
        title="Page not found"
        description="You just hit a route that doesn't exist... the sadness."
      />
    </Page>
  </Layout>
)

export default NotFoundPage
