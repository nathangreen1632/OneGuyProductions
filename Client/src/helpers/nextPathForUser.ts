export const nextPathForUser: (u: any) => string = (u: any): string => {
  const role: string = (u?.role as string) || 'user';
  const verified: boolean = Boolean(u?.emailVerified);
  return role === 'admin' && verified ? '/admin/orders' : '/portal';
};
