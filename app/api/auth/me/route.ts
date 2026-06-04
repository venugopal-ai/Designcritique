import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ authenticated: false });
    }

    const db = await readDb(true);
    const user = db.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    const isTrial = user.email.startsWith('trial_');
    let trialUploadCount = 0;
    if (isTrial) {
      const userProjects = db.projects.filter(p => p.email === user.email);
      const projectIds = userProjects.map(p => p.id);
      const userChats = db.chats.filter(c => projectIds.includes(c.projectId));
      const chatIds = userChats.map(c => c.id);
      trialUploadCount = db.critiques.filter(crit => chatIds.includes(crit.chatId)).length;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name,
        persona: user.persona,
        onboarded: user.onboarded,
        isTrial,
        trialUploadCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message });
  }
}
