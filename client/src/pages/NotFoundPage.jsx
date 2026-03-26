import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page-enter" style={{minHeight:'calc(100vh - 64px)', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:24}}>
      <div>
        <div style={{fontFamily:'var(--font-display)', fontSize:'clamp(80px,15vw,160px)', fontWeight:800, lineHeight:1, color:'var(--border-light)', marginBottom:16}}>404</div>
        <h1 style={{fontFamily:'var(--font-display)', fontSize:32, fontWeight:800, marginBottom:12}}>Page not found</h1>
        <p style={{color:'var(--text-2)', marginBottom:32, fontSize:17}}>Looks like this page took a wrong turn at the 18th hole.</p>
        <Link to="/" className="btn btn-primary btn-lg">← Back to Home</Link>
      </div>
    </div>
  )
}
