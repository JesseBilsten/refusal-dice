import React, { Component } from 'react'

class Game extends Component {
  render() {
    const props = this.props
    var backgroundColor = 'grey'

    if (props.type === 'high') {
      backgroundColor = 'green'
    }

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'left',
          borderRadius: '0.5rem 0.5rem 0.5rem 0rem',
          background: backgroundColor,
        }}
        className={props.className}
      >
        {props.children}
        <div style={{
          position: 'absolute',
          bottom: '-1.2rem',
          borderRadius: '0 0 0.5rem 0.5rem',
          background: backgroundColor,
          padding: '0.2rem 0.4rem',
          color: 'white',
          textShadow: '1px 1px 0px rgba(0, 0, 0, 0.8)',
          fontSize: '0.6rem'
        }}>{props.type}</div>
      </div>
    )
  }
}

export default Game
