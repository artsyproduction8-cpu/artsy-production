/**
 * YouTube Utility Helpers
 * Supports ID extraction from all common formats, thumbnail URL generation,
 * and oEmbed embeddability verification (Public/Unlisted vs Private/Deleted).
 */

export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Reject playlists without video, user channels, etc.
  if (
    trimmed.includes('/channel/') ||
    trimmed.includes('/user/') ||
    trimmed.includes('/c/') ||
    (trimmed.includes('/playlist') && !trimmed.includes('v='))
  ) {
    return null;
  }

  try {
    const url = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0]?.split('?')[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2]?.split('?')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/')[2]?.split('?')[0];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    // URL constructor failed, fall back to regex
  }

  // Regex fallback for irregular or embedded formats
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export function youtubeThumbnail(id: string): string {
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export async function isEmbeddable(videoId: string): Promise<boolean> {
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return false;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}
