import React from 'react'
import DocPage from '../design-system/DocPage'

/** /design/<id>/: one page of the design system (src/design-system/registry.js) */
const DesignDocTemplate = ({ pageContext }) => <DocPage id={pageContext.id} />

export default DesignDocTemplate
