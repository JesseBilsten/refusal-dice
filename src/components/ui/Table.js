import React from 'react'
import clsx from 'clsx'

export default function Table({
  children,
  className = '',
  striped = false,
  compact = false,
  wrapperClass = '',
  ...props
}) {
  const base = 'min-w-full bg-card divide-y divide-gray-200 shadow-sm rounded'
  const compactClass = compact ? 'text-sm' : 'text-base'
  const tableClass = clsx(base, compactClass, className, {
    'table-striped': striped,
    'table-compact': compact,
    'table-hover': true,
  })

  return (
    <div className={clsx('overflow-x-auto w-full', wrapperClass)}>
      <table className={tableClass} role={props.role || 'table'} {...props}>
        {children}
      </table>
    </div>
  )
}
