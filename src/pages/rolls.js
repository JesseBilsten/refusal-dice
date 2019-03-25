import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'

function odds(rolls, game) {
  let success = []
  if (game === '10-2') {
    success = rolls.map((roll, index) => {})
  }
}

const RollsPage = ({ data }) => {
  var diceRolls = []
  var successfulRolls = 0

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

  return (
    <Layout>
      <section className="container mt-5">
        <div className="my-5 text-center">
          <h1>
            Rolls <span className="badge badge-warning">incomplete</span>
          </h1>
          <p className="lead">A visual of all possible rolls</p>
          <small>{new Date().toLocaleString()}</small>
        </div>
        <div className="accordion" id="accordionExample">
          <div className="card">
            <div className="card-header" id="headingOne">
              <h5 className="mb-0">
                <button
                  className="btn btn-link"
                  type="button"
                  data-toggle="collapse"
                  data-target="#collapseOne"
                  aria-expanded="true"
                  aria-controls="collapseOne"
                >
                  Collapsible Group Item #1
                </button>
              </h5>
            </div>
            <div
              id="collapseOne"
              className="collapse show"
              aria-labelledby="headingOne"
              data-parent="#accordionExample"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                fontFamily: 'monospace',
              }}
            >
              <div className="card-body">
                {diceRolls.map((roll, index) => {
                  let badgeType = 'light'
                  if (
                    // roll.indexOf(4) >= 0
                    roll.indexOf(6) >= 0 ||
                    roll.indexOf(1) >= 0
                    // ||
                    // (roll.lastIndexOf(5) > roll.indexOf(5))
                  ) {
                    badgeType = 'success'
                    successfulRolls++
                  }
                  return (
                    <p
                      className={'badge badge-' + badgeType}
                      data-number={roll.indexOf(6)}
                      style={{
                        margin: '0 1px 1px 0',
                      }}
                    >
                      {roll[0]}
                      {roll[1]}
                      {roll[2]}
                      {roll[3]}
                      {roll[4]}
                    </p>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container">
        <h1>{successfulRolls}/7776</h1>
        <h2>{Math.floor((successfulRolls / 7776) * 100)}%</h2>
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
