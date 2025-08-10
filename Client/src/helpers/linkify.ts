const URL_REGEX = /\bhttps?:\/\/[^\s<>"']+/gi;

export function linkifySafe(text: string): string {
  const escaped: string = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return escaped.replace(URL_REGEX, (url: string): string => `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow">${url}</a>`);
}
