import React from 'react'
import { graphql } from 'gatsby'
import Layout from '../components/layout'
import { Badge } from '../components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'

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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="my-5 text-center">
          <h1 className="flex items-center justify-center gap-2">
            Rolls <Badge variant="warning">incomplete</Badge>
          </h1>
          <p className="text-lg text-muted-foreground mt-2">A visual of all possible rolls</p>
          <small className="text-sm text-muted-foreground">{new Date().toLocaleString()}</small>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Possible Rolls</CardTitle>
          </CardHeader>
          <CardContent
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontFamily: 'monospace',
            }}
          >
            {diceRolls.map((roll, index) => {
              let badgeVariant = 'secondary'
              if (
                // roll.indexOf(4) >= 0
                roll.indexOf(6) >= 0 ||
                roll.indexOf(1) >= 0
                // ||
                // (roll.lastIndexOf(5) > roll.indexOf(5))
              ) {
                badgeVariant = 'default'
                successfulRolls++
              }
              return (
                <Badge
                  key={index}
                  variant={badgeVariant}
                  className="m-0.5"
                >
                  {roll[0]}
                  {roll[1]}
                  {roll[2]}
                  {roll[3]}
                  {roll[4]}
                </Badge>
              )
            })}
          </CardContent>
        </Card>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold">{successfulRolls}/7776</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground">{Math.floor((successfulRolls / 7776) * 100)}%</h2>
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
