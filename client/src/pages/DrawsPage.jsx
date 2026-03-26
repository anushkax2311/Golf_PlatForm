import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import './DrawsPage.css'

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DrawsPage() {
  const { user } = useAuth()
  const [draws, setDraws] = useState([])
  const [current, setCurrent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const [d, c] = await Promise.all([
            api.get('/draws'),
            api.get('/draws/current')
          ])
          setDraws(d.data.draws || [])
          setCurrent(c.data.draw)
        } else {
          // Public: show static info
        }
      } catch (e) {}
      setLoading(false)
    }
    fetchData()
  }, [user])

  return (
    <div className="draws-page page-enter">
      <div className="container">
        <div className="draws-header">
          <div className="section-tag">Monthly Draws</div>
          <h1>Win by playing your best game</h1>
          <p>Five numbers are drawn each month from the Stableford range (1–45). Match 3, 4, or 5 to win.</p>
        </div>

        {/* Current draw info */}
        {current && (
          <div className="current-draw-card">
            <div className="cd-left">
              <div className="cd-badge"><span className="dot-live" /> This Month's Draw</div>
              <h2>{MONTHS[current.month]} {current.year}</h2>
              <div className="cd-pool">
                <div className="pool-item">
                  <div className="pool-label">Prize Pool</div>
                  <div className="pool-val">£{(current.prizePool?.total || 0).toLocaleString()}</div>
                </div>
                <div className="pool-item">
                  <div className="pool-label">Jackpot (5-match)</div>
                  <div className="pool-val gold">£{((current.prizePool?.fiveMatch || 0) + (current.jackpotRolledOver || 0)).toLocaleString()}</div>
                </div>
                <div className="pool-item">
                  <div className="pool-label">Participants</div>
                  <div className="pool-val">{current.activeSubscribers || '—'}</div>
                </div>
              </div>
            </div>
            <div className="cd-right">
              {current.status === 'published' ? (
                <>
                  <div className="cd-status published">Results Published</div>
                  <div className="winning-numbers">
                    {current.winningNumbers?.map(n => (
                      <div key={n} className="draw-number matched">{n}</div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="cd-status upcoming">Draw Pending</div>
                  <div className="number-placeholders">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="draw-number">?</div>
                    ))}
                  </div>
                  <p style={{color:'var(--text-3)',fontSize:13,marginTop:12}}>Results published on the 1st of next month</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Draw mechanics */}
        <div className="draw-mechanics">
          <h2>How the draw works</h2>
          <div className="mechanics-grid">
            <div className="mechanic-card">
              <div className="mechanic-icon">🎯</div>
              <h3>Your Scores = Your Entries</h3>
              <p>Your 5 most recent Stableford scores (1–45) are your draw numbers. No extra tickets needed.</p>
            </div>
            <div className="mechanic-card">
              <div className="mechanic-icon">🎲</div>
              <h3>Monthly Number Draw</h3>
              <p>5 winning numbers are drawn each month — either randomly or weighted by score frequency.</p>
            </div>
            <div className="mechanic-card">
              <div className="mechanic-icon">🏆</div>
              <h3>Match to Win</h3>
              <p>Match 3+ of your scores to the 5 drawn numbers to win a share of the prize pool.</p>
            </div>
            <div className="mechanic-card">
              <div className="mechanic-icon">🔄</div>
              <h3>Jackpot Rollover</h3>
              <p>No 5-match winner? The jackpot rolls to next month and keeps growing until claimed.</p>
            </div>
          </div>
        </div>

        {/* Past draws */}
        {draws.length > 0 && (
          <div className="past-draws">
            <h2>Past Draw Results</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Winning Numbers</th>
                    <th>Pool</th>
                    <th>Jackpot</th>
                    <th>Winners</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.filter(d => d.status === 'published').map(d => (
                    <tr key={d._id}>
                      <td><strong>{MONTHS[d.month]} {d.year}</strong></td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          {d.winningNumbers?.map(n => (
                            <div key={n} className="draw-number" style={{width:32,height:32,fontSize:13}}>{n}</div>
                          ))}
                        </div>
                      </td>
                      <td>£{(d.prizePool?.total||0).toLocaleString()}</td>
                      <td className="gold-text">£{(d.prizePool?.fiveMatch||0).toLocaleString()}</td>
                      <td>{d.winners?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
