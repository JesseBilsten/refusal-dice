import React, { Component } from 'react'
import './style.scss'

class Die extends Component {
  render() {
    const props = this.props
    const dieSize = 2

    return (
      <div
        style={{
          background: 'white'
        }}
        className="die pip" data-content={props.number}>
        {props.number}
      </div>
    )
  }
}

export default Die
