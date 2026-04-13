import { NextResponse } from 'next/server'
import { createNotification, notifyUser, notifyUserByEmail, notifyAdmins } from '@/lib/notifications'

export async function POST(req: Request) {
  const body = await req.json();
  const { email, name, role, userId } = body;

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const title = 'Welcome to LXD Guild';
  const message = `Thanks for registering as ${role.replace('_', ' ')}. Your account has been created and is pending verification.`;

  if (userId) {
    await createNotification(userId, 'user_registered', title, message, { role, email, name });
    await notifyUser(userId, 'user_registered', title, message, { role, email });
  } else {
    await notifyUserByEmail(email, title, message, { role, email });
  }

  await notifyAdmins(
    'user_registered_admin',
    'New user registered',
    `New user ${name} (${email}) registered as ${role}.`,
    { role, email }
  );

  return NextResponse.json({ success: true });
}
