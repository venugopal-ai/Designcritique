import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, persona } = await req.json();
    if (!name || !persona) {
      return NextResponse.json({ error: 'Name and Persona are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const email = cookieStore.get('session_email')?.value;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await readDb();
    let user = db.users.find(u => u.email === email);

    if (!user) {
      user = {
        email,
        name,
        persona,
        onboarded: true
      };
      db.users.push(user);
    } else {
      // Update details and mark as onboarded
      user.name = name;
      user.persona = persona;
      user.onboarded = true;
    }
    
    await writeDb(db);

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        persona: user.persona,
        onboarded: true
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
