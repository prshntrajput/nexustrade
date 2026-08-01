import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AlertsView } from '@/components/alerts/AlertsView';
import { DEMO_MODE_COOKIE, isDemoModeCookie } from '@/lib/demo';

export const metadata = {
  title: 'Alerts — NexusTrade',
};

export default async function AlertsPage() {
  const cookieStore = await cookies();
  const isDemo = isDemoModeCookie(cookieStore.get(DEMO_MODE_COOKIE)?.value);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component — cookie writes are ignored
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isDemo) redirect('/login');

  // Client component handles all data fetching via SWR
  return <AlertsView />;
}
