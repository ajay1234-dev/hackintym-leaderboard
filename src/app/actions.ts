'use server';

import { cookies } from 'next/headers';

export async function syncSession(action: 'login' | 'logout') {
  const cookieStore = await cookies();
  
  if (action === 'login') {
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    return { success: true };
  }
  
  if (action === 'logout') {
    cookieStore.delete('admin_session');
    return { success: true };
  }
  
  return { success: false, error: 'Invalid action' };
}
