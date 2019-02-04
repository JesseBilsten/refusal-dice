import React, { Component } from 'react'
import './style.scss'

class Game extends Component {
  render() {
    const props = this.props
    var strength = ''

    if (props.type === 'high' || props.type === 'low') {
      strength = ''
    }

    return (
			<div className="game">
				<div className="roll">
					{props.children}
				</div>
				<p className="label">
					{props.type}
				</p>
			</div>
    )
  }
}

export default Game
