import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb, User, Project, Chat } from '@/lib/db';

export async function POST() {
  try {
    const trialEmail = `trial_${Date.now()}@smartcritique.com`;
    const db = await readDb();

    // 1. Create the trial user
    const user: User = {
      email: trialEmail,
      name: 'Trial User',
      persona: 'Founder & Builder',
      onboarded: true
    };
    db.users.push(user);

    // 2. Create a default Project for the trial user
    const projectId = `proj-trial-${Date.now()}`;
    const project: Project = {
      id: projectId,
      name: 'My First Audit Project',
      description: 'Explore the Smart Critique dashboard during your 3-upload free trial.',
      email: trialEmail,
      createdAt: new Date().toISOString()
    };
    db.projects.push(project);

    // 3. Create a default Chat under that project
    const chatId = `chat-trial-${Date.now()}`;
    const chat: Chat = {
      id: chatId,
      projectId: projectId,
      name: 'Audit Trial Session',
      createdAt: new Date().toISOString()
    };
    db.chats.push(chat);

    // Write all to db.json
    await writeDb(db);

    // 4. Set cookie session
    const cookieStore = await cookies();
    cookieStore.set('session_email', trialEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Trial creation failed' }, { status: 500 });
  }
}
