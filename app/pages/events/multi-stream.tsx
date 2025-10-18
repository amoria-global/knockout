"use client";

import React, { useState, useRef, useEffect } from "react";

interface Stream {
  id: string;
  videoSrc: string;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  isFullscreen: boolean;
  volume: number;
  quality: string;
  isRecording: boolean;
  showVolumeSlider: boolean;
}

// Main MultiStream Component
const MultiStream = () => {
  // State for managing multiple streams
  const [streams, setStreams] = useState<Stream[]>([
    {
      id: "stream-1",
      videoSrc: "/live-stream.mp4",
      isPlaying: false,
      isMuted: false,
      progress: 0,
      isFullscreen: false,
      volume: 0.4, // 40% volume by default
      quality: "auto",
      isRecording: false,
      showVolumeSlider: false
    },
    {
      id: "stream-2",
      videoSrc: "/live-stream-2.mp4",
      isPlaying: false,
      isMuted: true, // Muted by default
      progress: 0,
      isFullscreen: false,
      volume: 0, // Muted by default (0 volume)
      quality: "auto",
      isRecording: false,
      showVolumeSlider: false
    }
  ]);

  // Refs for video elements
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // State for modals
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<{ [key: string]: boolean }>({}); // Track emoji picker for each stream
  const [showParticipants, setShowParticipants] = useState<{ [key: string]: boolean }>({});
  const [newStreamId, setNewStreamId] = useState("");
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showVolumeWarning, setShowVolumeWarning] = useState(false);

  // State for focused stream (keyboard shortcuts target)
  const [focusedStreamId, setFocusedStreamId] = useState<string | null>(streams[0]?.id || null);

  // Emoji reactions state for each stream
  const [activeReactions, setActiveReactions] = useState<{
    [key: string]: Array<{ id: number; emoji: string; timestamp: number }>
  }>({});

  // Chat state - Track chat state per stream
  const [openChats, setOpenChats] = useState<{ [key: string]: boolean }>({});

  // Messages per stream - each stream has its own message array
  const [streamMessages, setStreamMessages] = useState<{ [key: string]: Array<{
    id: number;
    sender: string;
    text: string;
    time: string;
    delivered: boolean;
  }> }>({
    "stream-1": [
      {
        id: 1,
        sender: "Moise caicedo",
        text: "Hey, I want to wish you a beautiful wedding day filled with love, grace, and blessings your lovely friend.",
        time: "8:30 PM",
        delivered: true,
      },
      {
        id: 2,
        sender: "cole palmer",
        text: "Hey, may your wedding day mark the start of a lifetime of love and blessings your lovely friend.",
        time: "2:00 PM",
        delivered: true,
      },
      {
        id: 3,
        sender: "Enzo fernandez",
        text: "Hey, congratulations on your wedding day; may your union be surrounded by joy, peace, and grace",
        time: "11:00 AM",
        delivered: true,
      }
    ],
    "stream-2": [
      {
        id: 1,
        sender: "Reece james",
        text: "Wishing you both a lifetime of happiness and beautiful moments together on this special day.",
        time: "7:45 PM",
        delivered: true,
      },
      {
        id: 2,
        sender: "malo Gusto",
        text: "Congratulations! May your marriage be filled with endless love and wonderful adventures.",
        time: "1:30 PM",
        delivered: true,
      }
    ]
  });

  const [chatInputs, setChatInputs] = useState<{ [key: string]: string }>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Message modal state
  const [selectedMessage, setSelectedMessage] = useState<{
    id: number;
    sender: string;
    text: string;
    time: string;
    delivered: boolean;
  } | null>(null);

  // Get current time
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamMessages]);

  // Toggle video play/pause for a specific stream
  const togglePlay = (streamId: string) => {
    const video = videoRefs.current[streamId];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      // State will be updated automatically via onPlay/onPause event handlers
    }
  };

  // Toggle video mute for a specific stream
  const toggleMute = (streamId: string) => {
    const video = videoRefs.current[streamId];
    if (video) {
      const currentStream = streams.find(s => s.id === streamId);

      // If trying to unmute this stream
      if (currentStream?.isMuted) {
        // Check if any other stream is currently unmuted
        const hasOtherUnmutedStream = streams.some(s => s.id !== streamId && !s.isMuted && s.volume > 0);

        if (hasOtherUnmutedStream) {
          // Show warning popup
          setShowVolumeWarning(true);
          return; // Don't unmute
        }
      }

      video.muted = !video.muted;
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, isMuted: !s.isMuted } : s
      ));
    }
  };

  // Handle volume change for a specific stream
  const handleVolumeChange = (streamId: string, newVolume: number) => {
    const video = videoRefs.current[streamId];
    if (video) {
      const currentStream = streams.find(s => s.id === streamId);

      // If increasing volume from 0 or unmuting
      if (currentStream && (currentStream.volume === 0 || currentStream.isMuted) && newVolume > 0) {
        // Check if any other stream is currently unmuted
        const hasOtherUnmutedStream = streams.some(s => s.id !== streamId && !s.isMuted && s.volume > 0);

        if (hasOtherUnmutedStream) {
          // Show warning popup
          setShowVolumeWarning(true);
          return; // Don't change volume
        }
      }

      video.volume = newVolume;
      video.muted = newVolume === 0;
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, volume: newVolume, isMuted: newVolume === 0 } : s
      ));
    }
  };

  // Toggle volume slider visibility
  const toggleVolumeSlider = (streamId: string) => {
    setStreams(prev => prev.map(s =>
      s.id === streamId ? { ...s, showVolumeSlider: !s.showVolumeSlider } : s
    ));
  };

  // Update video progress bar for a specific stream
  const handleTimeUpdate = (streamId: string) => {
    const video = videoRefs.current[streamId];
    if (video) {
      const progress = (video.currentTime / video.duration) * 100;
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, progress } : s
      ));
    }
  };

  // Handle adding new livestream
  const handleAddStream = () => {
    if (newStreamId.trim() && streams.length < 2) {
      const newStream: Stream = {
        id: `stream-${Date.now()}`,
        videoSrc: `/api/stream/${newStreamId}`,
        isPlaying: false,
        isMuted: false,
        progress: 0,
        isFullscreen: false,
        volume: 1,
        quality: "auto",
        isRecording: false,
        showVolumeSlider: false
      };
      setStreams(prev => [...prev, newStream]);
      setShowAddStreamModal(false);
      setNewStreamId("");
    }
  };

  // Handle leaving/removing a specific stream
  const handleLeaveStream = (streamId: string) => {
    const updatedStreams = streams.filter(s => s.id !== streamId);

    // If no streams left, redirect to home
    if (updatedStreams.length === 0) {
      window.location.href = '/';
    } else {
      // Remove the stream
      setStreams(updatedStreams);

      // If the focused stream was removed, focus on the first remaining stream
      if (focusedStreamId === streamId) {
        setFocusedStreamId(updatedStreams[0].id);
      }

      // Close any open panels for this stream
      setShowParticipants(prev => {
        const updated = { ...prev };
        delete updated[streamId];
        return updated;
      });
    }
  };

  // Toggle participants panel for specific stream
  const toggleParticipants = (streamId: string) => {
    setShowParticipants(prev => ({
      ...prev,
      [streamId]: !prev[streamId]
    }));
  };

  // Toggle fullscreen for a specific stream
  const toggleFullscreen = (streamId: string) => {
    const video = videoRefs.current[streamId];
    const videoContainer = video?.parentElement;
    if (!videoContainer) return;

    const stream = streams.find(s => s.id === streamId);
    if (!stream) return;

    if (!stream.isFullscreen) {
      // Enter fullscreen
      if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen();
      } else if ((videoContainer as any).webkitRequestFullscreen) {
        (videoContainer as any).webkitRequestFullscreen();
      } else if ((videoContainer as any).mozRequestFullScreen) {
        (videoContainer as any).mozRequestFullScreen();
      } else if ((videoContainer as any).msRequestFullscreen) {
        (videoContainer as any).msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }

    setStreams(prev => prev.map(s =>
      s.id === streamId ? { ...s, isFullscreen: !s.isFullscreen } : s
    ));
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      // Update all streams that might have changed fullscreen state
      setStreams(prev => prev.map(s => ({
        ...s,
        isFullscreen: isCurrentlyFullscreen && videoRefs.current[s.id]?.parentElement === document.fullscreenElement
      })));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Use focused stream ID (or fallback to first stream if none focused)
      const activeStreamId = focusedStreamId || streams[0]?.id;
      if (!activeStreamId) return;

      const activeVideo = videoRefs.current[activeStreamId];
      if (!activeVideo && e.key !== '?') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          // Space or K: Play/Pause the focused stream
          e.preventDefault();
          togglePlay(activeStreamId);
          break;

        case 'm':
          // M: Mute/Unmute the focused stream
          e.preventDefault();
          toggleMute(activeStreamId);
          break;

        case 'f':
          // F: Fullscreen toggle for the focused stream
          e.preventDefault();
          toggleFullscreen(activeStreamId);
          break;

        case '?':
          // ?: Show keyboard shortcuts
          e.preventDefault();
          setShowKeyboardShortcuts(prev => !prev);
          break;

        case 'arrowup':
          // Arrow Up: Increase volume by 10% for focused stream only
          e.preventDefault();
          const currentStream = streams.find(s => s.id === activeStreamId);
          if (currentStream) {
            const newVolume = Math.min(1, currentStream.volume + 0.1);
            handleVolumeChange(activeStreamId, newVolume);
          }
          break;

        case 'arrowdown':
          // Arrow Down: Decrease volume by 10% for focused stream only
          e.preventDefault();
          const currentStreamDown = streams.find(s => s.id === activeStreamId);
          if (currentStreamDown) {
            const newVolume = Math.max(0, currentStreamDown.volume - 0.1);
            handleVolumeChange(activeStreamId, newVolume);
          }
          break;

        case 'arrowright':
          // Arrow Right: Skip forward 5 seconds for focused stream only
          e.preventDefault();
          if (activeVideo) {
            activeVideo.currentTime = Math.min(activeVideo.duration, activeVideo.currentTime + 5);
          }
          break;

        case 'arrowleft':
          // Arrow Left: Skip backward 5 seconds for focused stream only
          e.preventDefault();
          if (activeVideo) {
            activeVideo.currentTime = Math.max(0, activeVideo.currentTime - 5);
          }
          break;

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Number keys: Jump to percentage of video for focused stream only
          e.preventDefault();
          const percentage = parseInt(e.key) / 10;
          if (activeVideo && !isNaN(activeVideo.duration)) {
            activeVideo.currentTime = activeVideo.duration * percentage;
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [streams, focusedStreamId]);


  // Handle emoji reaction for a specific stream
  const handleEmojiReaction = (streamId: string, emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji: emoji,
      timestamp: Date.now()
    };

    setActiveReactions(prev => ({
      ...prev,
      [streamId]: [...(prev[streamId] || []), newReaction]
    }));

    setTimeout(() => {
      setActiveReactions(prev => ({
        ...prev,
        [streamId]: (prev[streamId] || []).filter(r => r.id !== newReaction.id)
      }));
    }, 3000);
  };

  // Emoji list
  const emojiList = [
    { emoji: "🔥", name: "fire" },
    { emoji: "😂", name: "laughing" },
    { emoji: "❤️", name: "heart" },
    { emoji: "👍", name: "thumbs up" },
    { emoji: "👏", name: "clapping" },
    { emoji: "😍", name: "love" },
    { emoji: "🎉", name: "party" },
    { emoji: "😮", name: "wow" },
  ];

  // Sample participants data
  const participants = [
    { id: 1, name: "moise caicedo", status: "active", avatar: "https://i.pravatar.cc/150?img=12" },
    { id: 2, name: "Enzo fernandes", status: "active", avatar: "https://i.pravatar.cc/150?img=5" },
    { id: 3, name: "Cole palmer", status: "active", avatar: "https://i.pravatar.cc/150?img=33" },
    { id: 4, name: "malo Gusto", status: "active", avatar: "https://i.pravatar.cc/150?img=47" },
    { id: 5, name: "Reece james", status: "active", avatar: "https://i.pravatar.cc/150?img=15" },
  ];

  // Calculate grid layout based on number of streams
  const getGridLayout = () => {
    const streamCount = streams.length;
    if (streamCount === 1) return { columns: 1, rows: 1 };
    if (streamCount === 2) return { columns: 2, rows: 1 };
    if (streamCount <= 4) return { columns: 2, rows: 2 };
    if (streamCount <= 6) return { columns: 3, rows: 2 };
    return { columns: 3, rows: 3 };
  };

  const gridLayout = getGridLayout();

  // Main component render
  return (
    <>
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-200px) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-400px) scale(0.8);
            opacity: 0;
          }
        }

        button {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .main-container {
            padding: 8px !important;
            padding-top: 56px !important;
            gap: 8px !important;
          }

          .video-cards-wrapper {
            padding: 12px !important;
          }

          .streams-container {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .stream-wrapper > div:last-child {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 10px !important;
            gap: 10px !important;
          }

          .action-buttons-group {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }

          .action-button {
            width: 28px !important;
            height: 28px !important;
            font-size: 16px !important;
          }

          .meeting-code-text, .time-text {
            font-size: 12px !important;
          }

          .leave-button {
            width: 100% !important;
            margin-top: 8px !important;
            padding: 10px 16px !important;
          }

          .emoji-picker-bar {
            bottom: 80px !important;
            max-width: 90vw !important;
            padding: 4px 8px !important;
            gap: 1px !important;
          }

          .emoji-button {
            font-size: 18px !important;
            padding: 4px 6px !important;
            min-width: 30px !important;
            height: 30px !important;
          }

          .modal-content {
            width: 95% !important;
            padding: 24px 16px !important;
          }

          .participants-modal {
            width: 90% !important;
            max-width: 300px !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
        }

        /* Extra small devices (iPhone SE and similar) */
        @media (max-width: 375px) {
          .main-container {
            padding: 4px !important;
            padding-top: 52px !important;
          }

          .action-button {
            width: 26px !important;
            height: 26px !important;
            font-size: 14px !important;
          }

          .meeting-code-text,
          .time-text {
            font-size: 11px !important;
          }

          .leave-button {
            font-size: 13px !important;
            padding: 8px 12px !important;
          }

          .emoji-picker-bar {
            bottom: 70px !important;
          }

          .emoji-button {
            font-size: 16px !important;
            min-width: 28px !important;
            height: 28px !important;
          }

          .modal-content {
            padding: 20px 12px !important;
          }

          .modal-title {
            font-size: 20px !important;
          }
        }

        @media (max-width: 1024px) {
          .streams-container {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
          }
        }

        /* Chat Panel Responsive Styles */
        @media (max-width: 768px) {
          .chat-panel {
            width: 100% !important;
            max-width: 100% !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            bottom: 0 !important;
            transform: none !important;
            height: 80vh !important;
            maxHeight: 80vh !important;
            borderRadius: 12px 12px 0 0 !important;
          }
        }

        @media (max-width: 375px) {
          .chat-panel {
            height: 85vh !important;
          }
          .chat-panel h3 {
            font-size: 14px !important;
          }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        fontFamily: 'Pragati Narrow, sans-serif',
        padding: '16px'
      }}>
        <div className="main-container" style={{
          width: '100%',
          maxWidth: '1800px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: '95vh'
        }}>

          {/* Back Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginBottom: '8px',
            width: '100%'
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#1f2937',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                fontFamily: 'Pragati Narrow, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              title="Go back to previous page"
            >
              <i className="bi bi-chevron-left"></i>
              <span>Back</span>
            </button>
          </div>

          {/* Wrapper for Video Cards */}
          <div style={{
            backgroundColor: '#0267FF',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }} className="video-cards-wrapper">

          {/* Streams Container - Dynamic Grid */}
          <div className="streams-container" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
            gap: '32px',
            flex: 1,
            alignItems: 'start',
            position: 'relative'
          }}>

            {streams.map((stream, index) => {
              const isFocused = focusedStreamId === stream.id;

              return (
              <div
                key={stream.id}
                className="stream-wrapper"
                onClick={() => setFocusedStreamId(stream.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  height: 'fit-content',
                  borderRight: index === 0 && streams.length > 1 ? '2px solid #d1d5db' : 'none',
                  paddingRight: index === 0 && streams.length > 1 ? '20px' : '0',
                  paddingLeft: index === 1 ? '20px' : '0',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {/* Video Container */}
                <div style={{
                  backgroundColor: '#0267FF',
                  borderRadius: '12px',
                  padding: '12px',
                  boxShadow: isFocused
                    ? '0 0 0 4px rgba(12, 12, 242, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  border: isFocused ? '3px solid #1b29f5ff' : '3px solid transparent'
                }}>
                  <div style={{
                    backgroundColor: '#0267FF',
                    borderRadius: '8px',
                    position: 'relative',
                    aspectRatio: '16/9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <video
                      key={stream.id}
                      ref={(el) => {
                        if (el) {
                          videoRefs.current[stream.id] = el;
                          el.muted = stream.isMuted; 
                          el.volume = stream.volume; 
                        }
                      }}
                      onTimeUpdate={() => handleTimeUpdate(stream.id)}
                      onPlay={() => {
                        setStreams(prev => prev.map(s =>
                          s.id === stream.id ? { ...s, isPlaying: true } : s
                        ));
                      }}
                      onPause={() => {
                        setStreams(prev => prev.map(s =>
                          s.id === stream.id ? { ...s, isPlaying: false } : s
                        ));
                      }}
                      muted={stream.isMuted}
                      playsInline
                      preload="metadata"
                      src={stream.videoSrc}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>


                  {/* Play Button Overlay */}
                  {!stream.isPlaying && (
                    <button onClick={() => togglePlay(stream.id)} style={{
                      position: 'absolute',
                      zIndex: 10,
                      color: '#f35959ff',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      fontSize: '60px'
                    }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                       onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                      <i className="bi bi-play-circle-fill"></i>
                    </button>
                  )}

                  {/* Floating Emoji Reactions */}
                  {(activeReactions[stream.id] || []).map((reaction) => (
                    <div
                      key={reaction.id}
                      style={{
                        position: 'absolute',
                        right: `${Math.random() * 30 + 10}%`,
                        bottom: '0',
                        fontSize: '36px',
                        animation: 'floatUp 3s ease-out forwards',
                        zIndex: 15,
                        pointerEvents: 'none'
                      }}
                    >
                      {reaction.emoji}
                    </div>
                  ))}

                  {/* Video Controls */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '3px',
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        height: '100%',
                        backgroundColor: '#f35959ff',
                        borderRadius: '2px',
                        width: `${stream.progress}%`
                      }}></div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#fff',
                      flex: 1
                    }}>
                      <button onClick={() => togglePlay(stream.id)} style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '20px'
                      }}>
                        <i className={stream.isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}></i>
                      </button>

                      {/* Volume Control Group - Show slider on hover */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          position: 'relative'
                        }}
                        onMouseEnter={() => {
                          setStreams(prev => prev.map(s =>
                            s.id === stream.id ? { ...s, showVolumeSlider: true } : s
                          ));
                        }}
                        onMouseLeave={() => {
                          setStreams(prev => prev.map(s =>
                            s.id === stream.id ? { ...s, showVolumeSlider: false } : s
                          ));
                        }}
                      >
                        <button onClick={() => toggleMute(stream.id)} style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '20px'
                        }}>
                          <i className={
                            stream.volume === 0 || stream.isMuted ? "bi bi-volume-mute-fill" :
                            stream.volume < 0.5 ? "bi bi-volume-down-fill" :
                            "bi bi-volume-up-fill"
                          }></i>
                        </button>

                        {/* Horizontal Volume Slider - Show on hover */}
                        {stream.showVolumeSlider && (
                          <>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={stream.volume * 100}
                              onChange={(e) => {
                                const newVolume = parseInt(e.target.value) / 100;
                                handleVolumeChange(stream.id, newVolume);
                              }}
                              style={{
                                width: '80px',
                                height: '4px',
                                WebkitAppearance: 'none',
                                appearance: 'none',
                                background: `linear-gradient(to right, #f35959ff 0%, #f35959ff ${stream.volume * 100}%, rgba(255, 255, 255, 0.3) ${stream.volume * 100}%, rgba(255, 255, 255, 0.3) 100%)`,
                                borderRadius: '2px',
                                outline: 'none',
                                cursor: 'pointer'
                              }}
                            />

                            {/* Volume percentage display */}
                            <span style={{
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: '500',
                              minWidth: '30px'
                            }}>
                              {Math.round(stream.volume * 100)}%
                            </span>
                          </>
                        )}
                      </div>

                      <style>{`
                        input[type='range']::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 12px;
                          height: 12px;
                          background: #fff;
                          border-radius: 50%;
                          cursor: pointer;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                        }
                        input[type='range']::-moz-range-thumb {
                          width: 12px;
                          height: 12px;
                          background: #fff;
                          border-radius: 50%;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                        }
                      `}</style>
                      <button
                        onClick={() => toggleParticipants(stream.id)}
                        style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '18px'
                      }}>
                        <i className="bi bi-people-fill"></i>
                      </button>
                      <button
                        onClick={() => {
                          setOpenChats(prev => ({
                            ...prev,
                            [stream.id]: !prev[stream.id]
                          }));
                        }}
                        style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '18px'
                      }}
                      title="Open chat">
                        <i className="bi bi-chat-dots-fill"></i>
                      </button>
                      <span style={{ fontSize: '11px', marginLeft: 'auto' }}>Stream {stream.id.split('-')[1]}</span>
                      <button
                        onClick={() => toggleFullscreen(stream.id)}
                        style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '18px'
                      }}>
                        <i className={stream.isFullscreen ? "bi bi-fullscreen-exit" : "bi bi-fullscreen"}></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                  <div className="bottom-action-bar" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    marginTop: '8px'
                  }}>
                  {/* Left Side - Time and Meeting Code */}
                  <div className="action-buttons-group" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span className="meeting-code-text" style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>EAS AM | vwx-jcvv-sfg</span>
                    <button
                      style={{
                        color: '#6b7280',
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '18px'
                      }}
                      title="Copy meeting code"
                      onClick={() => {
                        navigator.clipboard.writeText('vwx-jcvv-sfg');
                      }}
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>

                  {/* Center - Action Buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <button
                      className="action-button"
                      style={{
                        backgroundColor: streams.length >= 2 ? '#9ca3af' : '#083A85',
                        color: '#fff',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: streams.length >= 2 ? 'not-allowed' : 'pointer',
                        opacity: streams.length >= 2 ? 0.5 : 1
                      }}
                      title={streams.length >= 2 ? "Maximum 2 streams allowed" : "Add participant"}
                      onClick={() => {
                        if (streams.length < 2) {
                          setShowAddStreamModal(true);
                        }
                      }}
                      disabled={streams.length >= 2}
                    >
                      +
                    </button>
                    <button
                      className="action-button"
                      onClick={() => setShowEmojiPicker(prev => ({
                        ...prev,
                        [stream.id]: !prev[stream.id]
                      }))}
                      style={{
                        backgroundColor: '#fff',
                        color: '#374151',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '20px'
                      }}
                      title="Emoji reactions"
                    >
                      <i className="bi bi-emoji-smile"></i>
                    </button>
                    <button
                      className="action-button"
                      onClick={() => {
                        setStreams(prev => prev.map(s =>
                          s.id === stream.id ? { ...s, isRecording: !s.isRecording } : s
                        ));
                      }}
                      style={{
                        backgroundColor: stream.isRecording ? '#f35959ff' : '#fff',
                        color: stream.isRecording ? '#fff' : '#374151',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: '2px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '20px',
                        position: 'relative'
                      }}
                      title={stream.isRecording ? "Stop recording" : "Start recording"}
                    >
                      <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: stream.isRecording ? '#fff' : '#374151',
                        borderRadius: '2px'
                      }}></div>
                    </button>
                    <button
                      className="action-button"
                      style={{
                        backgroundColor: '#1890ff',
                        color: '#fff',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '20px'
                      }}
                      title="Camera"
                    >
                      <i className="bi bi-camera-fill"></i>
                    </button>
                  </div>

                  {/* Right Side - Leave Button */}
                  <button
                    className="leave-button"
                    style={{
                      backgroundColor: '#f35959ff',
                      color: '#fff',
                      fontWeight: '500',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleLeaveStream(stream.id)}
                    title="Leave this stream"
                  >
                    Leave Streamcast
                  </button>
                </div>
              </div>
            </div>
            );
            })}


          </div>

          </div> {/* End Wrapper for Video Cards */}

        </div>

        {/* Add Stream Modal */}
        {showAddStreamModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={() => setShowAddStreamModal(false)}>
            <div className="modal-content" style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title" style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                marginTop: 0
              }}>Add New Livestream</h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>Would you like to add a new livestream? Please enter the stream ID below.</p>
              <input
                type="text"
                value={newStreamId}
                onChange={(e) => setNewStreamId(e.target.value)}
                placeholder="Enter livestream ID"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '24px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStream()}
              />
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowAddStreamModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#fff',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStream}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#083A85',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Stream
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Emoji Pickers - One for Each Stream */}
        {streams.map((stream, streamIndex) => {
          if (!showEmojiPicker[stream.id]) return null;
          const isLeftStream = streamIndex === 0;

          return (
          <div key={`emoji-picker-${stream.id}`} className="emoji-picker-bar" style={{
            position: 'fixed',
            bottom: '30px',
            ...(isLeftStream ? { left: '20px' } : { right: '20px' }),
            backgroundColor: '#fff',
            borderRadius: '50px',
            padding: '6px 12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            border: '1px solid #e5e7eb'
          }}>
            {emojiList.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  // Only send emoji to this specific stream
                  handleEmojiReaction(stream.id, item.emoji);
                }}
                className="emoji-button"
                style={{
                  fontSize: '22px',
                  padding: '6px 8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  height: '36px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.3)';
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={item.name}
              >
                {item.emoji}
              </button>
            ))}
            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#e5e7eb',
              margin: '0 2px'
            }}></div>
            <button
              onClick={() => setShowEmojiPicker(prev => ({
                ...prev,
                [stream.id]: false
              }))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
                transition: 'all 0.2s ease',
                minWidth: '36px',
                height: '36px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          );
        })}

        {/* Participants Viewers - One for Each Stream */}
        {streams.map((stream, index) => {
          const isLeft = index === 0; // First stream (stream-1) on left

          return showParticipants[stream.id] ? (
            <div key={`participants-${stream.id}`} className="participants-modal" style={{
              position: 'fixed',
              top: '50%',
              [isLeft ? 'left' : 'right']: '20px',
              transform: 'translateY(-50%)',
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              width: '320px',
              maxHeight: '500px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              border: `3px solid ${isLeft ? '#083A85' : '#f35959ff'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0,
                    marginBottom: '4px'
                  }}>Participants ({participants.length})</h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>Stream {index + 1}</span>
                </div>
                <button
                  onClick={() => toggleParticipants(stream.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: 0
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      gap: '12px'
                    }}
                  >
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        {participant.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: participant.status === 'active' ? '#10b981' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          backgroundColor: participant.status === 'active' ? '#10b981' : '#9ca3af',
                          borderRadius: '50%',
                          display: 'inline-block'
                        }}></span>
                        {participant.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })}

        {/* Chat Panels - One for each stream that has chat open */}
        {streams.map((stream, streamIndex) => {
          if (!openChats[stream.id]) return null;
          const isLeftPanel = streamIndex === 0; // Stream 1 on left, Stream 2 on right

          return (
            <div key={`chat-${stream.id}`} className="chat-panel" style={{
              position: 'fixed',
              bottom: '20px',
              [isLeftPanel ? 'left' : 'right']: '20px',
              width: '360px',
              height: '75vh',
              maxHeight: '680px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(8, 58, 133, 0.1)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              border: 'none',
              borderRadius: '20px',
              overflow: 'hidden',
              animation: 'slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <style>{`
                @keyframes slideInUp {
                  from {
                    opacity: 0;
                    transform: translateY(40px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>

              {/* Chat Header */}
              <div style={{
                background: `linear-gradient(135deg, ${isLeftPanel ? '#083A85' : '#0267FF'} 0%, ${isLeftPanel ? '#0267FF' : '#1890ff'} 100%)`,
                padding: '20px 24px',
                borderBottom: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative background elements */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  borderRadius: '50%'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '-30px',
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  borderRadius: '50%'
                }}></div>

                <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '6px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}></div>
                    <h3 style={{
                      fontWeight: '700',
                      color: '#fff',
                      fontSize: '19px',
                      margin: 0,
                      letterSpacing: '-0.3px'
                    }}>Leave A Message</h3>
                  </div>
                  <span style={{
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Stream {streamIndex + 1}</span>
                </div>
              <button
                onClick={() => {
                  setOpenChats(prev => ({
                    ...prev,
                    [stream.id]: false
                  }));
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: 0,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              padding: '24px 20px',
              background: 'linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative'
            }}>
              {/* Decorative top fade */}
              <div style={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                height: '20px',
                background: 'linear-gradient(180deg, #fafbfc 0%, transparent 100%)',
                marginTop: '-24px',
                marginBottom: '-10px',
                zIndex: 10,
                pointerEvents: 'none'
              }}></div>

              {(streamMessages[stream.id] || []).map((message, idx) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  style={{
                    background: '#ffffff',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `1.5px solid ${isLeftPanel ? 'rgba(8, 58, 133, 0.1)' : 'rgba(2, 103, 255, 0.1)'}`,
                    position: 'relative',
                    overflow: 'hidden',
                    maxWidth: '85%',
                    animation: `messageSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 8px 20px ${isLeftPanel ? 'rgba(8, 58, 133, 0.18)' : 'rgba(2, 103, 255, 0.18)'}`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = isLeftPanel ? 'rgba(8, 58, 133, 0.25)' : 'rgba(2, 103, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isLeftPanel ? 'rgba(8, 58, 133, 0.1)' : 'rgba(2, 103, 255, 0.1)';
                  }}
                >
                  <style>{`
                    @keyframes messageSlideIn {
                      from {
                        opacity: 0;
                        transform: translateX(-20px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                  `}</style>

                  {/* Colored accent bar */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: `linear-gradient(180deg, ${isLeftPanel ? '#083A85' : '#0267FF'} 0%, ${isLeftPanel ? '#0267FF' : '#1890ff'} 100%)`,
                    borderRadius: '12px 0 0 12px'
                  }}></div>

                  {/* Message text */}
                  <p className="message-text" style={{
                    fontSize: '13px',
                    color: '#2d3748',
                    lineHeight: '1.45',
                    margin: '0 0 8px 0',
                    fontWeight: '500',
                    position: 'relative',
                    zIndex: 1,
                    paddingLeft: '5px'
                  }}>
                    {message.text}
                  </p>

                  {/* Sender info bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '7px',
                    paddingLeft: '5px',
                    borderTop: `1px solid ${isLeftPanel ? 'rgba(8, 58, 133, 0.08)' : 'rgba(2, 103, 255, 0.08)'}`
                  }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: `linear-gradient(135deg, ${isLeftPanel ? '#083A85' : '#0267FF'} 0%, ${isLeftPanel ? '#0267FF' : '#1890ff'} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '700',
                          boxShadow: `0 3px 10px ${isLeftPanel ? 'rgba(8, 58, 133, 0.25)' : 'rgba(2, 103, 255, 0.25)'}`,
                          border: '2px solid #ffffff',
                          flexShrink: 0
                        }}>
                          {message.sender.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            color: '#083A85',
                            marginBottom: '1px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {message.sender}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: '#9ca3af',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <i className="bi bi-clock" style={{ fontSize: '9px' }}></i>
                            {message.time}
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      {message.delivered && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          border: '1.5px solid #a7f3d0',
                          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)',
                          flexShrink: 0
                        }}>
                          <i className="bi bi-check2-all" style={{
                            color: '#10b981',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}></i>
                          <span style={{
                            fontSize: '9px',
                            color: '#059669',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}>Sent</span>
                        </div>
                      )}
                    </div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>

            {/* Chat Input */}
            <div style={{
              padding: '20px',
              background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
              borderTop: `2px solid ${isLeftPanel ? 'rgba(8, 58, 133, 0.08)' : 'rgba(2, 103, 255, 0.08)'}`,
              boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.06)',
              position: 'relative'
            }}>
              {/* Decorative top glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '2px',
                background: `linear-gradient(90deg, transparent 0%, ${isLeftPanel ? '#083A85' : '#0267FF'} 50%, transparent 100%)`,
                opacity: 0.3
              }}></div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  border: `2px solid ${isLeftPanel ? 'rgba(8, 58, 133, 0.12)' : 'rgba(2, 103, 255, 0.12)'}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = isLeftPanel ? '#083A85' : '#0267FF';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${isLeftPanel ? 'rgba(8, 58, 133, 0.25)' : 'rgba(2, 103, 255, 0.25)'}`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = isLeftPanel ? 'rgba(8, 58, 133, 0.12)' : 'rgba(2, 103, 255, 0.12)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <button style={{
                  color: '#9ca3af',
                  marginRight: '10px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  fontSize: '22px',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                >
                  <i className="bi bi-emoji-smile"></i>
                </button>
                <input
                  type="text"
                  value={chatInputs[stream.id] || ""}
                  onChange={(e) => setChatInputs(prev => ({
                    ...prev,
                    [stream.id]: e.target.value
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (chatInputs[stream.id] || "").trim()) {
                      const currentMessages = streamMessages[stream.id] || [];
                      const newMsg = {
                        id: currentMessages.length + 1,
                        sender: "You",
                        text: chatInputs[stream.id],
                        time: new Date().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }),
                        delivered: false
                      };
                      setStreamMessages(prev => ({
                        ...prev,
                        [stream.id]: [...currentMessages, newMsg]
                      }));
                      setChatInputs(prev => ({
                        ...prev,
                        [stream.id]: ""
                      }));
                    }
                  }}
                  placeholder="Write your message..."
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14.5px',
                    color: '#1f2937',
                    fontWeight: '500'
                  }}
                />
                <button
                  onClick={() => {
                    if ((chatInputs[stream.id] || "").trim()) {
                      const currentMessages = streamMessages[stream.id] || [];
                      const newMsg = {
                        id: currentMessages.length + 1,
                        sender: "You",
                        text: chatInputs[stream.id],
                        time: new Date().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }),
                        delivered: false
                      };
                      setStreamMessages(prev => ({
                        ...prev,
                        [stream.id]: [...currentMessages, newMsg]
                      }));
                      setChatInputs(prev => ({
                        ...prev,
                        [stream.id]: ""
                      }));
                    }
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${isLeftPanel ? '#083A85' : '#0267FF'} 0%, ${isLeftPanel ? '#0267FF' : '#1890ff'} 100%)`,
                    marginLeft: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    flexShrink: 0,
                    fontSize: '15px',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontWeight: '700',
                    boxShadow: `0 6px 20px ${isLeftPanel ? 'rgba(8, 58, 133, 0.35)' : 'rgba(2, 103, 255, 0.35)'}`,
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)';
                    e.currentTarget.style.boxShadow = `0 12px 30px ${isLeftPanel ? 'rgba(8, 58, 133, 0.5)' : 'rgba(2, 103, 255, 0.5)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = `0 6px 20px ${isLeftPanel ? 'rgba(8, 58, 133, 0.35)' : 'rgba(2, 103, 255, 0.35)'}`;
                  }}
                >
                  {/* Button shine effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    animation: 'buttonShine 3s infinite',
                    pointerEvents: 'none'
                  }}></div>
                  <style>{`
                    @keyframes buttonShine {
                      0%, 100% { left: -100%; }
                      50% { left: 100%; }
                    }
                  `}</style>

                  <i className="bi bi-send-fill" style={{
                    fontSize: '16px',
                    position: 'relative',
                    zIndex: 1
                  }}></i>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    letterSpacing: '0.3px',
                    position: 'relative',
                    zIndex: 1
                  }}>Send</span>
                </button>
              </div>
            </div>
          </div>
          );
        })}

        {/* Message Modal - Single centered overlay */}
        {selectedMessage && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '0',
              width: '560px',
              maxWidth: '94vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(8, 58, 133, 0.1)',
              zIndex: 1100,
              animation: 'modalBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: 'none'
            }}
          >
            <style>{`
              @keyframes modalBounceIn {
                0% {
                  opacity: 0;
                  transform: translate(-50%, -50%) scale(0.8) rotateX(20deg);
                }
                60% {
                  transform: translate(-50%, -50%) scale(1.03) rotateX(-5deg);
                }
                100% {
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(1) rotateX(0deg);
                }
              }
            `}</style>

            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #083A85 0%, #0558D6 50%, #0267FF 100%)',
              padding: '20px 24px',
              borderRadius: '24px 24px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Animated gradient orbs */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
              }}></div>
              <div style={{
                position: 'absolute',
                bottom: '-40px',
                left: '-40px',
                width: '140px',
                height: '140px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
              }}></div>

              <style>{`
                @keyframes float {
                  0%, 100% { transform: translate(0, 0); }
                  50% { transform: translate(20px, 20px); }
                }
              `}</style>

              <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <i className="bi bi-chat-square-text-fill" style={{
                      color: '#ffffff',
                      fontSize: '16px'
                    }}></i>
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#ffffff',
                      margin: 0,
                      letterSpacing: '-0.5px',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}>Message Details</h3>
                    <p style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      margin: 0,
                      fontWeight: '600',
                      marginTop: '1px'
                    }}>Complete information</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(12px)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '14px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '17px',
                  padding: 0,
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
                  e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Message Content */}
            <div style={{
              padding: '20px 24px',
              background: '#ffffff'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #083A85 0%, #0267FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '20px',
                  boxShadow: '0 6px 14px rgba(8, 58, 133, 0.25)',
                  flexShrink: 0,
                  border: '3px solid #ffffff',
                  position: 'relative'
                }}>
                  {selectedMessage.sender.charAt(0).toUpperCase()}
                  <div style={{
                    position: 'absolute',
                    bottom: '-3px',
                    right: '-3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '3px solid #ffffff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '3px',
                    letterSpacing: '-0.3px'
                  }}>
                    {selectedMessage.sender}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <i className="bi bi-clock" style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}></i>
                    <span style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      fontWeight: '500'
                    }}>
                      {selectedMessage.time}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '16px 18px',
                borderRadius: '14px',
                borderLeft: '4px solid #0267FF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontSize: '60px',
                  color: 'rgba(2, 103, 255, 0.03)',
                  transform: 'rotate(15deg) translate(5px, -15px)',
                  pointerEvents: 'none'
                }}>
                  <i className="bi bi-chat-quote"></i>
                </div>
                <p style={{
                  fontSize: '14.5px',
                  color: '#374151',
                  lineHeight: '1.6',
                  margin: 0,
                  fontWeight: '500',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {selectedMessage.text}
                </p>
              </div>
            </div>

            {/* Message Status */}
            <div style={{
              padding: '0 24px 18px 24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: selectedMessage.delivered
                  ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                  : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                borderRadius: '12px',
                border: selectedMessage.delivered
                  ? '2px solid #bbf7d0'
                  : '2px solid #fde68a',
                boxShadow: selectedMessage.delivered
                  ? '0 3px 10px rgba(16, 185, 129, 0.1)'
                  : '0 3px 10px rgba(245, 158, 11, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: selectedMessage.delivered ? '#10b981' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selectedMessage.delivered
                      ? '0 3px 10px rgba(16, 185, 129, 0.3)'
                      : '0 3px 10px rgba(245, 158, 11, 0.3)'
                  }}>
                    <i className={selectedMessage.delivered ? "bi bi-check2-all" : "bi bi-clock"} style={{
                      color: '#ffffff',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}></i>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      color: selectedMessage.delivered ? '#15803d' : '#b45309',
                      fontWeight: '600',
                      marginBottom: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Status
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: selectedMessage.delivered ? '#166534' : '#92400e',
                      fontWeight: '700'
                    }}>
                      {selectedMessage.delivered ? 'Delivered' : 'Pending'}
                    </div>
                  </div>
                </div>
                {selectedMessage.delivered && (
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    <i className="bi bi-check-circle-fill" style={{
                      color: '#10b981',
                      fontSize: '12px',
                      marginRight: '5px'
                    }}></i>
                    <span style={{
                      fontSize: '11px',
                      color: '#15803d',
                      fontWeight: '700'
                    }}>Confirmed</span>
                  </div>
                )}
              </div>
            </div>
            {/* Action Buttons */}
            <div style={{
              padding: '0 24px 20px 24px',
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedMessage.text);
                }}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '2px solid #0267FF',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  color: '#0267FF',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(2, 103, 255, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0267FF 0%, #083A85 100%)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(2, 103, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
                  e.currentTarget.style.color = '#0267FF';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 103, 255, 0.15)';
                }}
              >
                <i className="bi bi-clipboard" style={{ fontSize: '15px' }}></i>
                Copy Message
              </button>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #083A85 0%, #0267FF 100%)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 3px 10px rgba(8, 58, 133, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 58, 133, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(8, 58, 133, 0.25)';
                }}
              >
                <i className="bi bi-x-circle" style={{ fontSize: '15px' }}></i>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for modals */}
        {selectedMessage && (
          <div
            onClick={() => setSelectedMessage(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at center, rgba(2, 103, 255, 0.15) 0%, rgba(0, 0, 0, 0.7) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 1099,
              animation: 'backdropFadeIn 0.3s ease-out'
            }}
          >
            <style>{`
              @keyframes backdropFadeIn {
                from {
                  opacity: 0;
                  backdrop-filter: blur(0px);
                }
                to {
                  opacity: 1;
                  backdrop-filter: blur(8px);
                }
              }
            `}</style>
          </div>
        )}

        {/* Volume Warning Modal */}
        {showVolumeWarning && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="modal-content" style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '20px 24px',
              maxWidth: '380px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'slideDown 0.3s ease-out'
            }} onClick={(e) => e.stopPropagation()}>
              <style>{`
                @keyframes slideDown {
                  from {
                    opacity: 0;
                    transform: translateY(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}</style>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b' }}></i>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#374151',
                  margin: 0,
                  lineHeight: '1.5',
                  flex: 1,
                  fontWeight: '500'
                }}>
                  Only one stream can be active at a time. Please mute the other stream before unmuting this one.
                </p>
              </div>
              <button
                onClick={() => setShowVolumeWarning(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#083A85',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  alignSelf: 'flex-end'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Modal */}
        {showKeyboardShortcuts && (
          <>
            <div
              onClick={() => setShowKeyboardShortcuts(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 1099,
                animation: 'fadeIn 0.2s ease-out'
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '32px',
                width: '600px',
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                zIndex: 1100
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="bi bi-keyboard" style={{ fontSize: '28px' }}></i>
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '24px',
                    padding: 0
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Shortcuts List */}
              <div style={{
                display: 'grid',
                gap: '16px'
              }}>
                {/* Playback Controls */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '12px',
                    marginTop: 0
                  }}>Playback Controls</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <ShortcutItem keyLabel="Space / K" description="Play / Pause" />
                    <ShortcutItem keyLabel="M" description="Mute / Unmute" />
                    <ShortcutItem keyLabel="F" description="Toggle Fullscreen" />
                  </div>
                </div>

                {/* Volume Controls */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '12px',
                    marginTop: 0
                  }}>Volume Controls</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <ShortcutItem keyLabel="↑" description="Increase volume by 10%" />
                    <ShortcutItem keyLabel="↓" description="Decrease volume by 10%" />
                  </div>
                </div>

                {/* Seek Controls */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '12px',
                    marginTop: 0
                  }}>Seek Controls</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <ShortcutItem keyLabel="→" description="Forward 5 seconds" />
                    <ShortcutItem keyLabel="←" description="Backward 5 seconds" />
                    <ShortcutItem keyLabel="0-9" description="Jump to 0%-90% of video" />
                  </div>
                </div>

                {/* Help */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#083A85',
                    marginBottom: '12px',
                    marginTop: 0
                  }}>Help</h3>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <ShortcutItem keyLabel="?" description="Show / Hide shortcuts" />
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <i className="bi bi-info-circle" style={{ marginRight: '6px' }}></i>
                  Click on a stream to focus it, then use keyboard shortcuts to control it
                </div>
                <div>
                  <i className="bi bi-keyboard" style={{ marginRight: '6px' }}></i>
                  Shortcuts won't work when typing in chat or input fields
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Shortcut Item Component
const ShortcutItem = ({ keyLabel, description }: { keyLabel: string; description: string }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  }}>
    <span style={{
      fontSize: '14px',
      color: '#374151'
    }}>{description}</span>
    <kbd style={{
      backgroundColor: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f2937',
      fontFamily: 'monospace',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
    }}>
      {keyLabel}
    </kbd>
  </div>
);

export default MultiStream;