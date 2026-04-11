import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated → go to app
  // Unauthenticated → go to login
  if (user) {
    redirect('/watchlist');
  } else {
    redirect('/login');
  }
}