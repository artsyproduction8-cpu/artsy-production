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
}

export default function YouTubePlayerModal({ videoId, title }: YouTubePlayerModalProps) {
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
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            vq: 'highres', // Request highest resolution (1080p/4K)
            hd: 1,
            playsinline: 1,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
          },
          events: {
            onReady: (event: any) => {
              // Ensure the created iframe maintains the 150% oversized centered cropping styles
              const iframe = event.target.getIframe();
              if (iframe) {
                iframe.className = 'absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0';
                iframe.title = title;
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
              }

              // Force the highest available playback quality
              try {
                if (typeof event.target.setPlaybackQualityRange === 'function') {
                  event.target.setPlaybackQualityRange('highres', 'highres');
                }
                if (typeof event.target.setPlaybackQuality === 'function') {
                  event.target.setPlaybackQuality('highres');
                }
              } catch (err) {
                console.warn('Could not set playback quality onReady:', err);
              }

              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              // When playback starts (state 1 = PLAYING), reinforce the highest quality setting
              if (event.data === 1) {
                try {
                  if (typeof event.target.setPlaybackQualityRange === 'function') {
                    event.target.setPlaybackQualityRange('highres', 'highres');
                  }
                  if (typeof event.target.setPlaybackQuality === 'function') {
                    event.target.setPlaybackQuality('highres');
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
        // Check if the script tag is already in DOM
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        // Chain or attach to window.onYouTubeIframeAPIReady
        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (typeof prevCallback === 'function') {
            prevCallback();
          }
          initPlayer();
        };

        // Fallback polling in case the script finishes loading without triggering event
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
  }, [videoId, title]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        id="yt-player"
        className="absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0"
      />
    </div>
  );
}
