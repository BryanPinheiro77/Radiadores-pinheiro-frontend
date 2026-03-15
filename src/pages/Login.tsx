import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import type { LoginResponse } from '../types'
import logo from '../assets/logo-radiadores.jpg'

function Login() {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { login, password })
      localStorage.setItem('token', data.token)
      navigate('/dashboard')
    } catch {
      setError('Login ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Radiadores Pinheiro" className="w-32 h-32 object-contain mb-4" />
          <h1 className="text-white text-xl font-medium">Radiadores Pinheiro</h1>
          <p className="text-white/30 text-sm mt-1">Sistema de Gestão Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0d0f18] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs">Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#4e90d9] transition-colors"
              placeholder="seu login"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0a0c14] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#4e90d9] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
  type="submit"
  disabled={loading}
  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-sm py-2.5 rounded-lg transition-colors mt-1 flex items-center justify-center gap-2 w-full"
>
  {loading ? (
    <>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Entrando...
    </>
  ) : 'Entrar'}
</button>
        </form>
      </div>
    </div>
  )
}

export default Login