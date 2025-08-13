export const nextPathForUser = (u: any): string => {
  const role = (u?.role as string) || 'user';
  const verified = Boolean(u?.emailVerified);
  return role === 'admin' && verified ? '/admin/orders' : '/portal';
};
