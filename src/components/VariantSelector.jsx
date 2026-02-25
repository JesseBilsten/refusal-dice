import React from 'react'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'

/**
 * VariantSelector - Toggle group for All/High/Low variants
 * Controlled mode: parent manages selectedVariant and onChange
 *
 * @param {string} selectedVariant - 'all', 'high', or 'low'
 * @param {function} onChange - callback when variant changes
 * @param {string} className - optional styling
 */
const VariantSelector = ({ selectedVariant = 'all', onChange, className = '' }) => {
  return (
    <ToggleGroup
      type="single"
      value={selectedVariant}
      onValueChange={onChange}
      className={className}
    >
      <ToggleGroupItem value="all">All</ToggleGroupItem>
      <ToggleGroupItem value="high">High</ToggleGroupItem>
      <ToggleGroupItem value="low">Low</ToggleGroupItem>
    </ToggleGroup>
  )
}

export default VariantSelector
