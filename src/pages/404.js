import React from 'react'
import Layout from '../components/layout'

const NotFoundPage = () => (
  <Layout>
    <section className="section-gap">
      <div className="section-gap container-custom">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">NOT FOUND</h1>
          <p className="lead mt-2 content-prose">You just hit a route that doesn't exist... the sadness.</p>
        </header>
      </div>
    </section>
  </Layout>
)

export default NotFoundPage
