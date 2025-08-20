export interface ApiErrorBody {
  error?: string;
  message?: string;
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function readJsonSafe(res: Response, logPrefix = 'readJsonSafe'): Promise<ApiErrorBody | null> {
  try {
    const text = await res.text();
    if (!isNonEmptyString(text)) return null;

    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        const maybe = parsed as Partial<ApiErrorBody>;
        return {
          error: isNonEmptyString(maybe.error) ? maybe.error : undefined,
          message: isNonEmptyString(maybe.message) ? maybe.message : undefined,
        };
      }
      return { message: text };
    } catch {
      return { message: text };
    }
  } catch (err) {
    console.error(`${logPrefix}: failed to read response body`, err);
    return null;
  }
}
