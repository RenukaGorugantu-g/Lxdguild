import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { notifyUser, notifyAdmins } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, certificateUrl } = body;

  if (!userId || !certificateUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templateKeyword = process.env.CERTIFICATE_TEMPLATE_KEYWORD;
  let status = 'pending';

  if (templateKeyword && certificateUrl.includes(templateKeyword)) {
    status = 'approved';
  }

  const { error: insertError } = await supabase.from('certificates').insert({
    user_id: userId,
    certificate_url: certificateUrl,
    status,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (status === 'approved') {
    const { error: candError } = await supabase
      .from('candidates')
      .update({ reattempt_allowed: true })
      .eq('user_id', userId);

    if (candError) {
      console.error('Failed to unlock candidate reattempt:', candError.message);
    }
  }

  await notifyUser(userId, 'certificate_uploaded', 'Certificate submitted', `Your certificate has been submitted and is ${status}.`, {
    certificate_url: certificateUrl,
    status,
  });

  await notifyAdmins(
    'certificate_uploaded_admin',
    'Certificate submitted',
    `A candidate uploaded a certificate that is currently ${status}.`,
    {
      user_id: userId,
      status,
    }
  );

  return NextResponse.json({ success: true, status });
}
