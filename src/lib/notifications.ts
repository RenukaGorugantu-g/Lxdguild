import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from './email'

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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (profileError || !profile?.email) {
    console.warn('notifyUser missing profile/email:', profileError?.message)
  } else {
    await sendEmail({
      to: profile.email,
      subject: title,
      html: `<p>${message}</p>`,
      text: message,
    })
  }

  await createNotification(userId, type, title, message, data)
}

export async function notifyUserByEmail(email: string, title: string, message: string, data?: Record<string, unknown>) {
  void data
  await sendEmail({
    to: email,
    subject: title,
    html: `<p>${message}</p>`,
    text: message,
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

  const detailsHtml = buildAdminDetailsHtml(data)

  await Promise.all(
    adminEmails.map(async (email) =>
      sendEmail({
        to: email,
        subject: `[Admin] ${title}`,
        html: `<p>${message}</p>${detailsHtml}`,
        text: message,
      })
    )
  )
}

export function buildNotificationMessage(event: string, payload: Record<string, string>) {
  return `${event} | ${Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' • ')}`
}

function buildAdminDetailsHtml(data: Record<string, unknown>) {
  const details: string[] = []

  if (typeof data.candidate_name === 'string' && data.candidate_name) {
    details.push(`<p><strong>Candidate:</strong> ${escapeHtml(data.candidate_name)}</p>`)
  }
  if (typeof data.candidate_email === 'string' && data.candidate_email) {
    details.push(`<p><strong>Email:</strong> ${escapeHtml(data.candidate_email)}</p>`)
  }
  if (typeof data.status === 'string' && data.status) {
    details.push(`<p><strong>Status:</strong> ${escapeHtml(data.status)}</p>`)
  }
  if (typeof data.file_kind === 'string' && data.file_kind) {
    details.push(`<p><strong>File type:</strong> ${escapeHtml(data.file_kind.toUpperCase())}</p>`)
  }
  if (typeof data.certificate_url === 'string' && data.certificate_url) {
    const href = escapeHtml(data.certificate_url)
    details.push(`<p><strong>Certificate:</strong> <a href="${href}">${href}</a></p>`)
  }
  if (typeof data.admin_review_url === 'string' && data.admin_review_url) {
    const href = escapeHtml(data.admin_review_url)
    details.push(`<p><strong>Review dashboard:</strong> <a href="${href}">${href}</a></p>`)
  }

  return details.length ? `<hr /><div>${details.join('')}</div>` : ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
