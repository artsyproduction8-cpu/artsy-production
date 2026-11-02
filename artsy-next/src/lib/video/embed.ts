export interface VideoEmbedInfo {
  type: 'direct' | 'youtube' | 'vimeo' | 'gdrive' | 'loom' | 'cloud';
  embedUrl: string;
  originalUrl: string;
}

export function parseVideoEmbedUrl(rawUrl: string | null | undefined): VideoEmbedInfo | null {
  const raw = (rawUrl || '').trim();
  if (!raw) return null;

  // 1. YouTube (watch, shorts, embed, youtu.be)
  const ytMatch = raw.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&enablejsapi=1`,
      originalUrl: raw,
    };
  }

  // 2. Google Drive single file preview
  const gDriveMatch = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1] && !raw.includes('/folders/')) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`,
      originalUrl: raw,
    };
  }

  // 3. Vimeo
  const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: raw,
    };
  }

  // 4. Loom
  const loomMatch = raw.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      originalUrl: raw,
    };
  }

  // 5. Direct Video Streams (.mp4, .webm, .m3u8, .mov)
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
