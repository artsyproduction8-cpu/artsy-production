export interface VideoEmbedInfo {
  type: 'direct' | 'youtube' | 'vimeo' | 'gdrive' | 'loom' | 'cloud';
  embedUrl: string;
  originalUrl: string;
  videoId?: string;
}

export function parseVideoEmbedUrl(rawUrl: string | null | undefined, origin?: string): VideoEmbedInfo | null {
  const raw = (rawUrl || '').trim();
  if (!raw) return null;

  // 1. YouTube (watch, shorts, embed, youtu.be, youtube-nocookie)
  const ytMatch = raw.match(
    /(?:(?:www\.)?youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const clientOrigin = origin || (typeof window !== 'undefined' && window.location.origin ? window.location.origin : '');
    const originParam = clientOrigin ? `&origin=${encodeURIComponent(clientOrigin)}` : '';
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&modestbranding=1&widgetid=1${originParam}`,
      originalUrl: raw,
      videoId,
    };
  }

  // 2. Google Drive single file preview (supports /file/d/, /file/u/0/d/, open?id=, uc?id=)
  const gDriveMatch = raw.match(
    /(?:drive|docs)\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i
  );
  if (gDriveMatch && gDriveMatch[1] && !raw.includes('/folders/')) {
    const videoId = gDriveMatch[1];
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${videoId}/preview`,
      originalUrl: raw,
      videoId,
    };
  }

  // 3. Dropbox video file direct stream conversion
  if (/dropbox\.com\/(?:s|scl\/fi)\//i.test(raw) && !raw.includes('/sh/')) {
    const cleanDropbox = raw.replace(/[?&]dl=[01]/g, '').replace(/[?&]raw=1/g, '');
    const streamUrl = cleanDropbox + (cleanDropbox.includes('?') ? '&raw=1' : '?raw=1');
    return {
      type: 'direct',
      embedUrl: streamUrl,
      originalUrl: raw,
    };
  }

  // 4. Vimeo
  const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?api=1`,
      originalUrl: raw,
      videoId,
    };
  }

  // 5. Loom
  const loomMatch = raw.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    const videoId = loomMatch[1];
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${videoId}`,
      originalUrl: raw,
      videoId,
    };
  }

  // 6. Direct Video Streams (.mp4, .webm, .m3u8, .mov)
  const isDirectVideo = /\.(mp4|webm|m3u8|mov)(?:\?.*)?$/i.test(raw);
  if (isDirectVideo) {
    return {
      type: 'direct',
      embedUrl: raw,
      originalUrl: raw,
    };
  }

  // 6. Generic Cloud Storage Folder or Link (Google Drive folder, Dropbox, Frame.io, B2)
  return {
    type: 'cloud',
    embedUrl: raw,
    originalUrl: raw,
  };
}

export function formatTimecode(secs: number): string {
  const s = Math.max(0, Math.floor(secs || 0));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export function parseTimecodeToSeconds(timecode: string | null | undefined): number {
  if (!timecode) return 0;
  const clean = timecode.trim().replace(/[^0-9:]/g, '');
  const parts = clean.split(':').map((p) => Number(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(clean) || 0;
}

