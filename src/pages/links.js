import React from 'react'
import Layout from '../components/layout'

const LinksPage = () => (
  <Layout>
    <section className="section-gap">
      <div className="section-gap container-custom">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Links</h1>
          <p className="lead mt-2 content-prose">Curated external resources about bar dice variations and history.</p>
        </header>
      </div>
      <div className="container-custom">
        <a href="https://eightygames.wordpress.com/tag/san-francisco-bar-dice/" className="text-blue-600 hover:text-blue-700">
          Variation
        </a>
      </div>
    </section>
  </Layout>
)

export default LinksPage
