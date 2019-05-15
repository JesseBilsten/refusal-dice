import React from 'react'
import { Link } from 'gatsby'
import { graphql } from 'gatsby'
import Layout from '../components/layout'

const round = (value, decimals) =>
  Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)

const getColor = (value) =>
  "hsl(" + (Math.round(value)/100) * 120 + ", 100%, 80%)"

let games = []
games['10-2'] = 49.07
games['10-3'] = 53.43
games['10-4'] = 22.25
games['ship-captain-crew'] = 31.64
games['monterey'] = 25.46
games['vegas'] = 32.41
games['pairs'] = 29.01
games['razzle'] = round((6752 / 7776) * 100, 2)
games['razzle__1__5d6'] = 100 - (Math.pow(4, 5) / Math.pow(6, 5)) * 100
games['razzle__2__5d6'] = 53.91 // output [count {1, 6} in 5d6] https://anydice.com/
games['razzle__3__5d6'] = 20.99
games['razzle__4__5d6'] = 4.53
games['razzle__5__5d6'] = 0.41
games['razzle__1__4d6'] = 100 - (Math.pow(4, 4) / Math.pow(6, 4)) * 100
games['razzle__2__4d6'] = 40.74
games['razzle__3__4d6'] = 11.11
games['razzle__4__4d6'] = 1.25
games['razzle__1__3d6'] = 100 - (Math.pow(4, 3) / Math.pow(6, 3)) * 100
games['razzle__2__3d6'] = 25.93
games['razzle__3__3d6'] = 3.70
games['razzle__1__2d6'] = 100 - (Math.pow(4, 2) / Math.pow(6, 2)) * 100
games['razzle__2__2d6'] = 11.11
games['razzle__1__1d6'] = 100 - (Math.pow(4, 1) / Math.pow(6, 1)) * 100
games['boss-6high__5d6'] = 40.19
games['boss-nomatch__4d6'] = 48.23 // What are the odds of NOT rolling a matching number
games['boss-1pair__5d6'] = 46.3  // 3600/7776 
games['boss-1pair-orbetter__5d6'] = 7056/7776*100 // odds of getting a pair or better
games['boss-6s-orbetter__5d6'] = 4056/7776*100 // odds of getting two 6's or better
games['boss-1pair__4d6'] = 48.23
games['boss-1match__4d6'] = 51.77 // at least 1 die matches a held die
games['boss-2pair__5d6'] = 23.15
games['boss-3kind__5d6'] = 15.43
games['boss-3kind__4d6'] = 48.23
games['boss-3match__3d6'] = 0.46 // 3 dice match a held pair
games['boss-2match__3d6'] = 1.85 // at least 2 dice match a held pair
games['boss-1match__3d6'] = 49.99 // at least 1 dice match a held pair
games['boss-3kind__3d6'] = 2.78
games['boss-house__5d6'] = 3.86
games['boss-4kind__5d6'] = 1.93
games['boss-5kind__5d6'] = 0.08
games['boss-5kind__1d6'] = 16.67
games['tres-away__3__5d6'] = 100 - (Math.pow(5, 5) / Math.pow(6, 5)) * 100 // 100-(4^5/6^5)*100 at least 1 one or three w/ 5 dice
games['tres-away__1,3__5d6'] = 100 - (Math.pow(4, 5) / Math.pow(6, 5)) * 100 // 100-(4^5/6^5)*100 at least 1 one or three w/ 5 dice
games['tres-away__1-3__5d6'] = 100 - (Math.pow(3, 5) / Math.pow(6, 5)) * 100 // 100-(4^5/6^5)*100 at least 1 one, two or three w/ 5 dice
games['tres-away__3__4d6'] = 100 - (Math.pow(5, 4) / Math.pow(6, 4)) * 100 // 100-(5^4/6^4)*100 at least 1 three w/ 4 dice
games['tres-away__1,3__4d6'] = 100 - (Math.pow(4, 4) / Math.pow(6, 4)) * 100 // 100-(4^4/6^4)*100 at least 1 one or three w/ 4 dice
games['tres-away__1-3__4d6'] = 100 - (Math.pow(3, 4) / Math.pow(6, 4)) * 100 // 100-(4^4/6^4)*100 at least 1 one, two or three w/ 4 dice
games['tres-away__3__3d6'] = 100 - (Math.pow(5, 3) / Math.pow(6, 3)) * 100 // 100-(5^3/6^3)*100 at least 1 three w/ 3 dice
games['tres-away__1,3__3d6'] = 100 - (Math.pow(4, 3) / Math.pow(6, 3)) * 100 // 100-(4^3/6^3)*100 at least 1 one or three w/ 3 dice
games['tres-away__1-3__3d6'] = 100 - (Math.pow(3, 3) / Math.pow(6, 3)) * 100 // 100-(4^3/6^3)*100 at least 1 one or three w/ 3 dice
games['tres-away__3__2d6'] = 100 - (Math.pow(5, 2) / Math.pow(6, 2)) * 100 // 100-(5^2/6^2)*100 at least 1 three w/ 2 dice
games['tres-away__1,3__2d6'] = 100 - (Math.pow(4, 2) / Math.pow(6, 2)) * 100 // 100-(4^3/6^3)*100 at least 1 one or three w/ 3 dice
games['tres-away__1-3__2d6'] = 100 - (Math.pow(3, 2) / Math.pow(6, 2)) * 100 // 100-(4^3/6^3)*100 at least 1 one or three w/ 3 dice
games['tres-away__3__1d6'] = 100 - (Math.pow(5, 1) / Math.pow(6, 1)) * 100 
games['tres-away__1,3__1d6'] = 100 - (Math.pow(4, 1) / Math.pow(6, 1)) * 100 
games['tres-away__1-3__1d6'] = 100 - (Math.pow(3, 1) / Math.pow(6, 1)) * 100 

const rollPercentage = (percentage, rolls) =>
  round((1 - Math.pow(100 - percentage, rolls) / Math.pow(100, rolls)) * 100, 2)

const TableData = ({ game, roll, rowspan }) => {
  const percentage = rollPercentage(games[game], roll)
  return (
    <td style={{ backgroundColor: getColor(percentage) }} rowspan={rowspan}>{percentage}%</td>
  )
}

const OddsPage = ({ data }) => {
  return (
    <Layout>
      <section className="container mt-5">
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
                <Link to="/games#10-3">10-3</Link>
              </td>
              <TableData game="10-3" roll="1" />
              <TableData game="10-3" roll="2" />
              <TableData game="10-3" roll="3" />
            </tr>
            <tr>
              <td>
                <Link to="/games#10-2">10-2</Link>
              </td>
              <TableData game="10-2" roll="1" />
              <TableData game="10-2" roll="2" />
              <TableData game="10-2" roll="3" />
            </tr>
            <tr>
              <td>
                <Link to="/games#vegas">Vegas</Link>
              </td>
              <TableData game="vegas" roll="1" />
              <TableData game="vegas" roll="2" />
              <TableData game="vegas" roll="3" />
            </tr>
            <tr>
              <td>
                <Link to="/games#ship-captain-crew">Ship, Captain, Crew</Link>
              </td>
              <TableData game="ship-captain-crew" roll="1" />
              <TableData game="ship-captain-crew" roll="2" />
              <TableData game="ship-captain-crew" roll="3" />
            </tr>
            <tr>
              <td>
                <Link to="/games#pairs">Pairs</Link>
              </td>
              <TableData game="pairs" roll="1" />
              <TableData game="pairs" roll="2" />
              <TableData game="pairs" roll="3" />
            </tr>
            <tr>
              <td>
                <Link to="/games#monterey">Monterey</Link>
              </td>
              <TableData game="monterey" roll="1" />
              <TableData game="monterey" roll="2" />
              <TableData game="monterey" roll="3" />
            </tr>
            <tr>
              <td>
                <Link to="/games#10-4">10-4</Link>
              </td>
              <TableData game="10-4" roll="1" />
              <TableData game="10-4" roll="2" />
              <TableData game="10-4" roll="3" />
            </tr>
          </tbody>
        </table>
        <table className="table table-bordered odds">
          <thead>
            <tr>
              <td colspan="19">
                <Link to="/games#razzle">Razzle</Link>
              </td>
            </tr>
            <tr>
              <td style={{ backgroundColor: '#999' }}>&nbsp;</td>
              <th colspan="3">5 dice</th>
              <th colspan="3">4 dice</th>
              <th colspan="3">3 dice</th>
              <th colspan="3">2 dice</th>
              <th colspan="3">1 dice</th>
            </tr>
            <tr>
              <th># of Sixes</th>
              <th>1 roll</th>
              <th>2</th>
              <th>3</th>
              <th>1 roll</th>
              <th>2</th>
              <th>3</th>
              <th>1 roll</th>
              <th>2</th>
              <th>3</th>
              <th>1 roll</th>
              <th>2</th>
              <th>3</th>
              <th>1 roll</th>
              <th>2</th>
              <th>3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td align="right">1</td>
              <TableData game="razzle__1__5d6" roll="1" />
              <TableData game="razzle__1__5d6" roll="2" />
              <TableData game="razzle__1__5d6" roll="3" />
              <TableData game="razzle__1__4d6" roll="1" />
              <TableData game="razzle__1__4d6" roll="2" />
              <TableData game="razzle__1__4d6" roll="3" />
              <TableData game="razzle__1__3d6" roll="1" />
              <TableData game="razzle__1__3d6" roll="2" />
              <TableData game="razzle__1__3d6" roll="3" />
              <TableData game="razzle__1__2d6" roll="1" />
              <TableData game="razzle__1__2d6" roll="2" />
              <TableData game="razzle__1__2d6" roll="3" />
              <TableData game="razzle__1__1d6" roll="1" />
              <TableData game="razzle__1__1d6" roll="2" />
              <TableData game="razzle__1__1d6" roll="3" />
            </tr>
            <tr>
              <td align="right">2</td>
              <TableData game="razzle__2__5d6" roll="1" />
              <TableData game="razzle__2__5d6" roll="2" />
              <TableData game="razzle__2__5d6" roll="3" />
              <TableData game="razzle__2__4d6" roll="1" />
              <TableData game="razzle__2__4d6" roll="2" />
              <TableData game="razzle__2__4d6" roll="3" />
              <TableData game="razzle__2__3d6" roll="1" />
              <TableData game="razzle__2__3d6" roll="2" />
              <TableData game="razzle__2__3d6" roll="3" />
              <TableData game="razzle__2__2d6" roll="1" />
              <TableData game="razzle__2__2d6" roll="2" />
              <TableData game="razzle__2__2d6" roll="3" />
              <td colspan="3" style={{backgroundColor: '#999' }}></td>
            </tr>
            <tr>
              <td align="right">3</td>
              <TableData game="razzle__3__5d6" roll="1" />
              <TableData game="razzle__3__5d6" roll="2" />
              <TableData game="razzle__3__5d6" roll="3" />
              <TableData game="razzle__3__4d6" roll="1" />
              <TableData game="razzle__3__4d6" roll="2" />
              <TableData game="razzle__3__4d6" roll="3" />
              <TableData game="razzle__3__3d6" roll="1" />
              <TableData game="razzle__3__3d6" roll="2" />
              <TableData game="razzle__3__3d6" roll="3" />
              <td colspan="6" style={{backgroundColor: '#999' }}></td>
            </tr>
            <tr>
              <td align="right">4</td>
              <TableData game="razzle__4__5d6" roll="1" />
              <TableData game="razzle__4__5d6" roll="2" />
              <TableData game="razzle__4__5d6" roll="3" />
              <TableData game="razzle__4__4d6" roll="1" />
              <TableData game="razzle__4__4d6" roll="2" />
              <TableData game="razzle__4__4d6" roll="3" />
              <td colspan="9" style={{backgroundColor: '#999' }}></td>
            </tr>
            <tr>
              <td align="right">5</td>
              <TableData game="razzle__5__5d6" roll="1" />
              <TableData game="razzle__5__5d6" roll="2" />
              <TableData game="razzle__5__5d6" roll="3" />
              <td colspan="12" style={{backgroundColor: '#999' }}></td>
            </tr>
          </tbody>
        </table>
        <table className="table table-bordered odds">
          <thead>
            <tr>
              <td colspan="10">
                <Link to="/games#boss">Boss</Link>
              </td>
            </tr>
            <tr>
              <th colspan="3" rowspan="2" style={{ verticalAlign: "top" }}>1st Roll</th>
              <th colspan="7">2nd Roll</th>
            </tr>
            <tr>
              <th colspan="2">5 dice</th>
              <th>2 pairs</th>
              <th>3 of a kind</th>
              <th>full house</th>
              <th>4 of a kind</th>
              <th>5 of a kind</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th align="right">a 6 high</th>
              <TableData game="boss-6high__5d6" roll="1" />
              <td colspan="1" style={{ backgroundColor: '#999' }}>N/A</td>
              <TableData game="boss-nomatch__4d6" roll="1" />
              <TableData game="boss-1match__4d6" roll="1" />
              <TableData game="boss-2match__4d6" roll="1" />
              <TableData game="" roll="1" />
              <TableData game="boss-house__4d6" roll="1" />
              <TableData game="boss-4kind__4d6" roll="1" />
              <TableData game="boss-5kind__4d6" roll="1" />
            </tr>
            <tr>
              <th align="right">1 pair</th>
              <TableData game="boss-1pair__5d6" roll="1" />
              <TableData game="boss-1pair-orbetter__5d6" roll="1" rowspan="6" />
              <td colspan="2" style={{ backgroundColor: '#999' }}>N/A</td>
              <TableData game="boss-1pair__3d6" roll="1" />
              <TableData game="boss-1match__3d6" roll="1" />
              <TableData game="boss-3kind__3d6" roll="1" />
              <TableData game="boss-2match__3d6" roll="1" />
              <TableData game="boss-3match__3d6" roll="1" />
            </tr>
            <tr>
              <th align="right">2 pair</th>
              <TableData game="boss-2pair__5d6" roll="1" />
              <td colspan="4" style={{ backgroundColor: '#999' }}>N/A</td>
              <TableData game="boss-house__1d6" roll="1" />
              <td colspan="2" style={{ backgroundColor: '#999' }}>N/A</td>
            </tr>
            <tr>
              <th align="right">3 of a kind</th>
              <TableData game="boss-3kind__5d6" roll="1" />
              <td colspan="4" style={{ backgroundColor: '#999' }}>N/A</td>
              <TableData game="boss-1pair__2d6" roll="1" />
              <TableData game="boss-1high__2d6" roll="1" />
              <TableData game="boss-1pair__2d6" roll="1" />
            </tr>
            <tr>
              <th align="right">full house</th>
              <TableData game="boss-house__5d6" roll="1" />
              <td colspan="9" style={{ backgroundColor: '#999' }}>N/A</td>
            </tr>
            <tr>
              <th align="right">4 of a kind</th>
              <TableData game="boss-4kind__5d6" roll="1" />
              <td colspan="6" style={{ backgroundColor: '#999' }}>N/A</td>
              <TableData game="boss-5kind__1d6" roll="1" />
            </tr>
            <tr>
              <th align="right">5 of a kind</th>
              <TableData game="boss-5kind__5d6" roll="1" />
              <td colspan="7" style={{ backgroundColor: '#999' }}>N/A</td>
            </tr>
          </tbody>
        </table>
        <table className="table table-bordered odds">
          <thead>
            <tr>
              <td colspan="6">
                <Link to="/games#tres-away">Tres Away</Link>
              </td>
            </tr>
            <tr>
              <th>Result</th>
              <th>5 dice</th>
              <th>4 dice</th>
              <th>3 dice</th>
              <th>2 dice</th>
              <th>1 die</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td align="right">at least a 3</td>
              <TableData game="tres-away__3__5d6" roll="1" />
              <TableData game="tres-away__3__4d6" roll="1" />
              <TableData game="tres-away__3__3d6" roll="1" />
              <TableData game="tres-away__3__2d6" roll="1" />
              <TableData game="tres-away__3__1d6" roll="1" />
            </tr>
            <tr>
              <td align="right">a 3 or 1</td>
              <TableData game="tres-away__1,3__5d6" roll="1" />
              <TableData game="tres-away__1,3__4d6" roll="1" />
              <TableData game="tres-away__1,3__3d6" roll="1" />
              <TableData game="tres-away__1,3__2d6" roll="1" />
              <TableData game="tres-away__1,3__1d6" roll="1" />
            </tr>
            <tr>
              <td align="right">a 3, 1, or 2</td>
              <TableData game="tres-away__1-3__5d6" roll="1" />
              <TableData game="tres-away__1-3__4d6" roll="1" />
              <TableData game="tres-away__1-3__3d6" roll="1" />
              <TableData game="tres-away__1-3__2d6" roll="1" />
              <TableData game="tres-away__1-3__1d6" roll="1" />
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
