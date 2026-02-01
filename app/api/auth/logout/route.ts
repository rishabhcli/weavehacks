import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET() {
  const response = NextResponse.redirect(`${APP_URL}/`);
  
  // Clear all auth cookies
  response.cookies.delete('patchpilot_session');
  response.cookies.delete('github_oauth_state');
  
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear all auth cookies
  response.cookies.delete('patchpilot_session');
  response.cookies.delete('github_oauth_state');
  
  return response;
}
