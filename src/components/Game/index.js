import React, { Component } from 'react'
import './style.css'

class Game extends Component {
  render() {
    const props = this.props

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
