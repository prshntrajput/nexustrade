import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { DEMO_MODE_COOKIE, isDemoModeCookie } from '@/lib/demo';

export default async function RootPage() {
  const cookieStore = await cookies();
  const isDemo = isDemoModeCookie(cookieStore.get(DEMO_MODE_COOKIE)?.value);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated → go to app
  // Unauthenticated → go to login
  if (user || isDemo) {
    redirect('/market' as never);
  } else {
    redirect('/login');
  }
}
