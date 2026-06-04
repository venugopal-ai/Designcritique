import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { Resend } from 'resend';

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

    // Attempt to send email via Resend if API key is provided
    const resendApiKey = process.env.RESEND_API_KEY;
    const isMock = !resendApiKey || resendApiKey === 're_your_api_key_here';
    let emailSent = false;

    if (!isMock) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'welcome to Design critique',
          html: `<p>welcome to Design critique</p><p>Here is the OTP for login: <strong>${otpCode}</strong></p><p>This verification code will expire in 2 minutes.</p>`
        });
        emailSent = true;
        console.log(`[AUTH] Real email sent to ${email} via Resend`);
      } catch (err: any) {
        console.error('Failed to send email via Resend:', err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: emailSent ? 'Verification code sent to your email' : 'OTP sent successfully (Simulated)',
      // Provide OTP in response only if real email failed or was not configured
      ...(!emailSent ? { otpCode } : {})
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
