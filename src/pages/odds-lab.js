import React, { useEffect, useState } from 'react'
import Layout from '../components/layout'
import Page, { PageHeader, PageTabs, NextStep } from '../components/Page'
import KeepAdvisor from '../components/OddsLab/KeepAdvisor'
import GameOdds from '../components/OddsLab/GameOdds'
import RollBuilder from '../components/OddsLab/RollBuilder'

/**
 * ODDS LAB: what to keep, every game's odds, and any roll you can describe
 * (components/OddsLab/).
 */

const TABS = [
  { id: 'keep', label: 'What should I keep?' },
  { id: 'games', label: 'Every game’s odds' },
  { id: 'build', label: 'Build any roll' },
]

const OddsLabPage = () => {
  // Shared links with a query open the builder; everything else starts with "what should I keep?"
  const [tab, setTab] = useState(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const asked = params.get('tab')
    setTab(params.get('q') ? 'build' : TABS.some((t) => t.id === asked) ? asked : 'keep')
  }, [])

  const choose = (id) => {
    window.history.replaceState(null, '', `${window.location.pathname}?tab=${id}`)
    setTab(id)
  }

  return (
    <Layout>
      <Page width="tool">
        <PageHeader
          title="Odds Lab"
          description="Answer your own questions with exact odds: what to keep from a roll, how often each game comes up, or how often any roll you can describe happens."
        />
        {tab && <PageTabs tabs={TABS} value={tab} onChange={choose} label="Odds Lab tools" />}
        {tab === 'keep' && <KeepAdvisor />}
        {tab === 'games' && <GameOdds />}
        {tab === 'build' && <RollBuilder />}
        <NextStep to="/strategy-assistant" title="Your roll, your seat: the Strategy Assistant" text="What to call as the Hammer, and whether to accept or refuse, simulated for your exact roll." />
      </Page>
    </Layout>
  )
}

export default OddsLabPage
