import './Auth.css'
import { useState } from 'react'
import { supabase } from '../client'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    })

    if (error) setMessage(error.message)
    else setMessage('Sign up successful! You can now log in.')

    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) setMessage(error.message)

    setLoading(false)
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <h2 className="auth__title">Welcome</h2>
        <p className="auth__subtitle">Log in or create an account to join the conversation.</p>

        <form className="auth__form form">
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="auth__actions">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Loading...' : 'Log In'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="btn btn-secondary"
            >
              Sign Up
            </button>
          </div>
        </form>

        {message && <p className="form-message">{message}</p>}
      </div>
    </div>
  )
}
