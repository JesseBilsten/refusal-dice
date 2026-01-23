import React from 'react'
import clsx from 'clsx'

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'
  const variants = {
    primary: 'btn-primary focus:ring-blue-500',
    secondary: 'bg-muted-surface text-muted-foreground hover:shadow-sm focus:ring-muted-surface',
  }
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}
