import React from 'react'
import { Link } from 'gatsby'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'

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

const TableData = ({ game, roll, rowSpan }) => {
  const percentage = rollPercentage(games[game], roll)
  return (
    <TableCell 
      style={{ backgroundColor: getColor(percentage) }} 
      rowSpan={rowSpan}
      className="text-center font-medium text-gray-900 dark:text-gray-900"
    >
      {percentage}%
    </TableCell>
  )
}

const OddsPage = ({ data }) => {
  return (
    <Layout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Odds <Badge variant="warning">incomplete</Badge>
          </h1>
          <p className="text-lg text-muted-foreground">
            How likely are you to roll a specific game or event
          </p>
        </div>
        <div className="space-y-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>...in 1 roll</TableHead>
                <TableHead>...in 2 rolls</TableHead>
                <TableHead>...in 3 rolls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Link to="/games#10-3" className="text-primary hover:underline">10-3</Link>
                </TableCell>
                <TableData game="10-3" roll="1" />
                <TableData game="10-3" roll="2" />
                <TableData game="10-3" roll="3" />
              </TableRow>
              <TableRow>
                <TableCell>
                  <Link to="/games#10-2" className="text-primary hover:underline">10-2</Link>
                </TableCell>
                <TableData game="10-2" roll="1" />
                <TableData game="10-2" roll="2" />
                <TableData game="10-2" roll="3" />
              </TableRow>
              <TableRow>
                <TableCell>
                  <Link to="/games#vegas" className="text-primary hover:underline">Vegas</Link>
                </TableCell>
                <TableData game="vegas" roll="1" />
                <TableData game="vegas" roll="2" />
                <TableData game="vegas" roll="3" />
              </TableRow>
              <TableRow>
                <TableCell>
                  <Link to="/games#ship-captain-crew" className="text-primary hover:underline">Ship, Captain, Crew</Link>
                </TableCell>
                <TableData game="ship-captain-crew" roll="1" />
                <TableData game="ship-captain-crew" roll="2" />
                <TableData game="ship-captain-crew" roll="3" />
              </TableRow>
              <TableRow>
                <TableCell>
                  <Link to="/games#pairs" className="text-primary hover:underline">Pairs</Link>
                </TableCell>
                <TableData game="pairs" roll="1" />
                <TableData game="pairs" roll="2" />
                <TableData game="pairs" roll="3" />
              </TableRow>
              <TableRow>
                <TableCell>
                  <Link to="/games#monterey" className="text-primary hover:underline">Monterey</Link>
                </TableCell>
                <TableData game="monterey" roll="1" />
                <TableData game="monterey" roll="2" />
                <TableData game="monterey" roll="3" />
              </TableRow>
              <TableRow>
                <TableCell>
                  <Link to="/games#10-4" className="text-primary hover:underline">10-4</Link>
                </TableCell>
                <TableData game="10-4" roll="1" />
                <TableData game="10-4" roll="2" />
                <TableData game="10-4" roll="3" />
              </TableRow>
            </TableBody>
          </Table>

          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan="19" className="text-center font-medium">
                  <Link to="/games#razzle" className="text-primary hover:underline">Razzle</Link>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="bg-muted" aria-label="Spacer">&nbsp;</TableCell>
                <TableHead colSpan="3" className="text-center">5 dice</TableHead>
                <TableHead colSpan="3" className="text-center">4 dice</TableHead>
                <TableHead colSpan="3" className="text-center">3 dice</TableHead>
                <TableHead colSpan="3" className="text-center">2 dice</TableHead>
                <TableHead colSpan="3" className="text-center">1 dice</TableHead>
              </TableRow>
              <TableRow>
                <TableHead># of Sixes</TableHead>
                <TableHead>1 roll</TableHead>
                <TableHead>2</TableHead>
                <TableHead>3</TableHead>
                <TableHead>1 roll</TableHead>
                <TableHead>2</TableHead>
                <TableHead>3</TableHead>
                <TableHead>1 roll</TableHead>
                <TableHead>2</TableHead>
                <TableHead>3</TableHead>
                <TableHead>1 roll</TableHead>
                <TableHead>2</TableHead>
                <TableHead>3</TableHead>
                <TableHead>1 roll</TableHead>
                <TableHead>2</TableHead>
                <TableHead>3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-right">1</TableCell>
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
            </TableRow>
            <TableRow>
              <TableCell className="text-right">2</TableCell>
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
              <TableCell colSpan="3" className="bg-muted" aria-label="Not applicable"></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right">3</TableCell>
              <TableData game="razzle__3__5d6" roll="1" />
              <TableData game="razzle__3__5d6" roll="2" />
              <TableData game="razzle__3__5d6" roll="3" />
              <TableData game="razzle__3__4d6" roll="1" />
              <TableData game="razzle__3__4d6" roll="2" />
              <TableData game="razzle__3__4d6" roll="3" />
              <TableData game="razzle__3__3d6" roll="1" />
              <TableData game="razzle__3__3d6" roll="2" />
              <TableData game="razzle__3__3d6" roll="3" />
              <TableCell colSpan="6" className="bg-muted" aria-label="Not applicable"></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right">4</TableCell>
              <TableData game="razzle__4__5d6" roll="1" />
              <TableData game="razzle__4__5d6" roll="2" />
              <TableData game="razzle__4__5d6" roll="3" />
              <TableData game="razzle__4__4d6" roll="1" />
              <TableData game="razzle__4__4d6" roll="2" />
              <TableData game="razzle__4__4d6" roll="3" />
              <TableCell colSpan="9" className="bg-muted" aria-label="Not applicable"></TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-right">5</TableCell>
              <TableData game="razzle__5__5d6" roll="1" />
              <TableData game="razzle__5__5d6" roll="2" />
              <TableData game="razzle__5__5d6" roll="3" />
              <TableCell colSpan="12" className="bg-muted" aria-label="Not applicable"></TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell colSpan="10" className="text-center font-medium">
                <Link to="/games#boss" className="text-primary hover:underline">Boss</Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead colSpan="3" rowSpan="2" className="align-middle text-center">1st Roll</TableHead>
              <TableHead colSpan="7" className="text-center">2nd Roll</TableHead>
            </TableRow>
            <TableRow>
              <TableHead colSpan="2" className="text-center">5 dice</TableHead>
              <TableHead>2 pairs</TableHead>
              <TableHead>3 of a kind</TableHead>
              <TableHead>full house</TableHead>
              <TableHead>4 of a kind</TableHead>
              <TableHead>5 of a kind</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead className="text-right">a 6 high</TableHead>
              <TableData game="boss-6high__5d6" roll="1" />
              <TableCell colSpan="1" className="bg-muted">N/A</TableCell>
              <TableData game="boss-nomatch__4d6" roll="1" />
              <TableData game="boss-1match__4d6" roll="1" />
              <TableData game="boss-2match__4d6" roll="1" />
              <TableData game="" roll="1" />
              <TableData game="boss-house__4d6" roll="1" />
              <TableData game="boss-4kind__4d6" roll="1" />
              <TableData game="boss-5kind__4d6" roll="1" />
            </TableRow>
            <TableRow>
              <TableHead className="text-right">1 pair</TableHead>
              <TableData game="boss-1pair__5d6" roll="1" />
              <TableData game="boss-1pair-orbetter__5d6" roll="1" rowSpan="6" />
              <TableCell colSpan="2" className="bg-muted">N/A</TableCell>
              <TableData game="boss-1pair__3d6" roll="1" />
              <TableData game="boss-1match__3d6" roll="1" />
              <TableData game="boss-3kind__3d6" roll="1" />
              <TableData game="boss-2match__3d6" roll="1" />
              <TableData game="boss-3match__3d6" roll="1" />
            </TableRow>
            <TableRow>
              <TableHead className="text-right">2 pair</TableHead>
              <TableData game="boss-2pair__5d6" roll="1" />
              <TableCell colSpan="4" className="bg-muted">N/A</TableCell>
              <TableData game="boss-house__1d6" roll="1" />
              <TableCell colSpan="2" className="bg-muted">N/A</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="text-right">3 of a kind</TableHead>
              <TableData game="boss-3kind__5d6" roll="1" />
              <TableCell colSpan="4" className="bg-muted">N/A</TableCell>
              <TableData game="boss-1pair__2d6" roll="1" />
              <TableData game="boss-1high__2d6" roll="1" />
              <TableData game="boss-1pair__2d6" roll="1" />
            </TableRow>
            <TableRow>
              <TableHead className="text-right">full house</TableHead>
              <TableData game="boss-house__5d6" roll="1" />
              <TableCell colSpan="9" className="bg-muted">N/A</TableCell>
            </TableRow>
            <TableRow>
              <TableHead className="text-right">4 of a kind</TableHead>
              <TableData game="boss-4kind__5d6" roll="1" />
              <TableCell colSpan="6" className="bg-muted">N/A</TableCell>
              <TableData game="boss-5kind__1d6" roll="1" />
            </TableRow>
            <TableRow>
              <TableHead className="text-right">5 of a kind</TableHead>
              <TableData game="boss-5kind__5d6" roll="1" />
              <TableCell colSpan="7" className="bg-muted">N/A</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell colSpan="6" className="text-center font-medium">
                <Link to="/games#tres-away" className="text-primary hover:underline">Tres Away</Link>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHead>Result</TableHead>
              <TableHead>5 dice</TableHead>
              <TableHead>4 dice</TableHead>
              <TableHead>3 dice</TableHead>
              <TableHead>2 dice</TableHead>
              <TableHead>1 die</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-right">at least a 3</TableCell>
              <TableData game="tres-away__3__5d6" roll="1" />
              <TableData game="tres-away__3__4d6" roll="1" />
              <TableData game="tres-away__3__3d6" roll="1" />
              <TableData game="tres-away__3__2d6" roll="1" />
              <TableData game="tres-away__3__1d6" roll="1" />
            </TableRow>
            <TableRow>
              <TableCell className="text-right">a 3 or 1</TableCell>
              <TableData game="tres-away__1,3__5d6" roll="1" />
              <TableData game="tres-away__1,3__4d6" roll="1" />
              <TableData game="tres-away__1,3__3d6" roll="1" />
              <TableData game="tres-away__1,3__2d6" roll="1" />
              <TableData game="tres-away__1,3__1d6" roll="1" />
            </TableRow>
            <TableRow>
              <TableCell className="text-right">a 3, 1, or 2</TableCell>
              <TableData game="tres-away__1-3__5d6" roll="1" />
              <TableData game="tres-away__1-3__4d6" roll="1" />
              <TableData game="tres-away__1-3__3d6" roll="1" />
              <TableData game="tres-away__1-3__2d6" roll="1" />
              <TableData game="tres-away__1-3__1d6" roll="1" />
            </TableRow>
          </TableBody>
        </Table>
      </div>
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
