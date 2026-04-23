import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PortfolioView } from '@/components/portfolio/PortfolioView';

export const metadata = { title: 'Portfolio — NexusTrade' };

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export default async function PortfolioPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  return <PortfolioView />;
}
