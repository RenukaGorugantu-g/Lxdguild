import { NextResponse } from 'next/server'
import { notifyAdmins } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.json();
  const { email, name, role, candidateTargetRole, candidateDesignation, employerDesignation, companyName } = body;

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const notificationData = {
    type: 'user_registered',
    role,
    email,
    name,
    candidateTargetRole,
    candidateDesignation,
    employerDesignation,
    companyName,
    target_role: candidateTargetRole,
    designation_bucket: candidateDesignation,
  };

  await notifyAdmins(
    'user_registered_admin',
    'New user registered',
    `New user ${name} (${email}) registered as ${role}.`,
    notificationData
  );

  return NextResponse.json({ success: true });
}
