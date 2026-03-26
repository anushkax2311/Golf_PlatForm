import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import './PricingPage.css'

export default function PricingPage() {
  const { user, isSubscribed } = useAuth()
  const [loading, setLoading] = useState('')

  const subscribe = async (plan) => {
    if (!user) { window.location.href = '/register'; return }
    setLoading(plan)
    try {
      const { data } = await api.post('/payments/create-checkout', { plan })
      window.location.href = data.url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment error')
    } finally {
      setLoading('')
    }
  }

  const manageSubscription = async () => {
    setLoading('portal')
    try {
      const { data } = await api.post('/payments/portal')
      window.location.href = data.url
    } catch (err) {
      toast.error('Could not open billing portal')
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="pricing-page page-enter">
      <div className="container">
        <div className="pricing-header">
          <div className="section-tag">Pricing</div>
          <h1>Simple, transparent pricing</h1>
          <p>Every plan includes full access to draws, score tracking, and charity contributions.</p>
        </div>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="plan-name">Monthly</div>
            <div className="plan-price"><span className="price-amount">£9.99</span><span className="price-period">/month</span></div>
            <ul className="plan-features">
              <li>✓ Monthly prize draw entry</li>
              <li>✓ 5-score Stableford tracker</li>
              <li>✓ Choose your charity</li>
              <li>✓ Min 10% goes to charity</li>
              <li>✓ Winner dashboard</li>
            </ul>
            {isSubscribed ? (
              <button className="btn btn-secondary" style={{width:'100%'}} onClick={manageSubscription} disabled={loading==='portal'}>
                {loading==='portal' ? <span className="spinner"/> : 'Manage Subscription'}
              </button>
            ) : (
              <button className="btn btn-secondary" style={{width:'100%'}} onClick={() => subscribe('monthly')} disabled={!!loading}>
                {loading==='monthly' ? <span className="spinner"/> : 'Subscribe Monthly'}
              </button>
            )}
          </div>

          <div className="pricing-card featured">
            <div className="plan-badge">Best Value</div>
            <div className="plan-name">Yearly</div>
            <div className="plan-price"><span className="price-amount">£89.99</span><span className="price-period">/year</span></div>
            <div className="plan-saving">Save £30 vs monthly</div>
            <ul className="plan-features">
              <li>✓ Everything in Monthly</li>
              <li>✓ 2 months free</li>
              <li>✓ Priority winner verification</li>
              <li>✓ Yearly impact report</li>
            </ul>
            {isSubscribed ? (
              <button className="btn btn-secondary" style={{width:'100%'}} onClick={manageSubscription} disabled={loading==='portal'}>
                {loading==='portal' ? <span className="spinner"/> : 'Manage Subscription'}
              </button>
            ) : (
              <button className="btn btn-primary" style={{width:'100%'}} onClick={() => subscribe('yearly')} disabled={!!loading}>
                {loading==='yearly' ? <span className="spinner"/> : 'Subscribe Yearly →'}
              </button>
            )}
          </div>
        </div>

        <div className="prize-breakdown">
          <h2>Where your money goes</h2>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <div className="breakdown-pct" style={{color:'var(--gold)'}}>40%</div>
              <div className="breakdown-label">Prize Pool</div>
              <div className="breakdown-note">5/4/3-match draws</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-pct" style={{color:'var(--charity)'}}>10%+</div>
              <div className="breakdown-label">Charity</div>
              <div className="breakdown-note">Your chosen cause</div>
            </div>
            <div className="breakdown-item">
              <div className="breakdown-pct">50%</div>
              <div className="breakdown-label">Platform</div>
              <div className="breakdown-note">Operations & growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
