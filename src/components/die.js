import React, { Component } from 'react'

class Die extends Component {
  render() {
    const props = this.props
    const dieSize = 2

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: dieSize/6 + 'rem',
          width: dieSize + 'rem',
          height: dieSize + 'rem',
          borderRadius: dieSize/8 + 'rem',
          border: '0.05rem black solid',
          background: 'white'
        }}
        className="die pip" data-content={props.number}>
        {props.number}
      </div>
    )
  }
}

export default Die
