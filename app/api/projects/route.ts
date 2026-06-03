import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb, Project, supabase } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await readDb();
    const projects = db.projects.filter(p => p.email === email);

    return NextResponse.json({ projects });
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

    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const db = await readDb();
    
    const newProject: Project = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description: description || '',
      email,
      createdAt: new Date().toISOString()
    };

    db.projects.push(newProject);
    await writeDb(db);

    return NextResponse.json({ success: true, project: newProject });
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
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const db = await readDb();
    
    // Verify project belongs to user
    const projectIndex = db.projects.findIndex(p => p.id === projectId && p.email === email);
    if (projectIndex === -1) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Delete project
    db.projects.splice(projectIndex, 1);

    // Get list of chat IDs to delete associated messages and critiques
    const chatsToDelete = db.chats.filter(c => c.projectId === projectId);
    const chatIds = chatsToDelete.map(c => c.id);

    // Cascade delete chats
    db.chats = db.chats.filter(c => c.projectId !== projectId);

    // Cascade delete messages
    db.messages = db.messages.filter(m => !chatIds.includes(m.chatId));

    // Cascade delete critiques
    db.critiques = db.critiques.filter(c => !chatIds.includes(c.chatId));

    // Delete project from database directly
    await supabase.from('projects').delete().eq('id', projectId);

    await writeDb(db);

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

    const { projectId, pinned, name } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const db = await readDb();
    
    // Find project and verify owner
    const project = db.projects.find(p => p.id === projectId && p.email === email);
    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Update pinned status if provided
    if (pinned !== undefined) {
      project.pinned = !!pinned;
    }

    // Update name if provided
    if (name !== undefined && name.trim() !== '') {
      project.name = name.trim();
    }

    await writeDb(db);

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
