'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  )
}

function RegisterPageContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('candidate_onhold')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'employer') setSelectedRole('employer_free')
    if (roleParam === 'candidate') setSelectedRole('candidate_onhold')
  }, [searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: selectedRole,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name,
        role: selectedRole,
        userId: data?.user?.id,
      }),
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="premium-shell premium-page">
        <div className="premium-content premium-container">
          <div className="premium-panel mx-auto max-w-2xl rounded-[2rem] p-10 text-center">
            <div className="premium-badge mx-auto">
              <Sparkles className="h-3.5 w-3.5 text-[#34cd2f]" />
              Registration complete
            </div>
            <h2 className="mt-5 text-4xl font-bold text-white">Check your email</h2>
            <p className="premium-copy mx-auto mt-4 max-w-xl">
              We&apos;ve sent a verification link to {email}. Once you confirm your email, your premium onboarding flow
              continues inside the Guild.
            </p>
            <Link href="/login" className="premium-button premium-button-primary mt-8 inline-flex">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-shell premium-page">
      <div className="premium-content premium-container">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
          <section className="premium-hero p-8 sm:p-10">
            <div className="premium-badge">
              <Sparkles className="h-3.5 w-3.5 text-[#34cd2f]" />
              Premium onboarding
            </div>
            <h1 className="premium-title mt-6 text-4xl sm:text-5xl">Join the Guild with a more intentional first impression.</h1>
            <p className="premium-copy mt-4 max-w-lg text-sm leading-7">
              We&apos;re turning registration into a clear entry point for both candidate and employer journeys so the
              product feels high-trust from the start.
            </p>
            <div className="mt-8 space-y-4">
              {[
                'Candidate sign-up leads into assessment and profile readiness',
                'Employer sign-up leads into hiring workflow and talent discovery',
                'Membership becomes an add-on benefit, not a role replacement',
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
              <p className="premium-kicker">Create account</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Build your premium Guild profile</h2>
              <p className="premium-copy mt-3 text-sm">Choose your path and get into the right workflow immediately.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">I am a...</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`rounded-2xl border p-4 transition-colors ${selectedRole === 'candidate_onhold' ? 'border-[#34cd2f] bg-white/12' : 'border-white/10 bg-white/6 hover:bg-white/10'}`}>
                    <input type="radio" className="sr-only" checked={selectedRole === 'candidate_onhold'} onChange={() => setSelectedRole('candidate_onhold')} />
                    <p className="text-sm font-semibold text-white">Candidate</p>
                    <p className="mt-1 text-xs text-[#cde3e1]/72">Take the assessment and build a verified profile.</p>
                  </label>
                  <label className={`rounded-2xl border p-4 transition-colors ${selectedRole === 'employer_free' ? 'border-[#34cd2f] bg-white/12' : 'border-white/10 bg-white/6 hover:bg-white/10'}`}>
                    <input type="radio" className="sr-only" checked={selectedRole === 'employer_free'} onChange={() => setSelectedRole('employer_free')} />
                    <p className="text-sm font-semibold text-white">Employer</p>
                    <p className="mt-1 text-xs text-[#cde3e1]/72">Post roles and discover pre-vetted L&D talent.</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white" htmlFor="name">Full Name</label>
                <input id="name" type="text" required className="premium-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white" htmlFor="email">Email address</label>
                <input id="email" type="email" required className="premium-input" value={email} onChange={(e) => setEmail(e.target.value)} />
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

              <button type="submit" disabled={loading} className="premium-button premium-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 text-sm text-[#cde3e1]">
              Already have an account? <Link href="/login" className="font-semibold text-[#80ef7a] hover:text-white">Sign in</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function RegisterPageFallback() {
  return (
    <div className="premium-shell premium-page">
      <div className="premium-content premium-container">
        <div className="premium-panel mx-auto max-w-md rounded-[2rem] p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Join the Guild</h1>
          <p className="premium-copy mt-3 text-sm">Loading registration...</p>
        </div>
      </div>
    </div>
  )
}
