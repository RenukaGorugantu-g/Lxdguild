'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('candidate_onhold') // default to candidate
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
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

    // 1. Sign up user
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4">
        <div className="w-full max-w-md p-8 text-center bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold gradient-text mb-4">Check your email</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">We've sent a verification link to {email}. Please verify to continue.</p>
          <Link href="/login" className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black px-4 py-12 pt-20">
      <div className="w-full max-w-md p-8 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-border rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold gradient-text">Join the Guild</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm">Create your verified account today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">I am a...</label>
            <div className="flex gap-4">
               <label className="flex items-center gap-2 bg-zinc-50 dark:bg-[#1a1c23] p-3 rounded-lg border border-border flex-1 cursor-pointer hover:border-brand-500 transition-colors">
                  <input type="radio" checked={selectedRole === 'candidate_onhold'} onChange={() => setSelectedRole('candidate_onhold')} />
                  <span className="text-sm font-medium">Candidate</span>
               </label>
               <label className="flex items-center gap-2 bg-zinc-50 dark:bg-[#1a1c23] p-3 rounded-lg border border-border flex-1 cursor-pointer hover:brand-500 transition-colors">
                  <input type="radio" checked={selectedRole === 'employer_free'} onChange={() => setSelectedRole('employer_free')} />
                  <span className="text-sm font-medium">Employer</span>
               </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">Full Name</label>
            <input id="name" type="text" required className="w-full px-4 py-2 border border-zinc-300 dark:border-border rounded-lg bg-transparent focus:ring-2 focus:ring-brand-500 outline-none" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email address</label>
            <input id="email" type="email" required className="w-full px-4 py-2 border border-zinc-300 dark:border-border rounded-lg bg-transparent focus:ring-2 focus:ring-brand-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input id="password" type="password" required className="w-full px-4 py-2 border border-zinc-300 dark:border-border rounded-lg bg-transparent focus:ring-2 focus:ring-brand-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-900/50">{error}</div>}

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account? <Link href="/login" className="text-brand-600 hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
