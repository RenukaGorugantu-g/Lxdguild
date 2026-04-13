import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { notifyUser, notifyAdmins } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.json();
  const { certId, userId, action } = body;

  if (!certId || !userId || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from('certificates')
    .update({ status: action })
    .eq('id', certId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (action === 'approved') {
    const { error: candError } = await supabase
      .from('candidates')
      .update({ reattempt_allowed: true })
      .eq('user_id', userId);

    if (candError) {
      console.error('Failed to unlock candidate reattempt:', candError.message);
    }

    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'candidate_mvp' })
      .eq('id', userId);

    if (roleError) {
      console.error('Failed to promote candidate role after certificate approval:', roleError.message);
    }
  }

  await notifyUser(userId, 'certificate_reviewed', 'Certificate review completed', `Your certificate has been ${action}.`, {
    certificate_id: certId,
    status: action,
  });

  await notifyAdmins(
    'certificate_reviewed_admin',
    'Certificate review completed',
    `Certificate ${certId} was ${action} for candidate ${userId}.`,
    {
      certificate_id: certId,
      status: action,
    }
  );

  return NextResponse.json({ success: true });
}
