import React, { useState, useEffect } from 'react'
import './style.css'

/**
 * AnimatedDie - A die component with rolling animation
 * Supports auto-rolling with customizable delay and duration
 */
const AnimatedDie = ({ 
  value, 
  isRolling = false,
  onRollComplete = null,
  size = 'normal', // 'small', 'normal', 'large'
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true)
      
      // Rapid number changes during roll animation
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1)
      }, 80)
      
      // Stop after 600ms and show final value
      const timeout = setTimeout(() => {
        clearInterval(interval)
        setDisplayValue(value)
        setIsAnimating(false)
        
        if (onRollComplete) {
          onRollComplete()
        }
      }, 600)
      
      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    } else {
      setDisplayValue(value)
    }
  }, [isRolling, value, onRollComplete])
  
  const sizeClasses = {
    small: 'w-10 h-10 text-sm',
    normal: 'w-16 h-16 text-base',
    large: 'w-20 h-20 text-lg'
  }
  
  return (
    <div 
      className={`die pips ${sizeClasses[size]} ${isAnimating ? 'animate-roll' : ''} ${className}`}
      data-content={displayValue}
      role="img"
      aria-label={`Die showing ${displayValue}`}
    />
  )
}

export default AnimatedDie
