'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayerModalProps {
  videoId: string;
  title: string;
  zoomScale?: string;
}

export default function YouTubePlayerModal({
  videoId,
  title,
  zoomScale = 'w-[125%] h-[125%]',
}: YouTubePlayerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    function initPlayer() {
      if (isCancelled || !containerRef.current || !window.YT || !window.YT.Player) {
        return;
      }

      // Cleanup any previous player instance if it exists
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          host: 'https://www.youtube.com',
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            vq: 'hd1080', // Force 1080p high definition
            hd: 1,
            playsinline: 1,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
          },
          events: {
            onReady: (event: any) => {
              const isFull = zoomScale === 'w-full h-full';
              const playerClass = isFull
                ? 'w-full h-full border-0'
                : `absolute ${zoomScale} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0`;

              // Ensure the created iframe maintains the appropriate styles
              const iframe = event.target.getIframe();
              if (iframe) {
                iframe.className = playerClass;
                iframe.title = title;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              }

              // Force the highest available playback quality
              try {
                if (typeof event.target.setPlaybackQuality === 'function') {
                  event.target.setPlaybackQuality('hd1080');
                }
                if (typeof event.target.setPlaybackQualityRange === 'function') {
                  event.target.setPlaybackQualityRange('hd1080', 'hd1080');
                }
              } catch (err) {
                console.warn('Could not set playback quality onReady:', err);
              }

              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              // When playback starts (state 1 = PLAYING), reinforce the 1080p quality setting
              if (event.data === 1) {
                try {
                  if (typeof event.target.setPlaybackQuality === 'function') {
                    event.target.setPlaybackQuality('hd1080');
                  }
                  if (typeof event.target.setPlaybackQualityRange === 'function') {
                    event.target.setPlaybackQualityRange('hd1080', 'hd1080');
                  }
                } catch (err) {
                  // ignore
                }
              }
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize YouTube player:', err);
      }
    }

    // Load the YouTube Iframe API if not already present
    if (typeof window !== 'undefined') {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevCallback === 'function') {
            prevCallback();
          }
          initPlayer();
        };

        const interval = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(interval);
            initPlayer();
          }
        }, 100);

        return () => {
          clearInterval(interval);
          isCancelled = true;
          if (playerRef.current) {
            try {
              playerRef.current.destroy();
            } catch (e) {
              // ignore
            }
            playerRef.current = null;
          }
        };
      }
    }

    return () => {
      isCancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId, title, zoomScale]);

  const isFull = zoomScale === 'w-full h-full';
  const playerClass = isFull
    ? 'w-full h-full border-0'
    : `absolute ${zoomScale} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0`;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        id="yt-player"
        className={playerClass}
      />
    </div>
  );
}
