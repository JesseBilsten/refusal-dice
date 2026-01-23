import React from 'react'
import clsx from 'clsx'

const VARIANT_MAP = {
  default: 'bg-surface text-surface-foreground',
  success: 'bg-success-surface text-success-foreground',
  info: 'bg-info-surface text-info-foreground',
  danger: 'bg-danger-surface text-danger-foreground',
}

const Alert = ({ children, variant = 'default', className, role = 'status' }) => {
  const classes = clsx('rounded-lg p-4', VARIANT_MAP[variant] || VARIANT_MAP.default, className)
  return (
    <div className={classes} role={role}>
      {children}
    </div>
  )
}

export default Alert
