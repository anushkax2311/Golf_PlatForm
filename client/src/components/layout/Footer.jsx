import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">⛳ GolfGives</div>
            <p>Play. Win. Give. The golf subscription platform that makes every round count for charity.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/draws">Monthly Draws</Link>
            <Link to="/charities">Charities</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/register">Sign Up</Link>
            <Link to="/login">Login</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GolfGives. All rights reserved.</span>
          <span>Built with ♥ for charity</span>
        </div>
      </div>
    </footer>
  )
}
