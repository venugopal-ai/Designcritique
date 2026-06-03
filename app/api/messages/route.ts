import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb, Message } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const db = readDb();
    
    // Verify chat belongs to user's project
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const project = db.projects.find(p => p.id === chat.projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized project' }, { status: 403 });
    }

    const messages = db.messages.filter(m => m.chatId === chatId);

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, sender, text, images, hasCritique } = await req.json();
    if (!chatId || !sender || !text) {
      return NextResponse.json({ error: 'Missing required message parameters' }, { status: 400 });
    }

    const db = readDb();
    
    // Verify chat ownership
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const project = db.projects.find(p => p.id === chat.projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      chatId,
      sender,
      text,
      images: images || [],
      timestamp: new Date().toISOString(),
      hasCritique: !!hasCritique
    };

    db.messages.push(newMessage);
    writeDb(db);

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
