import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const success = await login(password)
    if (success) {
      localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false')
      if (!rememberMe) sessionStorage.setItem('currentSession', 'true')
      navigate('/', { replace: true })
    } else {
      setError('Falsches Passwort.')
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card bg-base-100 shadow-md w-full max-w-sm">
        <div className="card-body">
          <h2 className="card-title text-2xl justify-center mb-4">Montalux Timetracker</h2>
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label"><span className="label-text">Passwort</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Passwort eingeben..."
                required
                autoFocus
              />
            </div>
            <div className="form-control mt-3">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox checkbox-sm checkbox-primary"
                />
                <span className="label-text">Auf diesem Computer merken</span>
              </label>
            </div>
            <div className="form-control mt-2">
              <button type="submit" className="btn btn-primary w-full">Anmelden</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
