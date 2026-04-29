import { NextResponse } from 'next/server'
import { createNotification, notifyUser, notifyUserByEmail, notifyAdmins } from '@/lib/notifications'
import { getSiteUrl } from '@/lib/site-url'

export async function POST(req: Request) {
  const body = await req.json();
  const { email, name, role, userId, candidateTargetRole, candidateDesignation, employerDesignation, companyName } = body;

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const title = 'Welcome to LXD Guild';
  const message = `Thanks for registering as ${role.replace('_', ' ')}. Your account has been created and is pending verification.`;
  const notificationData = {
    type: 'user_registered',
    role,
    email,
    name,
    candidateTargetRole,
    candidateDesignation,
    employerDesignation,
    companyName,
    dashboard_url: `${getSiteUrl()}/dashboard`,
    target_role: candidateTargetRole,
    designation_bucket: candidateDesignation,
  };

  if (userId) {
    await createNotification(userId, 'user_registered', title, message, {
      ...notificationData,
    });
    await notifyUser(userId, 'user_registered', title, message, {
      ...notificationData,
    });
  } else {
    await notifyUserByEmail(email, title, message, {
      ...notificationData,
    });
  }

  await notifyAdmins(
    'user_registered_admin',
    'New user registered',
    `New user ${name} (${email}) registered as ${role}.`,
    notificationData
  );

  return NextResponse.json({ success: true });
}
