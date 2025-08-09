export function sanitizeBody(input: string): string {
  // Minimal example: strip script tags, normalize URLs, etc.
  return input.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/script>/gi, '');
}
