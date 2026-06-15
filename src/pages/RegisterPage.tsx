import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clapperboard } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signUp(email, password, fullName)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <Clapperboard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">MY DREAM</h1>
          <p className="text-brand-400 font-semibold text-lg">VIDEO STUDIO</p>
          <p className="mt-2 text-white/40 text-sm">Crea il tuo account</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium">Registrazione completata!</p>
              <p className="text-white/40 text-sm mt-1">Controlla la tua email per confermare l'account.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome completo"
                type="text"
                placeholder="Mario Rossi"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="tua@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min. 6 caratteri"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Crea account
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-white/40">
            Hai già un account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
