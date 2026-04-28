import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function shouldTreatNotificationsAsOptional(code?: string, message?: string | null) {
  const normalizedMessage = message || "";
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    normalizedMessage.includes('notifications') ||
    normalizedMessage.includes('does not exist')
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (shouldTreatNotificationsAsOptional(error.code, error.message)) {
      console.warn('[api/notifications] returning empty list:', error.message);
      return NextResponse.json({ notifications: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications: data });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { ids = [], is_read = true } = body;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No notification ids provided' }, { status: 400 });
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read })
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) {
    if (shouldTreatNotificationsAsOptional(error.code, error.message)) {
      console.warn('[api/notifications] skipping patch:', error.message);
      return NextResponse.json({ success: true, skipped: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
