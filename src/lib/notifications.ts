import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from './email'

function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !url) return null;
  return createSupabaseClient(url, serviceRoleKey);
}

async function getSupabaseClient() {
  const service = getServiceSupabase();
  if (service) return service;
  return await createClient();
}

export async function createNotification(userId: string, type: string, title: string, message: string, data: Record<string, unknown> = {}) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data,
  });

  if (error) {
    console.error('Failed to create notification:', error.message);
  }
}

export async function notifyUser(userId: string, type: string, title: string, message: string, data: Record<string, unknown> = {}) {
  const supabase = await getSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (profileError || !profile?.email) {
    console.warn('notifyUser missing profile/email:', profileError?.message);
  } else {
    await sendEmail({
      to: profile.email,
      subject: title,
      html: `<p>${message}</p>`,
      text: message,
    });
  }

  await createNotification(userId, type, title, message, data);
}

export async function notifyUserByEmail(email: string, title: string, message: string, data: Record<string, unknown> = {}) {
  await sendEmail({
    to: email,
    subject: title,
    html: `<p>${message}</p>`,
    text: message,
  });

  if (!email) {
    return;
  }

  // No notification row can be created without a profile id.
}

export async function notifyAdmins(type: string, title: string, message: string, data: Record<string, unknown> = {}) {
  const supabase = await getSupabaseClient();
  const adminEmailsFromEnv = process.env.ADMIN_EMAILS?.split(',').map((email) => email.trim()).filter(Boolean) || [];
  const adminIdsFromEnv = process.env.ADMIN_IDS?.split(',').map((id) => id.trim()).filter(Boolean) || [];

  const { data: admins, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'admin');

  const adminIds = adminIdsFromEnv.length > 0 ? adminIdsFromEnv : (admins || []).map((admin: any) => admin.id).filter(Boolean);
  const adminEmails = adminEmailsFromEnv.length > 0 ? adminEmailsFromEnv : (admins || []).map((admin: any) => admin.email).filter(Boolean);

  if (error && adminEmails.length === 0) {
    console.error('Failed to load admin profiles and no admin emails are configured:', error.message);
    return;
  }

  await Promise.all(
    adminIds.map(async (adminId) => createNotification(adminId, type, title, message, data))
  );

  await Promise.all(
    adminEmails.map(async (email) =>
      sendEmail({
        to: email,
        subject: `[Admin] ${title}`,
        html: `<p>${message}</p>`,
        text: message,
      })
    )
  );
}

export function buildNotificationMessage(event: string, payload: Record<string, string>) {
  return `${event} | ${Object.entries(payload)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' • ')}`;
}
