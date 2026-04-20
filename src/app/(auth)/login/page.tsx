'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/')
  }

  return (
    <div className="premium-shell premium-page">
      <div className="premium-content premium-container">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <section className="premium-hero p-8 sm:p-10">
            <div className="premium-badge">
              <Sparkles className="h-3.5 w-3.5 text-[#34cd2f]" />
              Premium access
            </div>
            <h1 className="premium-title mt-6 text-4xl sm:text-5xl">Welcome back to your Guild workspace.</h1>
            <p className="premium-copy mt-4 max-w-lg text-sm leading-7">
              Sign in to continue your assessment journey, explore premium resources, and manage the next step in your
              hiring or career workflow.
            </p>
            <div className="mt-8 space-y-4">
              {[
                'Track candidate verification and job access',
                'Open member-only templates and guides',
                'Return to a cleaner, more premium dashboard flow',
              ].map((item) => (
                <div key={item} className="premium-metric flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#34cd2f]" />
                  <span className="text-sm text-white">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-panel rounded-[2rem] p-8 sm:p-10">
            <div className="mb-8">
              <p className="premium-kicker">Sign in</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Access your premium workflow</h2>
              <p className="premium-copy mt-3 text-sm">Use your account to continue from where you left off.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="premium-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="premium-input pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#cde3e1]/66 hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="premium-button premium-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 text-sm text-[#cde3e1]">
              Don&apos;t have an account? <Link href="/register" className="font-semibold text-[#80ef7a] hover:text-white">Register</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
