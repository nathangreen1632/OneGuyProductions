import toast from "react-hot-toast";

export async function logoutUser(): Promise<boolean> {
  try {
    const res: Response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (res.ok) {
      toast.dismiss('admin-guard-denied');
      toast.success('Logged out successfully', { id: 'logout-success' });
    } else {
      toast.error('Logout failed. Please try again.');
    }

    return true;
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return false;
  }
}
