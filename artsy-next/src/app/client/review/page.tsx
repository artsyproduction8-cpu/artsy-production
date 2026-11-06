'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import ClientSidebar from '../components/ClientSidebar';
import ClientHeader from '../components/ClientHeader';
import { createChangeOrder } from '@/lib/changeOrders/engine';
import { logRefundRequest } from '@/lib/activity/logger';
import { parseVideoEmbedUrl, formatTimecode, parseTimecodeToSeconds, VideoEmbedInfo } from '@/lib/video/embed';
import { formatPublicCreatorName } from '@/lib/masking';

interface RevisionItem {
  id: string;
  timecode: string;
  timecodeSeconds?: number;
  tag: string;
  tagBg: string;
  author: string;
  timeAgo: string;
  text: string;
  status: string;
  statusColor: string;
  isAddressed?: boolean;
  round?: number;
}

interface LoadedProject {
  id: string;
  projectNumber: string;
  orderNumber: string;
  title: string;
  category: string;
  status: string;
  deliverableUrl: string | null;
  rawFootageUrl: string | null;
  creatorName: string;
  currentRound: number;
  includedRounds: number;
  roundPhase?: 'round_1_active' | 'round_1_submitted' | 'round_2_active' | 'round_2_submitted' | 'all_rounds_ended' | 'extra_round_unlocked' | 'approved';
  isRevisionRequested?: boolean;
  totalAmountPaidPaise?: number;
  extraRevisionFeePaise?: number;
  isRevisionLocked?: boolean;
  turnaround: string;
  extendedDeliveryDays?: number;
  clientDeadline?: string | null;
  isApproved: boolean;
  reviewNotes: RevisionItem[];
  editingProgress?: any;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatCategoryLabel(tag?: string): string {
  const t = String(tag || '').toUpperCase();
  switch (t) {
    case 'COLOR': return 'Color';
    case 'AUDIO': return 'Audio';
    case 'PACING': return 'Pacing';
    case 'TITLES': return 'Titles';
    case 'FOOTAGE': return 'Cut & B-Roll';
    case 'VFX': return 'VFX';
    case 'FRAMING': return 'Framing';
    case 'GENERAL': return 'General';
    default: return tag ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase() : 'Note';
  }
}

function getCategoryPlaceholder(category: string): string {
  switch (category) {
    case 'COLOR':
      return 'e.g., Skin tones look too warm, please adjust...';
    case 'AUDIO':
      return 'e.g., Lower background music during speech...';
    case 'PACING':
      return 'e.g., Trim this cut 1 second earlier...';
    case 'TITLES':
      return 'e.g., Fix spelling in title text...';
    case 'FOOTAGE':
      return 'e.g., Swap with another take or angle...';
    case 'VFX':
      return 'e.g., Add a smooth zoom-in here...';
    case 'FRAMING':
      return 'e.g., Reframe shot to center the subject...';
    default:
      return 'Write your feedback for this moment...';
  }
}

export default function ClientReviewPage() {
  const { user } = useAuth();
  const routeParams = useParams<{ id?: string; projectId?: string }>();
  const searchParams = useSearchParams();
  const targetProjectId = routeParams?.id || routeParams?.projectId || searchParams?.get('p') || searchParams?.get('id') || null;

  const [project, setProject] = useState<LoadedProject | null>(null);
  const [loadingProject, setLoadingProject] = useState<boolean>(true);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimecode, setCurrentTimecode] = useState('00:00:00');
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(180);
  const [activeCategory, setActiveCategory] = useState('COLOR');
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [useDriveIframeFallback, setUseDriveIframeFallback] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [includedRounds, setIncludedRounds] = useState(2);
  const [totalAmountPaidPaise, setTotalAmountPaidPaise] = useState(100000);
  const [extraRevisionFeePaise, setExtraRevisionFeePaise] = useState(50000);
  const [isUnlockingRound, setIsUnlockingRound] = useState(false);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [studioProfile, setStudioProfile] = useState({
    studioName: user?.full_name || '',
    legalName: '',
    gstin: '',
    ingestProvider: 'Google Drive Enterprise',
    ingestLink: '',
    brandLuts: 'Standard Rec.709 Master',
    collaborators: '',
  });
  const [studioSavedNotice, setStudioSavedNotice] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch project data
  const loadProjectData = async () => {
    try {
      setLoadingProject(true);
      let fetchUrl = targetProjectId ? `/api/client/projects/${encodeURIComponent(targetProjectId)}` : null;

      // If no specific ID, query client projects list to pick first active project
      if (!fetchUrl) {
        const listRes = await fetch('/api/client/projects');
        const listData = await listRes.json();
        if (listData.projects && listData.projects.length > 0) {
          fetchUrl = `/api/client/projects/${encodeURIComponent(listData.projects[0].id)}`;
          setHasProjects(true);
        } else {
          setHasProjects(false);
          setLoadingProject(false);
          return;
        }
      }

      const res = await fetch(fetchUrl);
      const data = await res.json();

      if (data.success && data.project) {
        const p: LoadedProject = data.project;
        setProject(p);
        setHasProjects(true);
        setIsApproved(Boolean(p.isApproved));
        setCurrentRound(p.currentRound || 1);
        setIncludedRounds(p.includedRounds || 2);
        if (p.totalAmountPaidPaise) setTotalAmountPaidPaise(p.totalAmountPaidPaise);
        if (p.extraRevisionFeePaise) setExtraRevisionFeePaise(p.extraRevisionFeePaise);
      } else {
        setHasProjects(false);
      }
    } catch (err) {
      console.warn('Failed to load project details:', err);
      setHasProjects(false);
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [targetProjectId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        if (stored) {
          setStudioProfile((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch {}
    }
  }, []);

  // Parse deliverable link into embeddable format
  const videoEmbed = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    return parseVideoEmbedUrl(project?.deliverableUrl, origin);
  }, [project?.deliverableUrl]);

  // Apply initial timestamp if specified in deliverable URL
  useEffect(() => {
    if (videoEmbed?.initialSeconds && currentSeconds === 0) {
      updateCurrentTime(videoEmbed.initialSeconds);
    }
  }, [videoEmbed?.initialSeconds]);

  // Track how many feedback notes have been addressed in the current video cut
  const addressedNotesCount = useMemo(() => {
    if (!project?.reviewNotes) return 0;
    return project.reviewNotes.filter(
      (n) => n.isAddressed || String(n.status || '').toLowerCase().includes('addressed') || String(n.status || '').toLowerCase().includes('resolved')
    ).length;
  }, [project?.reviewNotes]);

  // Requirement 2 & 3: Lock revisions / comments when client has completed included review rounds
  const isRevisionLocked = currentRound > includedRounds;
  const isRevisionRequested = Boolean(project?.isRevisionRequested || project?.status === 'client_revision_requested');
  const unaddressedNotesCount = useMemo(() => {
    if (!project?.reviewNotes) return 0;
    return project.reviewNotes.filter(
      (n) => !n.isAddressed && !String(n.status || '').toLowerCase().includes('addressed') && !String(n.status || '').toLowerCase().includes('resolved')
    ).length;
  }, [project?.reviewNotes]);

  // Playback speed state (1x, 1.25x, 1.5x)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Synchronize playback timestamp state
  const updateCurrentTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs || 0));
    setCurrentSeconds(s);
    setCurrentTimecode(formatTimecode(s));
  };

  // Toggle play/pause across all player backends (HTML5, YouTube, Vimeo)
  const handleTogglePlayPause = () => {
    if (!videoEmbed) return;

    // 1. Direct HTML5 video
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    // 2. YouTube via YT.Player API
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      try {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
        return;
      } catch {}
    }

    // 3. YouTube postMessage fallback
    if (videoEmbed.type === 'youtube' && iframeRef.current?.contentWindow) {
      const nextPlay = !isPlaying;
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: nextPlay ? 'playVideo' : 'pauseVideo',
            args: [],
          }),
          '*'
        );
      } catch {}
      setIsPlaying(nextPlay);
      return;
    }

    // 4. Vimeo postMessage
    if (videoEmbed.type === 'vimeo' && iframeRef.current?.contentWindow) {
      const nextPlay = !isPlaying;
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            method: nextPlay ? 'play' : 'pause',
          }),
          '*'
        );
      } catch {}
      setIsPlaying(nextPlay);
      return;
    }

    // 5. Fallback timer toggle for opaque iframes (Drive Embed, Loom, Cloud)
    setIsPlaying((prev) => !prev);
  };

  // Timer simulation for non-native iframe playback when active
  useEffect(() => {
    if (!isPlaying) return;
    // If native video element exists, handleNativeTimeUpdate handles it with hardware precision
    if (videoRef.current) return;
    // If YouTube API is active, its 250ms polling loop handles it
    if (videoEmbed?.type === 'youtube') return;

    const timer = setInterval(() => {
      setCurrentSeconds((prev) => {
        const maxDur = totalDuration > 0 ? totalDuration : 999999;
        const next = Math.min(maxDur, prev + 1);
        setCurrentTimecode(formatTimecode(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, totalDuration, videoEmbed?.type]);

  // Change playback speed across players
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      try {
        ytPlayerRef.current.setPlaybackRate(speed);
      } catch {}
    }
    if (videoEmbed?.type === 'youtube' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setPlaybackRate',
            args: [speed],
          }),
          '*'
        );
      } catch {}
    }
  };

  // Keyboard shortcut listener: Space toggles play/pause, Arrow keys scrub, M focuses feedback textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, currentSeconds - (e.shiftKey ? 1 : 5)));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(totalDuration > 0 ? totalDuration : 999999, currentSeconds + (e.shiftKey ? 1 : 5)));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        noteTextareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoEmbed, isPlaying, currentSeconds, totalDuration]);

  // Dynamically load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).YT && (window as any).YT.Player) return;

    const existingScript = document.getElementById('artsy-youtube-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'artsy-youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.body.appendChild(tag);
      }
    }
  }, []);

  // Initialize YouTube IFrame Player API controller
  useEffect(() => {
    if (videoEmbed?.type !== 'youtube') {
      ytPlayerRef.current = null;
      return;
    }

    let isSubscribed = true;
    let pollTimer: NodeJS.Timeout | null = null;

    const createPlayer = () => {
      if (!isSubscribed) return;
      const YT = (window as any).YT;
      const iframeEl = document.getElementById('artsy-yt-player');
      if (!YT || !YT.Player || !iframeEl) {
        pollTimer = setTimeout(createPlayer, 200);
        return;
      }

      try {
        ytPlayerRef.current = new YT.Player('artsy-yt-player', {
          events: {
            onReady: (event: any) => {
              if (!isSubscribed) return;
              try {
                const dur = event.target.getDuration();
                if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
                  setTotalDuration(Math.floor(dur));
                }
                const cur = event.target.getCurrentTime();
                if (typeof cur === 'number' && !isNaN(cur)) {
                  updateCurrentTime(Math.floor(cur));
                }
              } catch {}
            },
            onStateChange: (event: any) => {
              if (!isSubscribed) return;
              const playerState = event.data;
              if (playerState === 1) {
                setIsPlaying(true);
              } else if (playerState === 2 || playerState === 0) {
                setIsPlaying(false);
              }

              try {
                const cur = event.target.getCurrentTime();
                if (typeof cur === 'number' && !isNaN(cur)) {
                  updateCurrentTime(Math.floor(cur));
                }
                const dur = event.target.getDuration();
                if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
                  setTotalDuration(Math.floor(dur));
                }
              } catch {}
            },
          },
        });
      } catch (err) {
        console.warn('Failed to attach YouTube player controller:', err);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      const prevCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        createPlayer();
      };
      pollTimer = setTimeout(createPlayer, 300);
    }

    return () => {
      isSubscribed = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [videoEmbed?.videoId, videoEmbed?.type]);

  // High-resolution active polling loop (250ms) during video playback for fluid synchronization
  useEffect(() => {
    if (!isPlaying || videoEmbed?.type !== 'youtube') return;

    const interval = setInterval(() => {
      if (ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const cur = ytPlayerRef.current.getCurrentTime();
            if (typeof cur === 'number' && !isNaN(cur)) {
              updateCurrentTime(Math.floor(cur));
            }
          }
          if (typeof ytPlayerRef.current.getDuration === 'function') {
            const dur = ytPlayerRef.current.getDuration();
            if (typeof dur === 'number' && dur > 0 && !isNaN(dur)) {
              setTotalDuration(Math.floor(dur));
            }
          }
        } catch {}
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, videoEmbed?.type]);

  // Dual-layer window postMessage listener for real-time iframe timeline synchronization
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }

        if (!data || typeof data !== 'object') return;

        // 1. YouTube postMessage events (infoDelivery, initialDelivery, onStateChange)
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && !isNaN(data.info.currentTime)) {
            updateCurrentTime(Math.floor(data.info.currentTime));
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0 && !isNaN(data.info.duration)) {
            setTotalDuration(Math.floor(data.info.duration));
          }
          if (typeof data.info.playerState === 'number') {
            if (data.info.playerState === 1) {
              setIsPlaying(true);
            } else if (data.info.playerState === 2 || data.info.playerState === 0) {
              setIsPlaying(false);
            }
          }
        } else if (data.event === 'initialDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && !isNaN(data.info.currentTime)) {
            updateCurrentTime(Math.floor(data.info.currentTime));
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0 && !isNaN(data.info.duration)) {
            setTotalDuration(Math.floor(data.info.duration));
          }
        } else if (data.event === 'onStateChange') {
          if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2 || data.info === 0) {
            setIsPlaying(false);
          }
        }

        // 2. Vimeo postMessage events
        if (data.event === 'timeupdate' && data.data) {
          if (typeof data.data.seconds === 'number' && !isNaN(data.data.seconds)) {
            updateCurrentTime(Math.floor(data.data.seconds));
          }
          if (typeof data.data.duration === 'number' && data.data.duration > 0 && !isNaN(data.data.duration)) {
            setTotalDuration(Math.floor(data.data.duration));
          }
        } else if (data.event === 'play') {
          setIsPlaying(true);
        } else if (data.event === 'pause' || data.event === 'finish') {
          setIsPlaying(false);
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Iframe onLoad handshake: registers listeners with YouTube and Vimeo embed players
  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'listening',
            id: 1,
            channel: 'widget',
          }),
          '*'
        );
      } catch {}
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            method: 'addEventListener',
            value: 'timeupdate',
          }),
          '*'
        );
      } catch {}
    }
  };

  // Native HTML5 video time tracking
  const handleNativeTimeUpdate = () => {
    if (videoRef.current) {
      const cur = Math.floor(videoRef.current.currentTime);
      updateCurrentTime(cur);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setTotalDuration(Math.floor(videoRef.current.duration));
      }
    }
  };

  const handleNativeLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setTotalDuration(Math.floor(videoRef.current.duration));
    }
  };

  // Universal timeline seek handler across all players
  const handleSeek = (seconds: number) => {
    if (!videoEmbed) return;
    const maxDur = totalDuration > 0 ? totalDuration : 999999;
    const clamped = Math.max(0, Math.min(maxDur, seconds));
    updateCurrentTime(clamped);

    // 1. Direct HTML5 video
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }

    // 2. YouTube via YT.Player API
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(clamped, true);
      } catch {}
    }

    // 3. YouTube postMessage fallback
    if (videoEmbed.type === 'youtube' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [clamped, true],
          }),
          '*'
        );
      } catch {}
    }

    // 4. Vimeo postMessage
    if (videoEmbed.type === 'vimeo' && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            method: 'seekTo',
            value: clamped,
          }),
          '*'
        );
      } catch {}
    }
  };

  // Handle adding a timestamped review note
  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRevisionLocked) {
      setShowChangeOrderModal(true);
      return;
    }
    if (!noteText.trim()) return;
    if (!project) return;

    // Sample latest frame timestamp directly from active player backend
    let finalSeconds = currentSeconds;
    if (videoEmbed?.type === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
      try {
        const cur = ytPlayerRef.current.getCurrentTime();
        if (typeof cur === 'number' && !isNaN(cur)) {
          finalSeconds = Math.floor(cur);
          updateCurrentTime(finalSeconds);
        }
      } catch {}
    } else if (videoRef.current) {
      finalSeconds = Math.floor(videoRef.current.currentTime);
      updateCurrentTime(finalSeconds);
    }
    const finalTimecode = formatTimecode(finalSeconds);

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          timecode: finalTimecode,
          timecodeSeconds: finalSeconds,
          category: activeCategory,
          text: noteText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.note) {
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            reviewNotes: [data.note, ...prev.reviewNotes],
          };
        });
        setNoteText('');
        showToast(`✓ Note saved at ${finalTimecode}`);
      } else {
        alert(data.error || 'Failed to save note');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Approving the Video Cut (I Like It!)
  const handleApproveCut = async () => {
    if (!project) return;
    if (!confirm('Are you happy with this video?\n\nApproving unlocks your final unwatermarked files for download and lets your editor know.')) {
      return;
    }

    setIsApproving(true);
    try {
      const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_cut' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsApproved(true);
        setProject((prev) => prev ? { ...prev, isApproved: true, status: 'approved' } : prev);
        showToast('✓ Video Approved! Your final files are ready.');
      } else {
        alert(data.error || 'Failed to approve video cut');
      }
    } catch (err: any) {
      alert(err.message || 'Network error approving video');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Requesting Revision Changes
  const handleRequestRevision = async () => {
    if (!project) return;

    if (currentRound < includedRounds) {
      if (!confirm(`Send revision notes for Round ${currentRound + 1} of ${includedRounds}?\n\nYour editor will update the video with your notes.`)) {
        return;
      }
      try {
        const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_revision' }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const nextR = data.currentRound || currentRound + 1;
          setCurrentRound(nextR);
          setProject((prev) => prev ? { ...prev, currentRound: nextR, status: 'client_revision_requested' } : prev);
          showToast(`✓ Round ${nextR} requested! Your editor has been notified.`);
        } else {
          alert(data.error || 'Failed to request revision');
        }
      } catch (err: any) {
        alert(err.message || 'Network error requesting revision');
      }
    } else {
      setShowChangeOrderModal(true);
    }
  };

  // Requirement 2 & 3: Unlock Extra Revision Pass via 50% Fee Payment
  const handleUnlockExtraRevision = async () => {
    if (!project) return;
    try {
      setIsUnlockingRound(true);
      const isLoaded = await loadRazorpayScript();
      const RazorpayClass = typeof window !== 'undefined' ? (window as any).Razorpay : null;

      // 1. Create order on server
      const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}/extra-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_order' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to initialize extra revision pass');
        setIsUnlockingRound(false);
        return;
      }

      // If simulated mock order (e.g. offline dev or mock test)
      if (data.razorpayOrderId?.startsWith('order_mock_') || !RazorpayClass) {
        const verifyRes = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}/extra-revision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_payment',
            razorpay_order_id: data.razorpayOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_sig',
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.success) {
          const nextIncluded = verifyData.includedRounds || (includedRounds + 1);
          setIncludedRounds(nextIncluded);
          setProject((prev) => prev ? { ...prev, includedRounds: nextIncluded } : prev);
          setShowChangeOrderModal(false);
          showToast(`✓ Round ${currentRound} unlocked! You can now leave notes.`);
        } else {
          alert(verifyData.error || 'Verification failed');
        }
        setIsUnlockingRound(false);
        return;
      }

      // 2. Real Razorpay modal
      const rzp = new RazorpayClass({
        key: data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Artsy Production',
        description: `Additional Revision Pass — Round ${currentRound}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#1D1D1F' },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}/extra-revision`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'verify_payment',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              const nextIncluded = verifyData.includedRounds || (includedRounds + 1);
              setIncludedRounds(nextIncluded);
              setProject((prev) => prev ? { ...prev, includedRounds: nextIncluded } : prev);
              setShowChangeOrderModal(false);
              showToast(`✓ Round ${currentRound} unlocked! You can now leave notes.`);
            } else {
              alert(verifyData.error || 'Payment verification failed');
            }
          } catch (err: any) {
            alert(err.message || 'Payment processing error');
          } finally {
            setIsUnlockingRound(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsUnlockingRound(false);
          },
        },
      });

      rzp.on('payment.failed', function (failResp: any) {
        alert(failResp?.error?.description || 'Payment was unsuccessful. Please try again.');
        setIsUnlockingRound(false);
      });

      rzp.open();
    } catch (e: any) {
      alert(e.message || 'Payment failed to initialize');
      setIsUnlockingRound(false);
    }
  };

  const handleSaveStudioProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_client_profile', JSON.stringify(studioProfile));
    }
    setStudioSavedNotice(true);
    setTimeout(() => {
      setStudioSavedNotice(false);
      setShowStudioModal(false);
    }, 1000);
  };

  const handleSubmitRefundDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      alert('Please describe your concern or reason.');
      return;
    }
    if (project) {
      logRefundRequest(project.id, user?.id || 'client', 800000, refundReason);
    }
    setShowRefundModal(false);
    showToast('Dispute submitted: Our studio lead will review your project within 24 hours.');
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 bg-[#F5F5F7] min-h-screen">
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 bg-[#1D1D1F] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold border border-white/20 animate-fade-in flex items-center gap-2">
              <span>{toastMessage}</span>
            </div>
          )}

          {loadingProject ? (
            <div className="p-12 text-center text-xs text-[#86868B] flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Loading video review suite...</span>
            </div>
          ) : hasProjects === false || !project ? (
            <div className="p-6 md:p-8 max-w-4xl mx-auto pt-16">
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8 space-y-3 shadow-xs">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">No video drafts to review yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  When your editor uploads a cut, it will appear here so you can review and leave timestamped notes.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  Start New Project →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-full overflow-x-hidden">
              
              {/* ORDER BANNER */}
              <section className="p-4 sm:p-5 lg:p-6 pb-0 max-w-[1400px] mx-auto w-full">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5E7]/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                  <div className="flex flex-col xl:flex-row xl:items-stretch justify-between gap-4">
                    {/* Title & Details */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#3B82F6] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {project.orderNumber}
                        </span>
                        <span className="text-xs text-[#86868B]">•</span>
                        <span className="text-[11px] font-semibold text-[#3B82F6]">
                          Draft v{currentRound}.0 • Round {currentRound} of {includedRounds}
                        </span>
                        <span className="text-xs text-[#86868B]">•</span>
                        <span className="text-[11px] text-[#86868B]">
                          Editor: <strong className="text-[#1D1D1F]">{project.creatorName ? formatPublicCreatorName(project.creatorName) : 'Senior Lead Editor'}</strong>
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                        {project.title}
                      </h1>
                    </div>

                    {/* Quick Metrics */}
                    <div className="flex items-stretch gap-2.5 self-start xl:self-auto">
                      <div className="bg-[#F5F5F7] p-3 rounded-xl border border-[#E5E5E7] min-w-[115px]">
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">Delivery Time</div>
                        <div className="text-sm font-bold text-[#1D1D1F] mt-0.5">{project.turnaround}</div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">
                          {project.extendedDeliveryDays && project.extendedDeliveryDays > 0
                            ? `+${project.extendedDeliveryDays}d for extra rounds`
                            : 'Estimated delivery'}
                        </div>
                      </div>
                      <div className="bg-[#F5F5F7] p-3 rounded-xl border border-[#E5E5E7] min-w-[115px]">
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">Revisions</div>
                        <div className={`text-sm font-bold mt-0.5 ${isRevisionLocked ? 'text-amber-600' : 'text-[#3B82F6]'}`}>
                          Round {currentRound} of {includedRounds}
                        </div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">
                          {isRevisionLocked
                            ? `Extra round (+₹${(extraRevisionFeePaise / 100).toLocaleString('en-IN')})`
                            : currentRound < includedRounds
                            ? 'Included with project'
                            : 'Last included round'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS STEPPER */}
                  <div className="mt-4 pt-4 border-t border-[#F5F5F7] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div className="p-2.5 sm:p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">1. Footage</div>
                        <div className="text-xs font-semibold text-[#1D1D1F]">Received ✓</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">2. Editing</div>
                        <div className="text-xs font-semibold text-[#1D1D1F]">
                          {videoEmbed ? 'Draft Ready ✓' : 'In Progress'}
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between ${
                      videoEmbed && !isApproved ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30' : 'bg-[#F5F5F7] border-[#E5E5E7]'
                    }`}>
                      <div>
                        <div className={`text-[10px] uppercase font-bold tracking-wider ${videoEmbed && !isApproved ? 'text-[#3B82F6]' : 'text-[#86868B]'}`}>
                          3. Review
                        </div>
                        <div className="text-xs font-bold text-[#1D1D1F]">
                          {isApproved ? 'Approved ✓' : videoEmbed ? 'In Review' : 'Awaiting Draft'}
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-500' : videoEmbed ? 'bg-[#3B82F6] animate-ping' : 'bg-gray-400'}`}></span>
                    </div>

                    <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between ${
                      isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#F5F5F7] border-[#E5E5E7] text-[#86868B]'
                    }`}>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider">4. Final Master</div>
                        <div className="text-xs font-semibold">{isApproved ? 'Unlocked ✓' : 'Unlocks on approval 🔒'}</div>
                      </div>
                      <span>{isApproved ? '✓' : '🔒'}</span>
                    </div>
                  </div>

                  {/* COMPACT REVISION STEPPER */}
                  <div className="mt-3 pt-3 border-t border-[#E5E5E7] flex items-center justify-end text-xs">
                    {/* Stepper Steps */}
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#86868B]">
                      <span className={`flex items-center gap-1 ${currentRound >= 1 ? 'text-[#1D1D1F] font-semibold' : ''}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          currentRound > 1 || (currentRound === 1 && isRevisionRequested) || isApproved
                            ? 'bg-emerald-500 text-white'
                            : currentRound === 1
                            ? 'bg-[#1D1D1F] text-white'
                            : 'bg-[#E5E5E7] text-[#86868B]'
                        }`}>
                          {currentRound > 1 || (currentRound === 1 && isRevisionRequested) || isApproved ? '✓' : '1'}
                        </span>
                        <span>Round 1</span>
                      </span>

                      <span className="text-[#E5E5E7]">→</span>

                      <span className={`flex items-center gap-1 ${currentRound >= 2 ? 'text-[#1D1D1F] font-semibold' : ''}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          currentRound > 2 || (currentRound === 2 && isRevisionRequested) || isApproved
                            ? 'bg-emerald-500 text-white'
                            : currentRound === 2
                            ? 'bg-[#1D1D1F] text-white'
                            : 'bg-[#E5E5E7] text-[#86868B]'
                        }`}>
                          {currentRound > 2 || (currentRound === 2 && isRevisionRequested) || isApproved ? '✓' : '2'}
                        </span>
                        <span>Round 2</span>
                      </span>

                      <span className="text-[#E5E5E7]">→</span>

                      <span className={`flex items-center gap-1 ${isApproved ? 'text-emerald-700 font-semibold' : ''}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isApproved ? 'bg-emerald-500 text-white' : 'bg-[#E5E5E7] text-[#86868B]'
                        }`}>
                          {isApproved ? '✓' : '3'}
                        </span>
                        <span>Final Sign-off</span>
                      </span>
                    </div>

                  </div>
                </div>
              </section>

              {/* MAIN WORKSPACE */}
              <div className="p-4 sm:p-5 lg:p-6 space-y-5 max-w-[1400px] mx-auto w-full">
                
                {/* TOP REVIEW ACTION BAR */}
                {videoEmbed && (
                  <div className={`border rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                    isApproved
                      ? 'bg-emerald-50 border-emerald-200'
                      : isRevisionRequested
                      ? 'bg-amber-50/70 border-amber-200'
                      : isRevisionLocked
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-200/80'
                  }`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎬</span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-[#1D1D1F]">
                          {isApproved
                            ? 'Video Cut Approved'
                            : isRevisionRequested
                            ? `Round ${currentRound - 1} Notes Sent — Editor Cutting v${currentRound}.0`
                            : isRevisionLocked
                            ? 'All Included Rounds Completed'
                            : `Draft v${currentRound}.0 Ready for Review`}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isRevisionRequested
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isRevisionLocked
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isApproved
                            ? 'APPROVED'
                            : isRevisionRequested
                            ? 'IN REVISION'
                            : isRevisionLocked
                            ? 'LOCKED'
                            : `ROUND ${currentRound}`}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-[#86868B]">
                        {isApproved
                          ? 'Your video is approved! You can download your final unwatermarked files below.'
                          : isRevisionRequested
                          ? `Your editor is working on version v${currentRound}.0 with your notes. You will be notified when it is ready.`
                          : isRevisionLocked
                          ? `You have used your ${includedRounds} included review rounds. You can approve this cut or unlock an extra round.`
                          : 'Watch your video below. Approve if you love it, or leave notes on the timeline to request changes.'}
                      </p>
                      {!isApproved && addressedNotesCount > 0 && (
                        <div className="pt-0.5 flex items-center gap-1.5">
                          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-white/90 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">
                            <span className="text-emerald-600 font-extrabold">✓</span>
                            <span>{addressedNotesCount} {addressedNotesCount === 1 ? 'change' : 'changes'} addressed in this cut</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {videoEmbed.originalUrl && (
                        <a
                          href={videoEmbed.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-lg transition-all inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>Open Link</span>
                          <span>↗</span>
                        </a>
                      )}

                      {!isApproved ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRequestRevision}
                            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            Request Changes →
                          </button>
                          <button
                            type="button"
                            onClick={handleApproveCut}
                            disabled={isApproving}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            <span>{isApproving ? 'Approving...' : '✓ Approve Video'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs">
                            <span>✓ Video Approved</span>
                          </div>
                          <Link
                            href="/client/masters"
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-xs"
                          >
                            <span>Download Final Files →</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* LEFT 8 COLS: UNIVERSAL VIDEO PLAYER & TIMELINE */}
                  <div className="lg:col-span-8 min-w-0 bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5E7]/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                    <div>
                      {/* Player Header Bar */}
                      <div className="flex flex-wrap items-center justify-between pb-2 mb-3 border-b border-[#F5F5F7] gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${videoEmbed ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                          <span className="text-xs font-bold text-[#1D1D1F]">
                            {videoEmbed ? 'Video Preview' : 'In Production'}
                          </span>
                          {videoEmbed && (
                            <span className="text-[10px] uppercase font-bold text-[#86868B] bg-[#F5F5F7] px-2 py-0.5 rounded">
                              {videoEmbed.type === 'gdrive' ? (useDriveIframeFallback ? 'Drive Embed' : 'HD Preview') : videoEmbed.type}
                            </span>
                          )}
                          {videoEmbed?.type === 'gdrive' && (
                            <button
                              type="button"
                              onClick={() => setUseDriveIframeFallback((prev) => !prev)}
                              className="text-[10px] font-semibold text-[#3B82F6] hover:underline cursor-pointer ml-1"
                              title="Toggle viewer"
                            >
                              {useDriveIframeFallback ? 'Switch to Synced Player 🎬' : 'Drive View ↗'}
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-[#86868B]">
                          Press Space to play/pause
                        </span>
                      </div>

                      {/* 16:9 Cinema Container */}
                      <div className="relative w-full aspect-video bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-lg group flex items-center justify-center">
                        
                        {/* 1. Direct HTML5 Video Player */}
                        {videoEmbed?.type === 'direct' && (
                          <video
                            ref={videoRef}
                            src={videoEmbed.embedUrl}
                            controls
                            className="w-full h-full object-contain bg-black"
                            onTimeUpdate={handleNativeTimeUpdate}
                            onLoadedMetadata={handleNativeLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        )}

                        {/* 2. YouTube Embed */}
                        {videoEmbed?.type === 'youtube' && (
                          <iframe
                            id="artsy-yt-player"
                            ref={iframeRef}
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                            onLoad={handleIframeLoad}
                          />
                        )}

                        {/* 3. Google Drive Video Preview Player (Native Synced Stream with Iframe Fallback) */}
                        {videoEmbed?.type === 'gdrive' && !useDriveIframeFallback && (
                          <video
                            ref={videoRef}
                            src={videoEmbed.streamUrl || `/api/video/stream?id=${videoEmbed.videoId}`}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain bg-black"
                            onTimeUpdate={handleNativeTimeUpdate}
                            onLoadedMetadata={handleNativeLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onError={(e) => {
                              const err = e.currentTarget.error;
                              if (err && err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                                console.warn('[Native Video Stream Unsupported, falling back to Drive Embed]:', err);
                                setUseDriveIframeFallback(true);
                              }
                            }}
                          />
                        )}

                        {videoEmbed?.type === 'gdrive' && useDriveIframeFallback && (
                          <iframe
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        )}

                        {/* 4. Vimeo Embed */}
                        {videoEmbed?.type === 'vimeo' && (
                          <iframe
                            id="artsy-vimeo-player"
                            ref={iframeRef}
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                            onLoad={handleIframeLoad}
                          />
                        )}

                        {/* 5. Loom Embed */}
                        {videoEmbed?.type === 'loom' && (
                          <iframe
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        )}

                        {/* 6. Cloud Storage / Folder Fallback */}
                        {videoEmbed?.type === 'cloud' && (
                          <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                              📁
                            </div>
                            <div className="space-y-1 max-w-md">
                              <h3 className="text-base font-bold">Cloud Deliverable</h3>
                              <p className="text-xs text-white/70 leading-relaxed">
                                Your editor shared a cloud storage folder for this cut. Open it to view full resolution files, then leave notes below.
                              </p>
                            </div>
                            <a
                              href={videoEmbed.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
                            >
                              <span>Open Folder</span>
                              <span>↗</span>
                            </a>
                          </div>
                        )}

                        {/* 7. Empty State (Creator has not submitted yet) */}
                        {!videoEmbed && (
                          <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl animate-pulse">
                              ✂️
                            </div>
                            <div className="space-y-1 max-w-md">
                              <h3 className="text-base font-bold">Video In Production</h3>
                              <p className="text-xs text-white/70 leading-relaxed">
                                Your editor <strong className="text-white">{project.creatorName ? formatPublicCreatorName(project.creatorName) : 'Senior Lead Editor'}</strong> is editing your video. When the draft cut is uploaded, it will play here for your review.
                              </p>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                              Estimated Delivery: {project.turnaround}
                            </span>
                          </div>
                        )}


                        {/* Approved Badge Overlay */}
                        {isApproved && (
                          <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider shadow-lg z-20">
                            APPROVED ✓
                          </div>
                        )}
                      </div>

                      {/* TIMELINE & SCRUBBER MODULE */}
                      {videoEmbed ? (
                        <div className="mt-3.5 bg-[#F5F5F7] rounded-xl p-3 border border-[#E5E5E7] space-y-2.5">
                          {/* Interactive Playbar with Note Markers */}
                          <div
                            className="relative w-full h-2.5 hover:h-3 bg-[#E5E5E7] hover:bg-[#DEDEE0] rounded-full cursor-pointer group transition-all"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                              const targetSecs = Math.floor(ratio * (totalDuration > 0 ? totalDuration : 180));
                              handleSeek(targetSecs);
                            }}
                            title="Click anywhere to scrub timeline"
                          >
                            {/* Blue Progress Bar */}
                            <div
                              className="h-full bg-[#3B82F6] rounded-full transition-all relative pointer-events-none"
                              style={{
                                width: `${totalDuration > 0 ? Math.min(100, Math.max(1, (currentSeconds / totalDuration) * 100)) : 0}%`,
                              }}
                            />

                            {/* Timestamp Note Markers along the Playbar */}
                            {totalDuration > 0 && project.reviewNotes.map((rev) => {
                              if (typeof rev.timecodeSeconds !== 'number') return null;
                              const markerPct = Math.min(99.2, Math.max(0.8, (rev.timecodeSeconds / totalDuration) * 100));
                              const isAddressed = rev.isAddressed || String(rev.status || '').toLowerCase().includes('addressed');
                              return (
                                <button
                                  key={`marker-${rev.id}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSeek(rev.timecodeSeconds || 0);
                                  }}
                                  style={{ left: `${markerPct}%` }}
                                  className={`absolute top-1/2 -translate-y-1/2 -ml-[3.5px] w-2 h-2 rounded-full cursor-pointer z-10 transition-transform hover:scale-175 shadow-xs border-2 border-white ${
                                    isAddressed ? 'bg-emerald-500' : 'bg-amber-400'
                                  }`}
                                  title={`⏱ ${rev.timecode} [${rev.tag}]: "${rev.text}" (Click to jump)`}
                                />
                              );
                            })}
                          </div>

                          {/* Controller Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            {/* Left: Play/Pause, Rewind/Forward, Speed */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleTogglePlayPause}
                                className="px-2 py-0.5 bg-[#1D1D1F] hover:bg-black text-white rounded-md text-xs font-semibold cursor-pointer transition-colors"
                                title="Play / Pause video (Spacebar)"
                              >
                                {isPlaying ? '⏸ Pause' : '▶ Play'}
                              </button>

                              <div className="flex items-center bg-white border border-[#E5E5E7] rounded-md px-1 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleSeek(Math.max(0, currentSeconds - 5))}
                                  className="px-1.5 py-0.5 text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] rounded cursor-pointer"
                                  title="Rewind 5s (Left Arrow)"
                                >
                                  -5s
                                </button>
                                <span className="w-px h-3 bg-[#E5E5E7] mx-0.5"></span>
                                <button
                                  type="button"
                                  onClick={() => handleSeek(Math.min(totalDuration > 0 ? totalDuration : 999999, currentSeconds + 5))}
                                  className="px-1.5 py-0.5 text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] rounded cursor-pointer"
                                  title="Forward 5s (Right Arrow)"
                                >
                                  +5s
                                </button>
                              </div>

                              {/* Simple Speed Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
                                  handleSpeedChange(nextSpeed);
                                }}
                                className="px-2 py-0.5 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-medium text-[#1D1D1F] rounded-md cursor-pointer"
                                title="Click to cycle playback speed (1x / 1.25x / 1.5x)"
                              >
                                {playbackSpeed}x
                              </button>
                            </div>

                            {/* Right: Clean Timecode & Tag Button */}
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#1D1D1F]">
                                {currentTimecode} <span className="text-[#86868B]">/ {formatTimecode(totalDuration)}</span>
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (videoEmbed?.type === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
                                    try {
                                      const cur = ytPlayerRef.current.getCurrentTime();
                                      if (typeof cur === 'number' && !isNaN(cur)) {
                                        updateCurrentTime(Math.floor(cur));
                                      }
                                    } catch {}
                                  } else if (videoRef.current) {
                                    updateCurrentTime(Math.floor(videoRef.current.currentTime));
                                  }
                                  showToast(`Captured time: ${currentTimecode}`);
                                  noteTextareaRef.current?.focus();
                                }}
                                className="px-2.5 py-0.5 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-medium text-[#1D1D1F] rounded-md cursor-pointer transition-colors"
                              >
                                Tag Time
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3.5 p-3.5 bg-[#F5F5F7] rounded-xl border border-dashed border-[#E5E5E7] text-center space-y-1">
                          <div className="text-xs font-bold text-[#1D1D1F]">
                            Interactive Timeline &amp; Notes
                          </div>
                          <p className="text-[11px] text-[#86868B]">
                            This playback bar and note tagger will unlock as soon as your draft cut is ready.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Hotkeys Bar */}
                    <div className="mt-3 pt-2 border-t border-[#F5F5F7] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#86868B]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#1D1D1F]">Tip:</span>
                        <span>Pause anytime to leave a note at that exact second.</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#86868B]">
                        {project.reviewNotes.length} {project.reviewNotes.length === 1 ? 'Note' : 'Notes'}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT 4 COLS: NOTES & FEEDBACK */}
                  <div className="lg:col-span-4 min-w-0 bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5E7]/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-[#F5F5F7]">
                        <div>
                          <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F]">Notes &amp; Feedback</h2>
                          <p className="text-[11px] text-[#86868B]">
                            {addressedNotesCount > 0
                              ? `${addressedNotesCount} of ${project.reviewNotes.length} notes addressed in this cut`
                              : 'Notes for your editor'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {addressedNotesCount > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                              ✓ {addressedNotesCount} Addressed
                            </span>
                          )}

                        </div>
                      </div>

                      {/* REVISION LIST */}
                      <div className="mt-2.5 space-y-2 overflow-y-auto max-h-[300px] sm:max-h-[340px] pr-1">
                        {project.reviewNotes.length === 0 ? (
                          <div className="text-center py-6 text-xs text-[#86868B] bg-[#F5F5F7] rounded-xl border border-dashed border-[#E5E5E7] p-3">
                            No notes yet. Pause the video anytime to leave a timestamped note.
                          </div>
                        ) : (
                          project.reviewNotes.map((rev) => {
                            const isNoteAddressed = rev.isAddressed || String(rev.status || '').toLowerCase().includes('addressed') || String(rev.status || '').toLowerCase().includes('resolved');
                            const isNoteActive = isPlaying && typeof rev.timecodeSeconds === 'number' && Math.abs(currentSeconds - rev.timecodeSeconds) <= 1;
                            return (
                              <div
                                key={rev.id}
                                className={`p-2.5 sm:p-3 rounded-lg border transition-all space-y-1 ${
                                  isNoteActive
                                    ? 'ring-2 ring-[#3B82F6] shadow-md bg-blue-50/70 border-[#3B82F6]/60'
                                    : isNoteAddressed
                                    ? 'bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-300'
                                    : 'bg-[#F5F5F7] border-[#E5E5E7] hover:border-[#3B82F6]/40'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#E5E5E7]/70 text-xs">
                                  <div className="flex items-center gap-1.5 font-mono text-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleSeek(rev.timecodeSeconds || 0)}
                                      className="font-bold text-[#1D1D1F] hover:text-[#3B82F6] cursor-pointer"
                                      title="Jump to this time"
                                    >
                                      {rev.timecode}
                                    </button>
                                    <span className="text-[#86868B] text-[11px]">·</span>
                                    <span className="text-[11px] font-sans font-medium text-[#86868B]">
                                      {formatCategoryLabel(rev.tag)}
                                    </span>
                                    <span className="text-[#86868B] text-[11px]">·</span>
                                    <span className="text-[11px] font-sans font-medium text-[#86868B]">
                                      Round {rev.round || (rev.isAddressed ? 1 : currentRound)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-[#1D1D1F] leading-snug font-medium">
                                  &ldquo;{rev.text}&rdquo;
                                </p>
                                <div className="pt-1 flex items-center justify-between text-xs">
                                  {isNoteAddressed ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                                      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>✓ Done in this cut</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                      <span>Queued for editor</span>
                                    </span>
                                  )}
                                  {typeof rev.timecodeSeconds === 'number' && (
                                    <button
                                      type="button"
                                      onClick={() => handleSeek(rev.timecodeSeconds || 0)}
                                      className="text-[11px] font-bold text-[#3B82F6] hover:underline cursor-pointer"
                                    >
                                      Jump to time →
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* NEW ANNOTATION FORM OR LOCKED REVISION SLATE */}
                    {isRevisionLocked ? (
                      <div className="bg-[#1D1D1F] rounded-2xl p-4 border border-white/10 text-white space-y-3 shadow-xl relative overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                              🔒
                            </span>
                            <span className="text-xs font-bold text-white tracking-wide">
                              Revisions Locked
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full">
                            Round {currentRound}
                          </span>
                        </div>

                        <p className="text-[11px] text-white/75 leading-relaxed">
                          Your <strong>{includedRounds} included revision rounds</strong> are complete. To leave notes and request changes for Round {currentRound}, unlock this round below.
                        </p>

                        {/* Fee breakdown box */}
                        <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-white/50">Extra Round Fee (50%)</div>
                            <div className="text-[11px] text-white/80 mt-0.5">50% of ₹{(totalAmountPaidPaise / 100).toLocaleString('en-IN')} order total</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-amber-400 font-mono">
                              ₹{(extraRevisionFeePaise / 100).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[9px] text-white/50">GST inclusive</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleUnlockExtraRevision}
                          disabled={isUnlockingRound}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 text-center"
                        >
                          <span>
                            {isUnlockingRound
                              ? 'Connecting...'
                              : `Unlock Round ${currentRound} (+₹${(extraRevisionFeePaise / 100).toLocaleString('en-IN')}) →`}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleAddAnnotation}
                        className="bg-[#F5F5F7] rounded-xl p-3 border border-[#E5E5E7] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#1D1D1F]">Add a Note</span>
                          <span className="text-xs font-mono text-[#86868B]">
                            {currentTimecode}
                          </span>
                        </div>

                        {/* Category Dropdown */}
                        <div>
                          <label htmlFor="note-category-select" className="block text-[10px] font-semibold text-[#86868B] mb-0.5">
                            Category
                          </label>
                          <div className="relative">
                            <select
                              id="note-category-select"
                              value={activeCategory}
                              onChange={(e) => setActiveCategory(e.target.value)}
                              className="w-full bg-white border border-[#E5E5E7] text-[#1D1D1F] rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-semibold focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] outline-none cursor-pointer appearance-none transition-colors shadow-2xs"
                            >
                              <option value="COLOR">🎨 Color &amp; Grading</option>
                              <option value="AUDIO">🔊 Audio &amp; Music</option>
                              <option value="PACING">⏱ Pacing &amp; Timing</option>
                              <option value="TITLES">✏️ Titles &amp; Text</option>
                              <option value="FOOTAGE">✂️ Cut &amp; B-Roll</option>
                              <option value="VFX">✨ Effects &amp; VFX</option>
                              <option value="FRAMING">💡 Framing &amp; Lighting</option>
                              <option value="GENERAL">💬 General Note</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-[#86868B]">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Feedback Input */}
                        <div className="space-y-1.5">
                          <textarea
                            ref={noteTextareaRef}
                            required
                            rows={2}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder={getCategoryPlaceholder(activeCategory)}
                            className="w-full bg-white rounded-lg border border-[#E5E5E7] p-2 text-xs text-[#1D1D1F] focus:border-[#3B82F6] outline-none resize-none"
                          ></textarea>
                          <button
                            type="submit"
                            disabled={isSubmittingNote}
                            className="w-full py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            {isSubmittingNote ? 'Saving...' : `Save Note at ${currentTimecode}`}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* BOTTOM SUITE: ASSET & DELIVERABLES */}
                <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5E7]/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#F5F5F7] gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F]">
                        Project Files &amp; Deliverables
                      </h3>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        Download draft files or view project assets.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Storage Active
                    </span>
                  </div>

                  {/* 4-Tile Bento Asset Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Asset 1: Master Video Cut */}
                    <div className="bg-[#F5F5F7] p-3.5 sm:p-4 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md">
                            MASTER CUT
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">
                            {isApproved ? 'FINAL 4K' : 'DRAFT'}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1D1D1F] leading-snug">
                          {project.title}
                        </h4>
                        <p className="text-[11px] text-[#86868B] mt-1 leading-relaxed">
                          {project.deliverableUrl
                            ? 'High-resolution cut uploaded for your review.'
                            : 'Your editor is preparing this video cut.'}
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600">
                          {project.deliverableUrl ? 'Ready' : 'Pending'}
                        </span>
                        {project.deliverableUrl ? (
                          <a
                            href={project.deliverableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                          >
                            Open Video ↗
                          </a>
                        ) : (
                          <span className="text-xs text-[#86868B]">In progress</span>
                        )}
                      </div>
                    </div>

                    {/* Asset 2: Raw Footage */}
                    <div className="bg-[#F5F5F7] p-3.5 sm:p-4 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#1D1D1F] text-white rounded-md">
                            RAW FOOTAGE
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">VAULT</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1D1D1F] leading-snug">
                          Raw Camera Files
                        </h4>
                        <p className="text-[11px] text-[#86868B] mt-1 leading-relaxed">
                          Original footage uploaded during project booking.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#86868B]">Cloud Storage</span>
                        {project.rawFootageUrl ? (
                          <a
                            href={project.rawFootageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                          >
                            View Files ↗
                          </a>
                        ) : (
                          <span className="text-xs text-[#86868B]">Linked</span>
                        )}
                      </div>
                    </div>

                    {/* Asset 3: Audio & Music */}
                    <div className="bg-[#F5F5F7] p-3.5 sm:p-4 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                            AUDIO
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">SYNCED</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1D1D1F] leading-snug">
                          Music &amp; Audio Mix
                        </h4>
                        <p className="text-[11px] text-[#86868B] mt-1 leading-relaxed">
                          Clean dialogue, background music, and sound design.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600">Active</span>
                        <span className="text-xs text-[#86868B]">Conformed</span>
                      </div>
                    </div>

                    {/* Asset 4: Color Look */}
                    <div className="bg-[#F5F5F7] p-3.5 sm:p-4 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                            COLOR
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">REC.709</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#1D1D1F] leading-snug">
                          Color Grade
                        </h4>
                        <p className="text-[11px] text-[#86868B] mt-1 leading-relaxed">
                          Natural skin tones and cinematic finish.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#86868B]">Studio Grade</span>
                        <span className="text-xs text-emerald-600 font-semibold">Conformed</span>
                      </div>
                    </div>
                  </div>

                  {/* CALL-TO-ACTION APPROVAL GATE */}
                  <div className="bg-[#1D1D1F] text-white rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider">
                          FINAL APPROVAL
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {isApproved ? 'Video Approved' : 'Ready to approve this video?'}
                      </h3>
                      <p className="text-xs text-[#86868B] max-w-2xl leading-relaxed">
                        {isApproved
                          ? 'This cut is approved. You can download your final unwatermarked files anytime.'
                          : 'Approving confirms this cut as final. If you want any changes first, add your notes on the timeline above and request changes.'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
                      {!isApproved ? (
                        <>
                          <button
                            type="button"
                            onClick={isRevisionLocked ? handleUnlockExtraRevision : handleRequestRevision}
                            disabled={isUnlockingRound}
                            className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition-all text-center cursor-pointer ${
                              isRevisionLocked
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                          >
                            {isRevisionLocked
                              ? (isUnlockingRound ? 'Opening Gateway...' : `Unlock Round ${currentRound} (+₹${(extraRevisionFeePaise / 100).toLocaleString('en-IN')})`)
                              : currentRound < includedRounds
                              ? `Request Changes (Round ${currentRound + 1} of ${includedRounds})`
                              : `Request Extra Changes (+₹${(extraRevisionFeePaise / 100).toLocaleString('en-IN')})`}
                          </button>
                          <button
                            type="button"
                            onClick={handleApproveCut}
                            disabled={isApproving}
                            className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <span>{isApproving ? 'Approving...' : '✓ Approve Video'}</span>
                          </button>
                        </>
                      ) : (
                        project.deliverableUrl && (
                          <a
                            href={project.deliverableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <span>Open Final Files</span>
                            <span>↗</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Refund Policy Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                  SATISFACTION GUARANTEE
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Refund &amp; Cancellation Policy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#86868B]">
              <p>Under Artsy Production&apos;s 3-Tier Policy, you are entitled to full review oversight. If the draft cut does not meet the confirmed project brief, our studio supervisor will personally arbitrate.</p>
            </div>

            <form onSubmit={handleSubmitRefundDispute} className="space-y-3">
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Describe why this edit did not meet your requirements..."
                className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer"
                >
                  Submit Dispute to Studio Lead
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ORDER MODAL */}
      {showChangeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
              <h3 className="text-lg font-extrabold text-[#1D1D1F]">
                Unlock Extra Revision
              </h3>
              <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Round {currentRound}
              </span>
            </div>

            <p className="text-xs text-[#86868B] leading-relaxed">
              Your {includedRounds} included revision rounds are complete. You can unlock another revision round for 50% of your order total.
            </p>

            <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Order Total:</span>
                <span className="font-mono">₹{(totalAmountPaidPaise / 100).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Revision Round:</span>
                <span>Round {currentRound}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Extra Time:</span>
                <span className="text-emerald-700 font-bold">+2 Days</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Delivery:</span>
                <span>Within 48 Hours</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#1D1D1F] pt-2 border-t border-[#E5E5E7]">
                <span>Price (50%):</span>
                <span className="font-mono text-[#3B82F6]">
                  ₹{(extraRevisionFeePaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleUnlockExtraRevision}
                disabled={isUnlockingRound}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-2"
              >
                <span>
                  {isUnlockingRound
                    ? 'Connecting...'
                    : `Pay ₹${(extraRevisionFeePaise / 100).toLocaleString('en-IN')} via Razorpay`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowChangeOrderModal(false)}
                className="px-4 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDIO ONBOARDING & PREFERENCES MODAL */}
      {showStudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-[#E5E5E7] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#F5F5F7] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#3B82F6] tracking-wider">
                  Client Station Preferences
                </span>
                <h3 className="text-xl font-extrabold text-[#1D1D1F] mt-1 tracking-tight">
                  Studio Workspace &amp; Ingest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStudioModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {studioSavedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>✓</span>
                <span>Studio preferences saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveStudioProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Studio / Brand Moniker
                </label>
                <input
                  type="text"
                  required
                  value={studioProfile.studioName}
                  onChange={(e) => setStudioProfile({ ...studioProfile, studioName: e.target.value })}
                  className="w-full bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all font-semibold"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                >
                  Save Studio Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudioModal(false)}
                  className="px-5 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
