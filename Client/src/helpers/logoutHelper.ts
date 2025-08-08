export async function logoutUser(): Promise<boolean> {
  try {
    const res: Response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      console.error('Logout failed:', await res.text());
      return false;
    }

    return true;
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return false;
  }
}
