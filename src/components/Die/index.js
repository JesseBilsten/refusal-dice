import React, { Component } from 'react'
import './style.scss'

class Die extends Component {
  render() {
    const props = this.props
    const dieSize = 2
		if (props.size) { dieSize = props.size }

    return (
      <div className="die pips" data-content={props.number}>
      </div>
    )
  }
}

export default Die
