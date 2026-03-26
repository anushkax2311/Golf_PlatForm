import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import './DashboardPage.css'

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DashboardPage() {
  const { user, refreshUser, isSubscribed } = useAuth()
  const [tab, setTab] = useState('overview')
  const [scores, setScores] = useState([])
  const [currentDraw, setCurrentDraw] = useState(null)
  const [winnings, setWinnings] = useState([])
  const [totalWon, setTotalWon] = useState(0)
  const [newScore, setNewScore] = useState({ value: '', date: new Date().toISOString().split('T')[0] })
  const [editingScore, setEditingScore] = useState(null)
  const [loading, setLoading] = useState({})
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', country: user?.country || '', handicap: user?.handicap || '' })

  useEffect(() => {
    loadData()
  }, [isSubscribed])

  const loadData = async () => {
    try {
      if (isSubscribed) {
        const [sc, win, draw] = await Promise.all([
          api.get('/scores'),
          api.get('/winners/my-winnings'),
          api.get('/draws/current')
        ])
        setScores(sc.data.scores || [])
        setWinnings(win.data.winnings || [])
        setTotalWon(win.data.totalWon || 0)
        setCurrentDraw(draw.data.draw)
      }
    } catch {}
  }

  const addScore = async () => {
    if (!newScore.value) return toast.error('Enter a score')
    setLoading(l => ({...l, addScore: true}))
    try {
      const { data } = await api.post('/scores', newScore)
      setScores(data.scores)
      setNewScore({ value: '', date: new Date().toISOString().split('T')[0] })
      toast.success('Score added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    } finally {
      setLoading(l => ({...l, addScore: false}))
    }
  }

  const saveEdit = async (scoreId) => {
    setLoading(l => ({...l, [scoreId]: true}))
    try {
      const { data } = await api.put(`/scores/${scoreId}`, editingScore)
      setScores(data.scores)
      setEditingScore(null)
      toast.success('Score updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    } finally {
      setLoading(l => ({...l, [scoreId]: false}))
    }
  }

  const deleteScore = async (scoreId) => {
    if (!confirm('Delete this score?')) return
    try {
      const { data } = await api.delete(`/scores/${scoreId}`)
      setScores(data.scores)
      toast.success('Score removed')
    } catch { toast.error('Error') }
  }

  const submitProof = async (drawId) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const formData = new FormData()
      formData.append('proof', file)
      try {
        await api.post(`/winners/proof/${drawId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Proof submitted for review!')
        loadData()
      } catch { toast.error('Upload failed') }
    }
    input.click()
  }

  const saveProfile = async () => {
    setLoading(l => ({...l, profile: true}))
    try {
      await api.put('/users/profile', profile)
      await refreshUser()
      toast.success('Profile updated!')
    } catch { toast.error('Error saving profile') }
    finally { setLoading(l => ({...l, profile: false})) }
  }

  const openPortal = async () => {
    try {
      const { data } = await api.post('/payments/portal')
      window.location.href = data.url
    } catch { toast.error('Could not open billing portal') }
  }

  const subStatus = user?.subscription?.status
  const subEnd = user?.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-GB') : '—'

  return (
    <div className="dashboard page-enter">
      <div className="container">
        <div className="dash-header">
          <div>
            <h1>Hey, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="dash-sub">{isSubscribed ? 'You\'re in the draw this month.' : 'Subscribe to enter the monthly draw.'}</p>
          </div>
          {!isSubscribed && <Link to="/pricing" className="btn btn-primary">Subscribe Now →</Link>}
        </div>

        {/* Stats row */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="stat-label">Subscription</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span className={`badge badge-${subStatus || 'inactive'}`}>{subStatus || 'inactive'}</span>
              {subStatus === 'active' && <span style={{fontSize:12,color:'var(--text-3)'}}>renews {subEnd}</span>}
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="stat-label">Scores Logged</div>
            <div className="stat-value">{scores.length} / 5</div>
          </div>
          <div className="dash-stat-card">
            <div className="stat-label">Total Won</div>
            <div className="stat-value gold">£{totalWon.toLocaleString()}</div>
          </div>
          <div className="dash-stat-card">
            <div className="stat-label">Charity</div>
            <div style={{fontSize:14,fontWeight:500}}>{user?.selectedCharity?.name || <Link to="/charities" style={{color:'var(--accent)'}}>Select one →</Link>}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{marginBottom:32}}>
          {['overview','scores','winnings','profile'].map(t => (
            <button key={t} className={`tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="tab-content">
            {currentDraw && (
              <div className="card" style={{marginBottom:24}}>
                <h2 className="card-title">This Month's Draw — {MONTHS[currentDraw.month]} {currentDraw.year}</h2>
                <div style={{display:'flex',gap:24,flexWrap:'wrap',marginTop:16}}>
                  <div className="mini-stat"><div className="stat-label">Prize Pool</div><div>£{(currentDraw.prizePool?.total||0).toLocaleString()}</div></div>
                  <div className="mini-stat"><div className="stat-label">Jackpot</div><div style={{color:'var(--gold)'}}>£{((currentDraw.prizePool?.fiveMatch||0)+(currentDraw.jackpotRolledOver||0)).toLocaleString()}</div></div>
                  <div className="mini-stat"><div className="stat-label">Status</div><div className={`badge ${currentDraw.status==='published'?'badge-active':'badge-pending'}`}>{currentDraw.status}</div></div>
                </div>
                {currentDraw.status === 'published' && (
                  <div style={{marginTop:20}}>
                    <div className="stat-label" style={{marginBottom:8}}>Winning Numbers</div>
                    <div style={{display:'flex',gap:8}}>
                      {currentDraw.winningNumbers?.map(n => (
                        <div key={n} className={`draw-number ${scores.some(s=>s.value===n)?'matched':''}`}>{n}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="card">
              <h2 className="card-title">Your Scores (Draw Entries)</h2>
              {scores.length === 0 ? (
                <p style={{color:'var(--text-2)',marginTop:12}}>No scores yet. {isSubscribed ? 'Add your first score →' : 'Subscribe to add scores.'}</p>
              ) : (
                <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:16}}>
                  {scores.map(s => (
                    <div key={s._id} className="draw-number">{s.value}</div>
                  ))}
                </div>
              )}
              {isSubscribed && <button className="btn btn-secondary btn-sm" style={{marginTop:16}} onClick={() => setTab('scores')}>Manage Scores →</button>}
            </div>
          </div>
        )}

        {/* SCORES TAB */}
        {tab === 'scores' && (
          <div className="tab-content">
            {!isSubscribed ? (
              <div className="empty-state"><p>Subscribe to track and enter scores.</p><Link to="/pricing" className="btn btn-primary" style={{marginTop:16}}>Subscribe Now</Link></div>
            ) : (
              <>
                <div className="card" style={{marginBottom:24}}>
                  <h2 className="card-title">Add New Score</h2>
                  <p style={{color:'var(--text-2)',fontSize:14,marginBottom:16}}>Enter your latest Stableford score (1–45). Your 5 most recent scores are used as draw entries. The oldest is replaced when you add a 6th.</p>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    <div className="input-group" style={{flex:'0 0 100px'}}>
                      <label className="label">Score (1-45)</label>
                      <input className="input" type="number" min={1} max={45} value={newScore.value}
                        onChange={e => setNewScore(s => ({...s, value: e.target.value}))} placeholder="e.g. 32" />
                    </div>
                    <div className="input-group" style={{flex:'0 0 160px'}}>
                      <label className="label">Date Played</label>
                      <input className="input" type="date" value={newScore.date}
                        onChange={e => setNewScore(s => ({...s, date: e.target.value}))} />
                    </div>
                    <div style={{display:'flex',alignItems:'flex-end'}}>
                      <button className="btn btn-primary" onClick={addScore} disabled={loading.addScore}>
                        {loading.addScore ? <span className="spinner"/> : 'Add Score'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 className="card-title">Your Scores ({scores.length}/5)</h2>
                  {scores.length === 0 ? (
                    <p style={{color:'var(--text-2)',marginTop:12}}>No scores yet. Add your first one above.</p>
                  ) : (
                    <div className="scores-list">
                      {scores.map(s => (
                        <div key={s._id} className="score-row">
                          {editingScore?._id === s._id ? (
                            <>
                              <input className="input" type="number" min={1} max={45} value={editingScore.value}
                                onChange={e => setEditingScore(es => ({...es, value: e.target.value}))} style={{width:80}} />
                              <input className="input" type="date" value={editingScore.date?.split('T')[0]}
                                onChange={e => setEditingScore(es => ({...es, date: e.target.value}))} style={{width:160}} />
                              <button className="btn btn-primary btn-sm" onClick={() => saveEdit(s._id)} disabled={loading[s._id]}>Save</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingScore(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <div className="draw-number" style={{width:44,height:44,fontSize:16}}>{s.value}</div>
                              <div>
                                <div style={{fontWeight:500}}>Score: {s.value}</div>
                                <div style={{fontSize:13,color:'var(--text-3)'}}>{new Date(s.date).toLocaleDateString('en-GB')}</div>
                              </div>
                              <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingScore({...s, date: s.date.split('T')[0]})}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => deleteScore(s._id)}>Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* WINNINGS TAB */}
        {tab === 'winnings' && (
          <div className="tab-content">
            <div className="card" style={{marginBottom:24}}>
              <h2 className="card-title">Total Winnings: <span style={{color:'var(--gold)'}}>£{totalWon.toLocaleString()}</span></h2>
            </div>
            {winnings.length === 0 ? (
              <div className="empty-state"><div className="icon">🏆</div><p>No winnings yet — keep entering scores!</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Month</th><th>Match</th><th>Prize</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {winnings.map((w, i) => (
                      <tr key={i}>
                        <td>{MONTHS[w.drawMonth]} {w.drawYear}</td>
                        <td><strong>{w.matchType}</strong></td>
                        <td style={{color:'var(--gold)',fontWeight:600}}>£{(w.prizeAmount||0).toLocaleString()}</td>
                        <td>
                          <div style={{display:'flex',flexDirection:'column',gap:4}}>
                            <span className={`badge badge-${w.paymentStatus}`}>{w.paymentStatus}</span>
                            <span className={`badge badge-${w.verificationStatus==='approved'?'active':w.verificationStatus==='rejected'?'rejected':'pending'}`}>{w.verificationStatus}</span>
                          </div>
                        </td>
                        <td>
                          {w.verificationStatus === 'unsubmitted' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => submitProof(w.drawId)}>Submit Proof</button>
                          )}
                          {w.verificationStatus === 'pending' && <span style={{fontSize:13,color:'var(--text-3)'}}>Under review</span>}
                          {w.verificationStatus === 'approved' && w.paymentStatus === 'pending' && <span style={{fontSize:13,color:'var(--text-2)'}}>Payment pending</span>}
                          {w.paymentStatus === 'paid' && <span style={{fontSize:13,color:'var(--success)'}}>✓ Paid</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="tab-content">
            <div className="card" style={{marginBottom:24}}>
              <h2 className="card-title">Personal Details</h2>
              <div className="grid-2" style={{marginTop:16}}>
                <div className="input-group">
                  <label className="label">Full Name</label>
                  <input className="input" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="label">Phone</label>
                  <input className="input" value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} placeholder="Optional" />
                </div>
                <div className="input-group">
                  <label className="label">Country</label>
                  <input className="input" value={profile.country} onChange={e => setProfile(p => ({...p, country: e.target.value}))} placeholder="Optional" />
                </div>
                <div className="input-group">
                  <label className="label">Handicap</label>
                  <input className="input" type="number" value={profile.handicap} onChange={e => setProfile(p => ({...p, handicap: e.target.value}))} placeholder="Optional" />
                </div>
              </div>
              <button className="btn btn-primary" style={{marginTop:20}} onClick={saveProfile} disabled={loading.profile}>
                {loading.profile ? <span className="spinner"/> : 'Save Profile'}
              </button>
            </div>

            <div className="card" style={{marginBottom:24}}>
              <h2 className="card-title">Charity Contribution</h2>
              <p style={{color:'var(--text-2)',fontSize:14,marginTop:8,marginBottom:12}}>
                Currently supporting: <strong>{user?.selectedCharity?.name || 'None selected'}</strong>
                {' '}at <strong style={{color:'var(--accent)'}}>{user?.charityContributionPercent || 10}%</strong>
              </p>
              <Link to="/charities" className="btn btn-secondary btn-sm">Change Charity →</Link>
            </div>

            <div className="card">
              <h2 className="card-title">Subscription</h2>
              <div style={{display:'flex',alignItems:'center',gap:12,marginTop:12,marginBottom:16}}>
                <span className={`badge badge-${subStatus||'inactive'}`}>{subStatus || 'inactive'}</span>
                <span style={{fontSize:14,color:'var(--text-2)'}}>Plan: {user?.subscription?.plan || '—'}</span>
                {subStatus === 'active' && <span style={{fontSize:13,color:'var(--text-3)'}}>Renews {subEnd}</span>}
              </div>
              {subStatus === 'active' ? (
                <button className="btn btn-secondary btn-sm" onClick={openPortal}>Manage Billing →</button>
              ) : (
                <Link to="/pricing" className="btn btn-primary btn-sm">Subscribe Now →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
