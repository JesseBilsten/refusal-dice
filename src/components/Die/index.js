import React, { Component } from 'react'
import './style.css'

class Die extends Component {
  render() {
    const props = this.props
    // Backward compatibility: inline maps to 'sm' size
    const size = props.size || (props.inline ? 'sm' : 'md')
    const sizeClass = ` size-${size}`
    const optionClass = props.option ? ` option${props.option}` : ''

    return (
      <div 
        className={`die pips${sizeClass}${optionClass}`} 
        data-content={props.number}
        aria-label={`Die showing ${props.number}`}
      >
      </div>
    )
  }
}

export default Die
