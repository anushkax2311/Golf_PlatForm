import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import './AdminPage.css'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminPage() {
  const [tab, setTab] = useState('analytics')

  return (
    <div className="admin-page page-enter">
      <div className="container">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p style={{color:'var(--text-3)'}}>Platform control centre</p>
        </div>
        <div className="tabs" style={{marginBottom:32}}>
          {['analytics','users','draws','charities','winners'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'draws' && <DrawsTab />}
        {tab === 'charities' && <CharitiesTab />}
        {tab === 'winners' && <WinnersTab />}
      </div>
    </div>
  )
}

/* ===== ANALYTICS ===== */
function AnalyticsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics').then(r => setData(r.data.analytics)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="empty-state"><div className="spinner" style={{width:32,height:32}}/></div>
  if (!data) return <div className="empty-state">Failed to load analytics</div>

  return (
    <div>
      <div className="stat-cards" style={{gridTemplateColumns:'repeat(3,1fr)', marginBottom:32}}>
        {[
          { label: 'Total Users', val: data.totalUsers, color: 'var(--text)' },
          { label: 'Active Subscribers', val: data.activeSubscribers, color: 'var(--accent)' },
          { label: 'Total Charities', val: data.totalCharities, color: 'var(--charity)' },
          { label: 'Total Prize Pool Awarded', val: `£${data.totalPrizePool?.toLocaleString() || 0}`, color: 'var(--gold)' },
          { label: 'Total Winners', val: data.totalWinners, color: 'var(--success)' },
          { label: 'Charity Contributions', val: `£${data.charityContributions?.toFixed(0) || 0}`, color: 'var(--charity)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-val" style={{color, fontSize:28}}>{val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:20}}>Recent Draws</h3>
        {data.recentDraws?.length === 0 ? (
          <p style={{color:'var(--text-3)'}}>No draws published yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Status</th><th>Prize Pool</th><th>Participants</th><th>Winners</th></tr></thead>
              <tbody>
                {data.recentDraws?.map(d => (
                  <tr key={d._id}>
                    <td>{MONTHS[d.month-1]} {d.year}</td>
                    <td><span className={`badge badge-${d.status === 'published' ? 'active' : 'pending'}`}>{d.status}</span></td>
                    <td style={{color:'var(--gold)', fontWeight:700}}>£{(d.prizePool?.total||0).toLocaleString()}</td>
                    <td>{d.participantCount || 0}</td>
                    <td>{d.winners?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ===== USERS ===== */
function UsersTab() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/users', { params: { search, status, page, limit: 20 } })
      setUsers(data.users)
      setTotal(data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, status, page])

  const handleUpdate = async (userId, updates) => {
    try {
      await api.put(`/admin/users/${userId}`, updates)
      toast.success('User updated')
      load()
      setEditUser(null)
    } catch { toast.error('Error updating user') }
  }

  return (
    <div>
      <div style={{display:'flex', gap:16, marginBottom:24, flexWrap:'wrap'}}>
        <input type="text" className="input" placeholder="Search users..." style={{maxWidth:300}}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="input" style={{maxWidth:160}} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="past_due">Past Due</option>
        </select>
        <span style={{alignSelf:'center', color:'var(--text-3)', fontSize:14}}>{total} users total</span>
      </div>

      {loading ? <div className="empty-state"><div className="spinner"/></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Subscription</th><th>Plan</th><th>Charity</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{fontWeight:600}}>{u.name}</td>
                  <td style={{color:'var(--text-2)'}}>{u.email}</td>
                  <td><span className={`badge badge-${u.subscription?.status || 'inactive'}`}>{u.subscription?.status || 'none'}</span></td>
                  <td style={{textTransform:'capitalize'}}>{u.subscription?.plan || '—'}</td>
                  <td style={{color:'var(--charity)', fontSize:13}}>{u.selectedCharity?.name || '—'}</td>
                  <td style={{color:'var(--text-3)', fontSize:13}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{display:'flex', gap:8}}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleUpdate(u._id, { isActive: !u.isActive })}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:20}}>Edit User: {editUser.name}</h3>
            <EditUserForm user={editUser} onSave={(updates) => handleUpdate(editUser._id, updates)} onCancel={() => setEditUser(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

function EditUserForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    'subscription.status': user.subscription?.status || 'inactive',
    'subscription.plan': user.subscription?.plan || ''
  })
  return (
    <div style={{display:'flex', flexDirection:'column', gap:16}}>
      <div className="input-group">
        <label className="label">Name</label>
        <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
      </div>
      <div className="input-group">
        <label className="label">Email</label>
        <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
      </div>
      <div className="input-group">
        <label className="label">Subscription Status</label>
        <select className="input" value={form['subscription.status']} onChange={e => setForm(f => ({...f, 'subscription.status': e.target.value}))}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="past_due">Past Due</option>
        </select>
      </div>
      <div style={{display:'flex', gap:12}}>
        <button className="btn btn-primary" onClick={() => onSave({ name: form.name, email: form.email, subscription: { status: form['subscription.status'], plan: form['subscription.plan'] } })}>Save</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ===== DRAWS ===== */
function DrawsTab() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [simForm, setSimForm] = useState({ drawType: 'random', month: new Date().getMonth() + 1, year: new Date().getFullYear() })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/draws')
      setDraws(data.draws)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const { data } = await api.post('/draws/simulate', simForm)
      toast.success('Draw simulated! Review the results before publishing.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation failed')
    } finally { setSimulating(false) }
  }

  const handlePublish = async (drawId) => {
    if (!confirm('Publish this draw? This will notify winners and cannot be undone.')) return
    try {
      await api.post(`/draws/${drawId}/publish`)
      toast.success('Draw published and winners notified!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publish failed')
    }
  }

  return (
    <div>
      <div className="card" style={{marginBottom:32}}>
        <h3 style={{fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:20}}>Run / Simulate Draw</h3>
        <div style={{display:'flex', gap:16, flexWrap:'wrap', alignItems:'flex-end'}}>
          <div className="input-group">
            <label className="label">Month</label>
            <select className="input" value={simForm.month} onChange={e => setSimForm(f => ({...f, month: Number(e.target.value)}))}>
              {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Year</label>
            <input type="number" className="input" style={{width:100}} value={simForm.year} onChange={e => setSimForm(f => ({...f, year: Number(e.target.value)}))} />
          </div>
          <div className="input-group">
            <label className="label">Draw Type</label>
            <select className="input" value={simForm.drawType} onChange={e => setSimForm(f => ({...f, drawType: e.target.value}))}>
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic (Score-weighted)</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSimulate} disabled={simulating}>
            {simulating ? <><span className="spinner"/> Simulating...</> : '🎲 Simulate Draw'}
          </button>
        </div>
      </div>

      {loading ? <div className="empty-state"><div className="spinner"/></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Month</th><th>Status</th><th>Type</th><th>Winning Numbers</th><th>Pool</th><th>Winners</th><th>Actions</th></tr></thead>
            <tbody>
              {draws.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign:'center', color:'var(--text-3)', padding:'40px'}}>No draws yet. Run a simulation above.</td></tr>
              ) : draws.map(d => (
                <tr key={d._id}>
                  <td style={{fontWeight:600}}>{MONTHS[d.month-1]} {d.year}</td>
                  <td><span className={`badge badge-${d.status === 'published' ? 'active' : 'pending'}`}>{d.status}</span></td>
                  <td style={{textTransform:'capitalize', fontSize:13}}>{d.drawType}</td>
                  <td>
                    <div style={{display:'flex', gap:6}}>
                      {d.winningNumbers?.map(n => (
                        <span key={n} style={{background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 8px', fontSize:13, fontWeight:700}}>{n}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{color:'var(--gold)'}}>£{(d.prizePool?.total||0).toLocaleString()}</td>
                  <td>{d.winners?.length || 0}</td>
                  <td>
                    {d.status !== 'published' && d.winningNumbers?.length > 0 && (
                      <button className="btn btn-primary btn-sm" onClick={() => handlePublish(d._id)}>Publish</button>
                    )}
                    {d.status === 'published' && <span style={{fontSize:12, color:'var(--success)'}}>✓ Published</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ===== CHARITIES ===== */
function CharitiesTab() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', shortDescription: '', category: 'health', website: '', isFeatured: false })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const { data } = await api.get('/charities'); setCharities(data.charities) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/charities', form)
      toast.success('Charity created!')
      setShowForm(false)
      setForm({ name: '', description: '', shortDescription: '', category: 'health', website: '', isFeatured: false })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating charity')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this charity?')) return
    try { await api.delete(`/charities/${id}`); toast.success('Charity deactivated'); load() }
    catch { toast.error('Error') }
  }

  const handleFeature = async (c) => {
    try { await api.put(`/charities/${c._id}`, { isFeatured: !c.isFeatured }); load() }
    catch { toast.error('Error') }
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:24}}>
        <h3 style={{fontFamily:'var(--font-display)', fontSize:20, fontWeight:700}}>{charities.length} Charities</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Charity'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:24}}>
          <h4 style={{fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, marginBottom:20}}>New Charity</h4>
          <form onSubmit={handleCreate} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <label className="label">Name *</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <label className="label">Short Description (max 200 chars)</label>
              <input type="text" className="input" value={form.shortDescription} onChange={e => setForm(f => ({...f, shortDescription: e.target.value}))} maxLength={200} />
            </div>
            <div className="input-group" style={{gridColumn:'1/-1'}}>
              <label className="label">Full Description *</label>
              <textarea className="input" rows={4} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required style={{resize:'vertical'}} />
            </div>
            <div className="input-group">
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {['health','education','environment','community','sports','animals','arts','other'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="label">Website URL</label>
              <input type="url" className="input" value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} />
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8, gridColumn:'1/-1'}}>
              <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm(f => ({...f, isFeatured: e.target.checked}))} style={{width:16, height:16, accentColor:'var(--accent)'}} />
              <label htmlFor="featured" style={{fontSize:14}}>Feature on homepage</label>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner"/> Creating...</> : 'Create Charity'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="empty-state"><div className="spinner"/></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Category</th><th>Supporters</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {charities.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', color:'var(--text-3)', padding:'40px'}}>No charities yet.</td></tr>
              ) : charities.map(c => (
                <tr key={c._id}>
                  <td style={{fontWeight:600}}>{c.name}</td>
                  <td style={{textTransform:'capitalize', color:'var(--charity)'}}>{c.category}</td>
                  <td>{c.subscriberCount || 0}</td>
                  <td>
                    <button className={`btn btn-sm ${c.isFeatured ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleFeature(c)}>
                      {c.isFeatured ? '⭐ Featured' : 'Feature'}
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ===== WINNERS ===== */
function WinnersTab() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/winners', { params: filter ? { status: filter } : {} })
      setWinners(data.winners)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleVerify = async (drawId, winnerId, action) => {
    try {
      await api.put(`/admin/winners/${drawId}/${winnerId}`, { action })
      toast.success(`Winner ${action}d`)
      load()
    } catch { toast.error('Error') }
  }

  const handlePay = async (drawId, winnerId) => {
    try {
      await api.put(`/admin/winners/${drawId}/${winnerId}/pay`)
      toast.success('Marked as paid')
      load()
    } catch { toast.error('Error') }
  }

  return (
    <div>
      <div style={{display:'flex', gap:16, marginBottom:24}}>
        <select className="input" style={{maxWidth:200}} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Winners</option>
          <option value="unsubmitted">Unsubmitted</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? <div className="empty-state"><div className="spinner"/></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Draw</th><th>User</th><th>Match</th><th>Prize</th><th>Verification</th><th>Payment</th><th>Proof</th><th>Actions</th></tr></thead>
            <tbody>
              {winners.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign:'center', color:'var(--text-3)', padding:'40px'}}>No winners found.</td></tr>
              ) : winners.map((w, i) => (
                <tr key={i}>
                  <td>{MONTHS[w.drawMonth-1]} {w.drawYear}</td>
                  <td>
                    <div style={{fontWeight:600}}>{w.user?.name}</div>
                    <div style={{fontSize:12, color:'var(--text-3)'}}>{w.user?.email}</div>
                  </td>
                  <td style={{fontWeight:700}}>{w.matchType}</td>
                  <td style={{color:'var(--gold)', fontWeight:700}}>£{(w.prizeAmount||0).toLocaleString()}</td>
                  <td><span className={`badge badge-${w.verificationStatus === 'approved' ? 'active' : w.verificationStatus === 'rejected' ? 'rejected' : 'pending'}`}>{w.verificationStatus}</span></td>
                  <td><span className={`badge badge-${w.paymentStatus}`}>{w.paymentStatus}</span></td>
                  <td>
                    {w.proofImage ? (
                      <a href={`/${w.proofImage}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View Proof</a>
                    ) : (
                      <span style={{fontSize:12, color:'var(--text-3)'}}>Not submitted</span>
                    )}
                  </td>
                  <td>
                    <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                      {w.verificationStatus === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleVerify(w.drawId, w._id, 'approve')}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleVerify(w.drawId, w._id, 'reject')}>Reject</button>
                        </>
                      )}
                      {w.verificationStatus === 'approved' && w.paymentStatus === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handlePay(w.drawId, w._id)}>Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
