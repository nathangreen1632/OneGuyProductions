export function sanitizeBody(input: string): string {
  return input.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/script>/gi, '');
}
