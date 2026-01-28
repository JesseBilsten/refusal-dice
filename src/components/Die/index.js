import React, { Component } from 'react'
import './style.css'

class Die extends Component {
  render() {
    const props = this.props
    const inlineClass = props.inline ? ' inline' : ''
    const optionClass = props.option ? ` option${props.option}` : ''

    return (
      <div className={`die pips${inlineClass}${optionClass}`} data-content={props.number}>
      </div>
    )
  }
}

export default Die
