import React from 'react'
import { Link } from 'gatsby'
import { graphql } from 'gatsby'
import Layout from '../components/layout'

let round = (value, decimals) =>
  Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)

const OddsPage = ({ data }) => {
  let games = []
  games['10-2'] = 49.07
  games['10-3'] = 53.43
  games['10-4'] = 22.25
  games['ship-captain-crew'] = 31.64
  games['monterey'] = 25.46
  games['vegas'] = 32.41
  games['pairs'] = 29.01
  games['razzle'] = round((6752 / 7776) * 100, 2)
  games['razzle__4d6'] = 86
  games['razzle__3d6'] = 86
  games['razzle__2d6'] = 86
  games['razzle__1d6'] = 86
  games['boss-1pair'] = 46.3
  games['boss-2pair'] = 23.15
  games['boss-3kind'] = 15.43
  games['boss-house'] = 3.86
  games['boss-4kind'] = 1.93
  games['boss-5kind'] = 0.08

  const rollPercentage = (percentage, rolls) =>
    Math.round(
      (1 - Math.pow(100 - percentage, rolls) / Math.pow(100, rolls)) * 100
    )

  return (
    <Layout>
      <section className="container mt-5">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">In progress</h4>
          <p>
            I'm working on pulling in the brute force odds formulas I created a
            while back so at the moment this data is incomplete and may need to
            be checked for errors.
          </p>
          <hr />
          <p className="mb-0">Jesse Bilsten</p>
        </div>
        <div className="my-5 text-center">
          <h1>
            Odds <span className="badge badge-warning">incomplete</span>
          </h1>
          <p className="lead">
            How likely are you to roll a specific game or event
          </p>
        </div>
        <table className="table table-bordered odds">
          <thead>
            <tr>
              <th>Game</th>
              <th>...in 1 roll</th>
              <th>...in 2 rolls</th>
              <th>...in 3 rolls</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Link to="/games#10-2">10-2</Link>
              </td>
              <td>{rollPercentage(games['10-2'], 1)}%</td>
              <td>{rollPercentage(games['10-2'], 2)}%</td>
              <td>{rollPercentage(games['10-2'], 3)}%</td>
            </tr>
            <tr>
              <td>
                <Link to="/games#10-3">10-3</Link>
              </td>
              <td>{rollPercentage(games['10-3'], 1)}%</td>
              <td>{rollPercentage(games['10-3'], 2)}%</td>
              <td>{rollPercentage(games['10-3'], 3)}%</td>
            </tr>
            <tr>
              <td>
                <Link to="/games#10-4">10-4</Link>
              </td>
              <td>{rollPercentage(games['10-4'], 1)}%</td>
              <td>{rollPercentage(games['10-4'], 2)}%</td>
              <td>{rollPercentage(games['10-4'], 3)}%</td>
            </tr>
            <tr>
              <td>
                <Link to="/games#ship-captain-crew">Ship, Captain, Crew</Link>
              </td>
              <td>{rollPercentage(games['ship-captain-crew'], 1)}%</td>
              <td>{rollPercentage(games['ship-captain-crew'], 2)}%</td>
              <td>{rollPercentage(games['ship-captain-crew'], 3)}%</td>
            </tr>
            <tr>
              <td>
                <Link to="/games#monterey">Monterey</Link>
              </td>
              <td>{rollPercentage(games['monterey'], 1)}%</td>
              <td>{rollPercentage(games['monterey'], 2)}%</td>
              <td>{rollPercentage(games['monterey'], 3)}%</td>
            </tr>
            <tr>
              <td>
                <Link to="/games#vegas">Vegas</Link>
              </td>
              <td>{rollPercentage(games['vegas'], 1)}%</td>
              <td>{rollPercentage(games['vegas'], 2)}%</td>
              <td>{rollPercentage(games['vegas'], 3)}%</td>
            </tr>
            <tr>
              <td>
                <Link to="/games#pairs">Pairs</Link>
              </td>
              <td>{rollPercentage(games['pairs'], 1)}%</td>
              <td>{rollPercentage(games['pairs'], 2)}%</td>
              <td>{rollPercentage(games['pairs'], 3)}%</td>
            </tr>
            <tr>
              <td colspan="4">
                <Link to="/games#razzle">Razzle</Link>
              </td>
            </tr>
            <tr>
              <td align="right">1 six</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">2 sixes</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">3 sixes</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">4 sixes</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">5 sixes</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">6 sixes</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td colspan="4">
                <Link to="/games#boss">Boss</Link>
              </td>
            </tr>
            <tr>
              <td align="right">1 pair</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">2 pair</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">3 of a kind</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">full house</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">4 of a kind</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">5 of a kind</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td colspan="4">
                <Link to="/games#tres-away">Tres Away</Link>
              </td>
            </tr>
            <tr>
              <td align="right">at least a 3</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">a 3 or 1 with 4 dice</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">a 3 or 1 with 3 dice</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
            <tr>
              <td align="right">a 3, 1, or 2 with 2 dice</td>
              <td>{rollPercentage(games[''], 1)}%</td>
              <td>{rollPercentage(games[''], 2)}%</td>
              <td>{rollPercentage(games[''], 3)}%</td>
            </tr>
          </tbody>
        </table>
      </section>
    </Layout>
  )
}

export default OddsPage

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
