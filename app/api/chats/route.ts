import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb, Chat } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const db = readDb();
    const chats = db.chats.filter(c => c.projectId === projectId);

    return NextResponse.json({ chats });
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

    const { projectId, name } = await req.json();
    if (!projectId || !name) {
      return NextResponse.json({ error: 'Project ID and Chat Name are required' }, { status: 400 });
    }

    const db = readDb();
    
    // Verify project belongs to user
    const project = db.projects.find(p => p.id === projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const newChat: Chat = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      projectId,
      name,
      createdAt: new Date().toISOString()
    };

    db.chats.push(newChat);
    writeDb(db);

    return NextResponse.json({ success: true, chat: newChat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    
    // Find chat
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify project belongs to user
    const project = db.projects.find(p => p.id === chat.projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete chat
    db.chats = db.chats.filter(c => c.id !== chatId);

    // Cascade delete messages
    db.messages = db.messages.filter(m => m.chatId !== chatId);

    // Cascade delete critiques
    db.critiques = db.critiques.filter(c => c.chatId !== chatId);

    writeDb(db);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, pinned, name } = await req.json();
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const db = readDb();
    
    // Find chat
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Verify project belongs to user
    const project = db.projects.find(p => p.id === chat.projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update pinned status if provided
    if (pinned !== undefined) {
      chat.pinned = !!pinned;
    }

    // Update name if provided
    if (name !== undefined && name.trim() !== '') {
      chat.name = name.trim();
    }

    writeDb(db);

    return NextResponse.json({ success: true, chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
