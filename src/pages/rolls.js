import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import Badge from '../components/ui/Badge'

const RollsPage = ({ data }) => {
  let diceRolls = []

  // if (window.localStorage.getItem('diceRolls')) {
    // diceRolls = JSON.parse(window.localStorage.getItem('diceRolls'))
  // }

  // Check if matrix is empty
  if (!diceRolls.length) {
    // Generate dice roll diceRolls
    var count = 0
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 6; j++) {
        for (var k = 0; k < 6; k++) {
          for (var l = 0; l < 6; l++) {
            for (var m = 0; m < 6; m++) {
              diceRolls[count] = [i + 1, j + 1, k + 1, l + 1, m + 1]
              count++
            }
          }
        }
      }
    }
  }

  const successfulRolls = diceRolls.filter(roll => (roll.indexOf(6) >= 0 || roll.indexOf(1) >= 0)).length

  return (
    <Layout>
      <section className="section-gap">
        <div className="section-gap container-custom">
          <header className="mb-6">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Rolls <Badge>incomplete</Badge></h1>
            <p className="lead mt-2 content-prose">A visual of all possible rolls</p>
            <small className="block mt-2">{new Date().toLocaleString()}</small>
          </header>
        </div>
          <div className="card">
              <div className="font-mono flex flex-wrap">
                {diceRolls.map((roll, index) => {
                  const highlight = (roll.indexOf(6) >= 0 || roll.indexOf(1) >= 0)
                  return (
                    <span
                      key={index}
                      data-number={roll.indexOf(6)}
                      className={highlight ? 'inline-flex items-center bg-success-surface text-success-foreground px-2 py-1 mr-1 mb-1 rounded' : 'inline-flex items-center bg-surface text-surface-foreground px-2 py-1 mr-1 mb-1 rounded'}
                    >
                      {roll.join('')}
                    </span>
                  )
                })}
              </div>
          </div>
        </section>
      <section className="mt-6">
        <div className="card text-center p-4">
          <h2 className="text-lg font-semibold">{successfulRolls}/7776</h2>
          <p className="mt-1 text-sm">{Math.floor((successfulRolls / 7776) * 100)}%</p>
        </div>
      </section>
    </Layout>
  )
}

export default RollsPage

export const query = graphql`
  query {
    allFile {
      edges {
        node {
          relativePath
          prettySize
          extension
          birthTime(fromNow: true)
        }
      }
    }
  }
`
