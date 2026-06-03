import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { readDb } from '@/lib/db';

export default async function HomePage() {
  const cookieStore = await cookies();
  const email = cookieStore.get('session_email')?.value;

  if (!email) {
    redirect('/auth');
  }

  const db = await readDb();
  const user = db.users.find(u => u.email === email);

  if (!user || !user.onboarded) {
    redirect('/auth');
  }

  redirect('/dashboard');
}
