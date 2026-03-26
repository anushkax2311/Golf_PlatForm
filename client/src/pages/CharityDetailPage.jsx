import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function CharityDetailPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [pct, setPct] = useState(10)

  useEffect(() => {
    api.get(`/charities/${slug}`).then(r => setCharity(r.data.charity)).catch(() => navigate('/charities')).finally(() => setLoading(false))
  }, [slug])

  const select = async () => {
    if (!user) { navigate('/register'); return }
    setSelecting(true)
    try {
      await api.put(`/charities/select/${charity._id}`, { contributionPercent: pct })
      toast.success(`${charity.name} selected as your charity!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error selecting charity')
    } finally {
      setSelecting(false)
    }
  }

  if (loading) return <div style={{textAlign:'center',padding:80}}><span className="spinner" /></div>
  if (!charity) return null

  return (
    <div className="page-enter" style={{padding:'60px 0'}}>
      <div className="container-narrow">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/charities')} style={{marginBottom:24}}>← Back to Charities</button>
        <div className="card" style={{marginBottom:24}}>
          {charity.isFeatured && <span className="badge badge-active" style={{marginBottom:16}}>Featured Charity</span>}
          <h1 style={{fontFamily:'var(--font-display)',fontSize:'clamp(28px,4vw,40px)',fontWeight:800,letterSpacing:'-0.02em',marginBottom:12}}>{charity.name}</h1>
          <span className="badge" style={{background:'var(--charity-dim)',color:'var(--charity)',marginBottom:20}}>{charity.category}</span>
          <p style={{color:'var(--text-2)',lineHeight:1.7,fontSize:16,marginBottom:24}}>{charity.description}</p>
          {charity.website && <a href={charity.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{marginBottom:8}}>Visit Website ↗</a>}
        </div>

        {charity.events?.length > 0 && (
          <div className="card" style={{marginBottom:24}}>
            <h2 style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:16}}>Upcoming Events</h2>
            {charity.events.map((ev, i) => (
              <div key={i} style={{padding:'16px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontWeight:600,marginBottom:4}}>{ev.title}</div>
                <div style={{color:'var(--text-2)',fontSize:14}}>{new Date(ev.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
                {ev.location && <div style={{color:'var(--text-3)',fontSize:13}}>{ev.location}</div>}
                {ev.description && <div style={{color:'var(--text-2)',fontSize:14,marginTop:6}}>{ev.description}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{background:'linear-gradient(135deg,rgba(66,197,245,0.06) 0%,var(--bg-1) 100%)',borderColor:'rgba(66,197,245,0.2)'}}>
          <h2 style={{fontFamily:'var(--font-display)',fontWeight:700,marginBottom:8}}>Support this charity</h2>
          <p style={{color:'var(--text-2)',marginBottom:20,fontSize:15}}>Choose what percentage of your subscription goes to {charity.name}. Minimum 10%.</p>
          <div className="input-group" style={{marginBottom:20}}>
            <label className="label">Contribution: <strong style={{color:'var(--accent)'}}>{pct}%</strong></label>
            <input type="range" min={10} max={100} step={5} value={pct} onChange={e => setPct(Number(e.target.value))}
              style={{width:'100%',accentColor:'var(--accent)'}} />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)',marginTop:4}}><span>10% (min)</span><span>100%</span></div>
          </div>
          <button className="btn btn-primary" onClick={select} disabled={selecting} style={{width:'100%'}}>
            {selecting ? <span className="spinner" /> : user ? `Select & Give ${pct}% →` : 'Sign Up to Support →'}
          </button>
        </div>
      </div>
    </div>
  )
}
