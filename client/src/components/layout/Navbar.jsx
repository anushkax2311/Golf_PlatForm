import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">⛳</span>
          <span className="logo-text">GolfGives</span>
        </Link>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/charities" className={isActive('/charities') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Charities</Link>
          <Link to="/draws" className={isActive('/draws') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Draws</Link>
          <Link to="/pricing" className={isActive('/pricing') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Pricing</Link>

          {user ? (
            <>
              <Link to="/dashboard" className={`btn btn-secondary btn-sm ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              {isAdmin && (
                <Link to="/admin" className={`btn btn-ghost btn-sm ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
          <span className={menuOpen ? 'open' : ''}></span>
        </button>
      </div>
    </nav>
  )
}
