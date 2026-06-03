import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb, User } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const db = readDb();
    
    // Generate a simple 6-digit OTP (e.g. 123456 or a random one)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Find or create user
    let user = db.users.find(u => u.email === email);
    if (user) {
      user.otpCode = otpCode;
    } else {
      user = {
        email,
        otpCode,
        onboarded: false
      };
      db.users.push(user);
    }
    
    writeDb(db);

    console.log(`[AUTH MOCK] OTP for ${email} is ${otpCode}`);

    // Return the OTP code directly for local testing convenience!
    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully (Simulated)',
      otpCode // Returning it so the user can easily log in locally without email service setup
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
