import type { SupabaseClient } from '@supabase/supabase-js'
import { canAccessJobBoardRole } from "@/lib/profile-role";

/**
 * Job board access is role-driven. candidate_onhold remains locked.
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

  return { canAccessJobBoard: canAccessJobBoardRole(profile.role) }
}
