import React from 'react'
import clsx from 'clsx'

const VARIANTS = {
  default: 'badge-default',
  info: 'badge-info',
  success: 'badge-success',
}

const Badge = ({ children, variant = 'default', className = '' }) => {
  return (
    <span className={clsx('badge-pill ml-2', VARIANTS[variant], className)}>
      {children}
    </span>
  )
}

export default Badge
