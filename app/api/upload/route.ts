import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveUploadedFile, readDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (email.startsWith('trial_')) {
      const db = await readDb();
      const userProjects = db.projects.filter((p: any) => p.email === email);
      const projectIds = userProjects.map((p: any) => p.id);
      const userChats = db.chats.filter((c: any) => projectIds.includes(c.projectId));
      const chatIds = userChats.map((c: any) => c.id);
      const trialUploadCount = db.critiques.filter((crit: any) => chatIds.includes(crit.chatId)).length;
      
      if (trialUploadCount >= 3) {
        return NextResponse.json({ error: 'You have reached your 3-upload free trial limit. Please sign in to continue.' }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate size (under 5MB)
    const limit = 5 * 1024 * 1024;
    if (file.size > limit) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Validate type (PNG, JPG, JPEG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG and JPG images are supported' }, { status: 400 });
    }

    const publicPath = await saveUploadedFile(file);

    return NextResponse.json({
      success: true,
      filePath: publicPath
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
