import React from 'react'
import Layout from '../components/layout'
import Page, { PageHeader, TextLink } from '../components/Page'
import ReportForm from '../components/Report/ReportForm'

const ReportPage = () => (
  <Layout>
    <Page width="reading">
      <PageHeader
        title="Report a problem"
        description="Something broken, a rule or number that looks wrong, or an idea: tell us here and it goes to the site’s GitHub page."
      >
        <p className="text-sm text-muted-foreground">
          Recently fixed? Check <TextLink to="/changelog">what’s new</TextLink> first.
        </p>
      </PageHeader>
      <ReportForm />
    </Page>
  </Layout>
)

export default ReportPage
