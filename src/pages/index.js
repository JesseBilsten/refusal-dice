import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'

const IndexPage = () => (
  <Layout>
    <section className="jumbotron">
      <div className="container">
        <h1 className="jumbotron-heading">Refusal Dice</h1>
        <p className="lead text-muted">
          The game plays much like poker in that it is played with groups of
          people typically 2-8 (anymore than 8 and partners are encouraged -
          more on that later) and five, six sided dice.
        </p>
      </div>
    </section>
    <section className="container">
      <div className="row">
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">How do I play?</h5>
              <p className="card-text">
                Read through an example game and how calls are made and why.
              </p>
              <a href="#" className="btn btn-primary">
                Rules
              </a>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">What do I call?</h5>
              <p className="card-text">
                A list of the games you can call in Refusal Dice.
              </p>
              <a href="#" className="btn btn-primary">
                Games
              </a>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">What'd they say?</h5>
              <p className="card-text">
                If you're confused about what's being said, read the glossary of common phrases and terms.
              </p>
              <a href="#" className="btn btn-primary">
                Glossary
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Layout>
)

export default IndexPage
