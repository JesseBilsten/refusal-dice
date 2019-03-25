import React, { Component } from 'react'
import './style.scss'

class Odds extends Component {
  render() {
    const props = this.props
    let badgeType = 'light'
    let percentage = 0

    switch (props.game) {
      case '10-2':
        percentage = 49.07
        break
      case '10-3':
        percentage = 53.43
        break
      case '10-4':
        percentage = 22.25
        break
      case 'ship, captain, crew':
        percentage = 32.64
        break
      case 'monterey':
        percentage = 25.46
        break
      case 'vegas':
        percentage = 32.41
        break
      case 'pairs':
        percentage = 29.01
        break
    }

    return (
      <div className="d-flex">
				{props.label}
        <div
          className="progress mx-2 flex-grow-1 align-self-center"
          style={{
            height: '4px',
          }}
        >
          <div
            className="progress-bar"
            style={{
              width: '' + percentage + '%',
            }}
          />
        </div>
				{percentage}%
      </div>
    )
  }
}

export default Odds
