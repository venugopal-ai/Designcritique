'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ShieldCheck, User as UserIcon, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

const PERSONAS = [
  { id: 'pm', title: 'Product Manager', desc: 'Teardown products, audit UX, and write strategy logs' },
  { id: 'designer', title: 'UX/UI Designer', desc: 'Validate visual systems, spacing, and layout heuristics' },
  { id: 'founder', title: 'Founder & Builder', desc: 'Audit user activation and business conversion loops' },
  { id: 'other', title: 'Other/Aspiring', desc: 'Learn the product eye and practice strategic critiques' }
];

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'onboarding'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mockOtp, setMockOtp] = useState<string | null>(null);

  // Check if already authenticated on load
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          if (data.user.onboarded) {
            router.push('/dashboard');
          } else {
            setStep('onboarding');
            setEmail(data.user.email);
          }
        }
      });
  }, [router]);

  // Handle Requesting OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStep('otp');
        if (data.otpCode) {
          setMockOtp(data.otpCode);
        }
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verifying OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode })
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        if (data.onboarded) {
          router.push('/dashboard');
        } else {
          setStep('onboarding');
        }
      }
    } catch (err) {
      setError('Invalid code or session expired.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Onboarding Submission
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please tell us your name');
      return;
    }
    if (!persona) {
      setError('Please select what describes you best');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, persona })
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-surface-page)] text-[var(--color-text-primary)] relative overflow-hidden px-4">
      {/* Design System Soft Branding Accent */}
      <div className="absolute top-0 left-0 w-full h-[5px] bg-[var(--color-brand-500)]" />
      
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[var(--color-brand-100)]/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[130px] pointer-events-none" />

      {/* Glassmorphic Shadow Container */}
      <div className="relative z-10 w-full max-w-md p-8 bg-[var(--color-surface-card)] rounded-[var(--radius-2xl)] border border-[var(--color-border-default)] shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center h-12 w-12 rounded-[var(--radius-xl)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] text-[var(--color-brand-500)] mb-3 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-brand)]">
            Innoviti Product Intelligence
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 max-w-[280px]">
            Design-system aligned heuristic & accessibility audits
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-[var(--radius-lg)] bg-[var(--color-feedback-error-bg)] border border-[var(--color-border-error)] text-[var(--color-text-danger)] text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT (Option A Design System Pattern) */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                Work Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@innoviti.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-0 rounded-[var(--radius-lg)] bg-[var(--color-gray-100)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:bg-[var(--color-gray-50)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 focus:border-[var(--color-border-focus)] transition-all duration-150 text-xs h-11"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] active:bg-[var(--color-action-primary-pressed)] text-[var(--color-text-inverse)] font-medium text-xs transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Sending Code...' : 'Get Instant Access'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                Verification Code *
              </label>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                We sent a simulated 6-digit OTP code to <strong className="text-[var(--color-text-brand)]">{email}</strong>
              </p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-3 border-0 rounded-[var(--radius-lg)] bg-[var(--color-gray-100)] text-[var(--color-text-primary)] tracking-[0.3em] font-mono text-center text-sm placeholder-zinc-300 focus:outline-none focus:bg-[var(--color-gray-50)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 focus:border-[var(--color-border-focus)] transition-all duration-150 h-11"
                  required
                />
              </div>
            </div>

            {mockOtp && (
              <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] text-center text-xs text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-text-brand)] font-semibold">Mock Mode:</span> Enter code <strong className="font-mono text-[var(--color-text-brand)] bg-[var(--color-brand-100)] px-2 py-0.5 rounded select-all">{mockOtp}</strong>.
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-1/3 h-11 border border-[var(--color-border-default)] rounded-[var(--radius-lg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)] font-medium text-xs transition duration-150 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 h-11 flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] active:bg-[var(--color-action-primary-pressed)] text-[var(--color-text-inverse)] font-medium text-xs transition duration-150 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ONBOARDING */}
        {step === 'onboarding' && (
          <form onSubmit={handleOnboard} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                Your Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-tertiary)]">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Venu Gopal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-0 rounded-[var(--radius-lg)] bg-[var(--color-gray-100)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:bg-[var(--color-gray-50)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 focus:border-[var(--color-border-focus)] transition-all duration-150 text-xs h-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-2">
                What describes you best? *
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPersona(p.id)}
                    className={`flex items-start gap-3 p-3.5 text-left border rounded-[var(--radius-lg)] transition-all duration-150 cursor-pointer ${
                      persona === p.id
                        ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-text-brand)]'
                        : 'border-[var(--color-border-default)] bg-[var(--color-surface-sunken)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-gray-100)]'
                    }`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      persona === p.id ? 'border-[var(--color-brand-500)] text-[var(--color-brand-500)]' : 'border-[var(--color-border-strong)]'
                    }`}>
                      {persona === p.id && <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-500)] animate-scale" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-none">{p.title}</h4>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 leading-normal">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-[var(--color-action-primary)] hover:bg-[var(--color-action-primary-hover)] active:bg-[var(--color-action-primary-pressed)] text-[var(--color-text-inverse)] font-medium text-xs transition duration-150 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Setting up Workspace...' : 'Enter Workspace'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
