import React from 'react'
import Layout from '../components/layout'
import Page, { PageHeader, TextLink } from '../components/Page'
import ReleaseNotes from '../components/Changelog/ReleaseNotes'

/** /changelog: every release of the site, from CHANGELOG.md (created in gatsby-node.js) */
const ChangelogPage = ({ pageContext }) => (
  <Layout>
    <Page width="reading">
      <PageHeader
        title="What’s new"
        description="Every release of the site, newest first: new features, fixes and rule changes."
      >
        <p className="text-sm text-muted-foreground">
          Something wrong, or an idea? <TextLink to="/report?from=/changelog">Report it</TextLink>.
        </p>
      </PageHeader>
      <ReleaseNotes releases={pageContext.releases} />
    </Page>
  </Layout>
)

export default ChangelogPage
