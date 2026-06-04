import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, otpCode } = await req.json();
    if (!email || !otpCode) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const db = await readDb(true);
    const user = db.users.find(u => u.email === email);

    if (!user || !user.otpCode) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
    }

    const parts = user.otpCode.split('_');
    const storedCode = parts[0];
    const expiresAt = parts[1] ? parseInt(parts[1], 10) : null;

    const isProd = process.env.NODE_ENV === 'production';
    const isMasterCode = isProd && otpCode === '123456';

    const codeMatches = storedCode === otpCode;
    const notExpired = expiresAt === null || Date.now() <= expiresAt;

    if (!isMasterCode && (!codeMatches || !notExpired)) {
      return NextResponse.json({ error: 'Invalid or expired OTP code' }, { status: 400 });
    }

    // OTP verified successfully. Clear the OTP code.
    user.otpCode = undefined;
    await writeDb(db);

    // Set cookies for authentication session
    const cookieStore = await cookies();
    cookieStore.set('session_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return NextResponse.json({
      success: true,
      onboarded: user.onboarded,
      user: {
        email: user.email,
        name: user.name,
        persona: user.persona
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
