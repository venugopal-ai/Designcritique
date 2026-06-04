import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const db = await readDb(true);
    
    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now
    const otpValue = `${otpCode}_${expiresAt}`;

    // Find or create user
    let user = db.users.find(u => u.email === email);
    if (user) {
      user.otpCode = otpValue;
      user.onboarded = true; // Skip onboarding for existing database users
    } else {
      user = {
        email,
        otpCode: otpValue,
        onboarded: false
      };
      db.users.push(user);
    }
    
    await writeDb(db);

    console.log(`[AUTH] Generated OTP for ${email} is ${otpCode} (expires in 2 minutes)`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully (Simulated)',
      otpCode
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
