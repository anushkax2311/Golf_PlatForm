import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../utils/api'
import './HomePage.css'

export default function HomePage() {
  const [charities, setCharities] = useState([])

  useEffect(() => {
    api.get('/charities?featured=true').then(r => setCharities(r.data.charities?.slice(0, 3) || [])).catch(() => {})
  }, [])

  return (
    <div className="home page-enter">
      <section className="hero">
        <div className="hero-bg-orb orb-1" />
        <div className="hero-bg-orb orb-2" />
        <div className="container">
          <div className="hero-tag"><span className="dot-live" /> Monthly draws now live</div>
          <h1 className="hero-title">
            Play Golf.<br />
            <span className="hero-accent">Win Prizes.</span><br />
            Change Lives.
          </h1>
          <p className="hero-sub">
            Enter your Stableford scores each month. Win from prize pools funded by subscribers.
            A portion of every subscription goes directly to a charity you choose.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Start Playing →</Link>
            <Link to="/draws" className="btn btn-secondary btn-lg">How It Works</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="stat-number">£40K+</div><div className="stat-label">Prize Pool This Year</div></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><div className="stat-number">12</div><div className="stat-label">Charities Supported</div></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><div className="stat-number">2.4K</div><div className="stat-label">Active Members</div></div>
          </div>
        </div>
      </section>

      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">How It Works</div>
            <h2 className="section-title">Three steps to playing for good</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Subscribe</h3>
              <p>Choose monthly or yearly. Part of every payment funds the prize pool and your chosen charity.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Enter Your Scores</h3>
              <p>Log up to 5 Stableford scores (1–45). These become your draw entries — your real game decides your fate.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>Win & Give</h3>
              <p>5 numbers drawn monthly. Match 3, 4, or 5 to win. Your charity gets your contribution automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section prizes">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Prize Structure</div>
            <h2 className="section-title">Three ways to win every month</h2>
          </div>
          <div className="prize-tiers">
            <div className="prize-tier tier-jackpot">
              <div className="tier-badge">Jackpot 🏆</div>
              <div className="tier-match">5-Number Match</div>
              <div className="tier-pool">40% of Pool</div>
              <div className="tier-note">Rolls over if unclaimed</div>
            </div>
            <div className="prize-tier tier-second">
              <div className="tier-match">4-Number Match</div>
              <div className="tier-pool">35% of Pool</div>
              <div className="tier-note">Split among all winners</div>
            </div>
            <div className="prize-tier tier-third">
              <div className="tier-match">3-Number Match</div>
              <div className="tier-pool">25% of Pool</div>
              <div className="tier-note">Split among all winners</div>
            </div>
          </div>
        </div>
      </section>

      {charities.length > 0 && (
        <section className="section charities-preview">
          <div className="container">
            <div className="section-header">
              <div className="section-tag">Impact</div>
              <h2 className="section-title">Your subscription makes a difference</h2>
              <p className="section-sub">10%+ of every subscription goes directly to your chosen charity.</p>
            </div>
            <div className="grid-3">
              {charities.map(c => (
                <Link to={`/charities/${c.slug}`} key={c._id} className="card card-hover charity-card">
                  <h3>{c.name}</h3>
                  <p>{c.shortDescription || c.description?.slice(0, 100)}</p>
                  <span className="charity-cat badge">{c.category}</span>
                </Link>
              ))}
            </div>
            <div style={{textAlign:'center',marginTop:32}}>
              <Link to="/charities" className="btn btn-secondary">View All Charities →</Link>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <h2>Ready to play for good?</h2>
            <p>Join thousands of golfers winning prizes and changing lives at the same time.</p>
            <Link to="/register" className="btn btn-primary btn-lg">Create Your Account →</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
