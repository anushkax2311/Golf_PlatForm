import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import './AuthPage.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome to GolfGives.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page page-enter">
      <div className="auth-card">
        <div className="auth-logo">⛳ GolfGives</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Start playing for good today</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="label">Full Name</label>
            <input className="input" type="text" placeholder="Your name" value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
          </div>
          <div className="input-group">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>
          <div className="input-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 8 characters" value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} required minLength={8} />
          </div>
          <button className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        <p className="auth-terms">By registering you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  )
}
