import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from './email'
import { buildNotificationEmail } from './email-templates'

function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !url) return null
  return createSupabaseClient(url, serviceRoleKey)
}

async function getSupabaseClient() {
  const service = getServiceSupabase()
  if (service) return service
  return await createClient()
}

async function resolveUserEmailAndName(
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
  userId: string
) {
  const profileQuery = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single()

  const profile = profileQuery.data
  let email = typeof profile?.email === 'string' ? profile.email.trim() : ''
  const name = typeof profile?.name === 'string' ? profile.name : undefined

  const serviceSupabase = getServiceSupabase()
  if (!email && serviceSupabase) {
    const authUserResult = await serviceSupabase.auth.admin.getUserById(userId)
    const authEmail = authUserResult.data.user?.email?.trim() || ''

    if (authEmail) {
      email = authEmail

      const { error: backfillError } = await serviceSupabase
        .from('profiles')
        .update({ email: authEmail })
        .eq('id', userId)

      if (backfillError) {
        console.warn('notifyUser could not backfill profile email:', backfillError.message)
      }
    }
  }

  return {
    email,
    name,
    profileError: profileQuery.error,
  }
}

export async function createNotification(userId: string, type: string, title: string, message: string, data: Record<string, unknown> = {}) {
  const supabase = await getSupabaseClient()
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data,
  })

  if (error) {
    console.error('Failed to create notification:', error.message)
  }
}

export async function notifyUser(userId: string, type: string, title: string, message: string, data: Record<string, unknown> = {}) {
  const supabase = await getSupabaseClient()
  const { email: resolvedEmail, name, profileError } = await resolveUserEmailAndName(supabase, userId)

  if (profileError || !resolvedEmail) {
    console.warn('notifyUser missing profile/email:', profileError?.message)
  } else {
    const email = buildNotificationEmail({
      audience: 'user',
      type,
      title,
      message,
      data: {
        ...data,
        name,
        email: resolvedEmail,
      },
    })
    await sendEmail({
      to: resolvedEmail,
      subject: title,
      html: email.html,
      text: email.text,
    })
  }

  await createNotification(userId, type, title, message, data)
}

export async function notifyUserByEmail(email: string, title: string, message: string, data?: Record<string, unknown>) {
  void data
  const renderedEmail = buildNotificationEmail({
    audience: 'user',
    type: typeof data?.type === 'string' ? data.type : 'generic',
    title,
    message,
    data: {
      ...data,
      email,
    },
  })
  await sendEmail({
    to: email,
    subject: title,
    html: renderedEmail.html,
    text: renderedEmail.text,
  })

  if (!email) {
    return
  }

  // No notification row can be created without a profile id.
}

type AdminNotificationProfile = {
  id?: string | null
  email?: string | null
}

export async function notifyAdmins(type: string, title: string, message: string, data: Record<string, unknown> = {}) {
  const supabase = await getSupabaseClient()
  const adminEmailsFromEnv = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()).filter(Boolean) || []
  const adminIdsFromEnv = process.env.ADMIN_IDS?.split(',').map((id) => id.trim()).filter(Boolean) || []

  const { data: admins, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'admin')

  const adminProfiles = (admins || []) as AdminNotificationProfile[]
  const adminIds = adminIdsFromEnv.length > 0 ? adminIdsFromEnv : adminProfiles.map((admin) => admin.id).filter((value): value is string => Boolean(value))
  const adminEmails = adminEmailsFromEnv.length > 0 ? adminEmailsFromEnv : adminProfiles.map((admin) => admin.email).filter((value): value is string => Boolean(value))

  if (error && adminEmails.length === 0) {
    console.error('Failed to load admin profiles and no admin emails are configured:', error.message)
    return
  }

  await Promise.all(
    adminIds.map(async (adminId) => createNotification(adminId, type, title, message, data))
  )

  await Promise.all(
    adminEmails.map(async (email) => {
        const renderedEmail = buildNotificationEmail({
          audience: 'admin',
          type,
          title,
          message,
          data: {
            ...data,
            email,
          },
        })
        return sendEmail({
          to: email,
          subject: `[Admin] ${title}`,
          html: renderedEmail.html,
          text: renderedEmail.text,
        })
      })
  )
}

export function buildNotificationMessage(event: string, payload: Record<string, string>) {
  return `${event} | ${Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' • ')}`
}
