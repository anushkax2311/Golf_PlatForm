import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import './CharitiesPage.css'

const CATEGORIES = ['all','health','education','environment','community','sports','animals','arts','other']

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (cat !== 'all') params.set('category', cat)
    api.get(`/charities?${params}`).then(r => setCharities(r.data.charities || [])).finally(() => setLoading(false))
  }, [search, cat])

  return (
    <div className="charities-page page-enter">
      <div className="container">
        <div className="charities-header">
          <div className="section-tag">Our Charities</div>
          <h1>Play for a cause you believe in</h1>
          <p>Every subscription contributes at least 10% to your chosen charity. Pick one that matters to you.</p>
        </div>
        <div className="charities-filters">
          <input className="input" placeholder="Search charities…" value={search}
            onChange={e => setSearch(e.target.value)} style={{maxWidth:320}} />
          <div className="cat-tabs">
            {CATEGORIES.map(c => (
              <button key={c} className={`tab ${cat===c?'active':''}`} onClick={() => setCat(c)}>
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase()+c.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{textAlign:'center',padding:64}}><span className="spinner" /></div>
        ) : charities.length === 0 ? (
          <div className="empty-state"><div className="icon">🔍</div><p>No charities found</p></div>
        ) : (
          <div className="charities-grid">
            {charities.map(c => (
              <Link to={`/charities/${c.slug}`} key={c._id} className="card card-hover charity-list-card">
                {c.isFeatured && <span className="featured-badge">Featured</span>}
                <div className="charity-info">
                  <h3>{c.name}</h3>
                  <p>{c.shortDescription || c.description?.slice(0, 120)}…</p>
                  <div className="charity-meta">
                    <span className="badge" style={{background:'var(--charity-dim)',color:'var(--charity)'}}>{c.category}</span>
                    {c.subscriberCount > 0 && <span className="sub-count">{c.subscriberCount} supporters</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
