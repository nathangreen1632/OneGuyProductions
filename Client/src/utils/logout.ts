// Client/src/utils/logout.ts
export async function logoutUser(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Logout failed:', await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('Logout error:', err);
    return false;
  }
}
