export const nextPathForUser: (u: any) => string = (u: any): string => {
  if (!u) return '/';
  const role: string = String(u.role ?? '');
  const verified: boolean = Boolean(u.emailVerified);
  return role === 'admin' && verified ? '/admin/orders' : '/portal';
};
