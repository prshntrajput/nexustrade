import { NextResponse } from 'next/server';
import { DEMO_MODE_COOKIE } from '@/lib/demo';

export async function POST(): Promise<Response> {
  const response = NextResponse.json({ success: true });

  response.cookies.set(DEMO_MODE_COOKIE, 'true', {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    httpOnly: true,
  });

  return response;
}

export async function DELETE(): Promise<Response> {
  const response = NextResponse.json({ success: true });

  response.cookies.set(DEMO_MODE_COOKIE, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
  });

  return response;
}
