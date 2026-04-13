import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Job board is available to MVP candidates, admins, and candidates whose
 * course certificate has been approved (path A: certificate without exam pass).
 */
export async function getJobBoardAccessForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ canAccessJobBoard: boolean }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { canAccessJobBoard: false }
  }

  if (profile.role === 'admin' || profile.role === 'candidate_mvp') {
    return { canAccessJobBoard: true }
  }

  const { data: rows } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .limit(1)

  return { canAccessJobBoard: !!(rows && rows.length > 0) }
}
