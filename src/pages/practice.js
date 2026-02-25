import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Alert, AlertDescription } from '../components/ui/alert'

const PracticePage = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Integrate with email service (Mailchimp, ConvertKit, etc.)
    console.log('Email signup:', email)
    setSubmitted(true)
    setEmail('')
  }
  
  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Coming Soon
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground">Practice Mode</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn Refusal Dice by playing against AI opponents in a simulated game environment
          </p>
        </div>
        
        {/* Feature Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">What is Practice Mode?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Practice Mode will let you play full games of Refusal Dice against 2-4 computer-controlled 
              opponents. This is the perfect way to learn the game mechanics, understand call/refusal 
              dynamics, and build confidence before playing with friends.
            </p>
            
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold mb-3 text-lg">Planned Features:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-uncommon-foreground text-xl">✓</span>
                  <div>
                    <strong>2 vs 4 Player Modes</strong>
                    <p className="text-sm text-muted-foreground">
                      Learn the unique 2-player rules or practice with a full 4-player table
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-uncommon-foreground text-xl">✓</span>
                  <div>
                    <strong>AI Decision Explanations</strong>
                    <p className="text-sm text-muted-foreground">
                      See why AI opponents make specific calls, accepts, or refusals
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-uncommon-foreground text-xl">✓</span>
                  <div>
                    <strong>Step-by-Step Tutorials</strong>
                    <p className="text-sm text-muted-foreground">
                      Pause at key decision points to understand strategy before proceeding
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-uncommon-foreground text-xl">✓</span>
                  <div>
                    <strong>Difficulty Levels</strong>
                    <p className="text-sm text-muted-foreground">
                      Start with beginner AI that makes simple calls, progress to expert opponents
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-uncommon-foreground text-xl">✓</span>
                  <div>
                    <strong>Game History & Analysis</strong>
                    <p className="text-sm text-muted-foreground">
                      Review past rounds to see where you could have made better calls
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* Email Signup */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Get Notified When Practice Mode Launches</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <Alert className="bg-uncommon/20 border-uncommon-border">
                <AlertDescription className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <span>Thanks! We'll email you when Practice Mode is ready.</span>
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Be the first to know when we launch Practice Mode. We'll send you one email when it's ready—no spam!
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" className="sm:w-auto">
                    Notify Me
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        
        {/* In the Meantime */}
        <div className="bg-muted/30 rounded-lg p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-4">In the Meantime...</h2>
          <p className="text-muted-foreground mb-6">
            While we build Practice Mode, you can still learn and improve your game with these resources:
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/rules">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">📚 Rules</span>
                <span className="text-xs text-muted-foreground">Full rules, examples, and variations</span>
              </Button>
            </Link>
            
            <Link to="/strategy-assistant">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">🎯 Strategy Assistant</span>
                <span className="text-xs text-muted-foreground">Get real-time call recommendations</span>
              </Button>
            </Link>
            
            <Link to="/games">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">🎲 Game Reference</span>
                <span className="text-xs text-muted-foreground">Study all 10 callable games</span>
              </Button>
            </Link>
            
            <Link to="/strategy-assistant">
              <Button variant="outline" className="w-full h-auto py-4 px-4 text-left flex flex-col items-start">
                <span className="text-base font-semibold mb-1">🧠 Advanced Strategies</span>
                <span className="text-xs text-muted-foreground">Deep-dive into expert tactics</span>
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Back to home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Link>
        </div>
      </section>
    </Layout>
  )
}

export default PracticePage
