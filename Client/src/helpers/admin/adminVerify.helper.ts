import toast from 'react-hot-toast';

export function readPrefillEmail(): string {
  try {
    const v: string | null = sessionStorage.getItem('prefillEmail');
    return typeof v === 'string' ? v : '';
  } catch (err) {
    console.warn('AdminVerify: failed to read prefillEmail from sessionStorage.', err);
    toast.error('Could not load saved email (session storage)');
    return '';
  }
}

export function isLikelyEmail(s: string): boolean {
  if (!s?.includes('@')) return false;
  const [local, domain] = s.split('@');
  return Boolean(local && domain?.includes('.'));
}

export type JsonResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
};

export async function postJson<T = unknown>(
  url: string,
  payload: unknown
): Promise<JsonResult<T>> {
  try {
    const res: Response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload ?? {}),
    });

    let data: T | null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('adminVerify.postJson: network error', { url, err });
    return { ok: false, status: 0, data: null };
  }
}

export function pickErrorMessage(
  result: JsonResult<any>,
  fallback: string
): string {
  const d = result.data;
  if (d && typeof d.error === 'string') return d.error;
  if (d && typeof d.message === 'string') return d.message;
  return fallback;
}
