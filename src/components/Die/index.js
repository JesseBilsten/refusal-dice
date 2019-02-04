import React, { Component } from 'react'
import './style.scss'

class Die extends Component {
  render() {
    const props = this.props
    const dieSize = 2

    return (
      <div className="die pips" data-content={props.number}>
      </div>
    )
  }
}

export default Die
