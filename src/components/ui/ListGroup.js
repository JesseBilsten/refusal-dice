import React from 'react'

const ListGroup = ({ children, className = '' }) => (
  <ul className={`space-y-2 ${className}`}>{children}</ul>
)

export const ListGroupItem = ({ children }) => (
  <li className="text-sm">{children}</li>
)

export default ListGroup
