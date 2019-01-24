import React from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'

export default () => (
  <Layout>
    <section className="container mt-5">
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-heading">In progress</h4>
        <p>
          I'm working on pulling in the brute force odds formulas I created a
          while back so at the moment this data is incomplete and may need to be
          checked for errors.
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
      <table className="table">
        <thead>
          <tr>
            <th>Game</th>
            <th>1st Roll</th>
            <th>2nd Roll</th>
            <th>3rd Roll</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Link to="/games#10-2">10-2</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: '49.07%' }}
                  aria-valuenow="49.07"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  49.07%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
          <tr>
            <td>
              <Link to="/games#10-3">10-3</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: '53.43%' }}
                  aria-valuenow="53.43"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  53.43%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
          <tr>
            <td>
              <Link to="/games#10-4">10-4</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-danger"
                  role="progressbar"
                  style={{ width: '22.25%' }}
                  aria-valuenow="22.25"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  22.25%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
          <tr>
            <td>
              <Link to="/games#ship-captain-crew">Ship, Captain, Crew</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: '31.64%' }}
                  aria-valuenow="31.64"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  31.64%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
          <tr>
            <td>
              <Link to="/games#monterey">Monterey</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-danger"
                  role="progressbar"
                  style={{ width: '25.46%' }}
                  aria-valuenow="25.46"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  25.46%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
          <tr>
            <td>
              <Link to="/games#vegas">Vegas</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: '32.41%' }}
                  aria-valuenow="32.41"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  32.41%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
          <tr>
            <td>
              <Link to="/games#pairs">Pairs</Link>
            </td>
            <td>
              <div className="progress">
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{ width: '29.01%' }}
                  aria-valuenow="29.01"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  29.01%
                </div>
              </div>
            </td>
            <td />
            <td />
          </tr>
        </tbody>
      </table>
      <table className="table">
        <thead>
          <th />
          <th>1 six</th>
          <th>2 sixes</th>
          <th>3 sixes</th>
          <th>4 sixes</th>
          <th>5 sixes</th>
        </thead>
        <tbody>
          <tr>
            <th>
              <Link to="/games#razzle">Razzle</Link>
            </th>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <table className="table">
        <thead>
          <th />
          <th>1 pair</th>
          <th>2 pair</th>
          <th>3 of a kind</th>
          <th>full house</th>
          <th>4 of a kind</th>
          <th>5 of a kind</th>
        </thead>
        <tbody>
          <tr>
            <th>
              <Link to="games#boss">Boss</Link>
            </th>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <table className="table">
        <thead>
          <th />
          <th>0 points</th>
          <th>1 point</th>
          <th>2 points</th>
          <th>3 points</th>
          <th>4 points</th>
        </thead>
        <tbody>
          <tr>
            <th>
              <Link to="games#tres-away">Tres Away</Link>
            </th>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </section>
  </Layout>
)
