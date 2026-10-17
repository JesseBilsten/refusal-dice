import React from 'react'
import { cn } from '../../lib/utils'

/**
 * The table: green felt inside a wood rail. Seats (or anything played at
 * the table) go inside. The home page's story and Play both sit on it.
 */
export default function TableFelt({ className, children, ...props }) {
  return (
    <div
      className={cn('table-felt relative overflow-hidden rounded-[2rem] p-4 shadow-xl sm:p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}
