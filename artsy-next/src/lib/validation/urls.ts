const ALLOWED_VIDEO_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
];

export function validateVideoUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 500) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  if (!ALLOWED_VIDEO_HOSTS.includes(host)) return null;
  return url.toString();
}

export function validateImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 1000) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  return url.toString();
}
