"use client";

import React, { useState, useRef, useEffect } from "react";

interface Stream {
  id: string;
  videoSrc: string;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  isFullscreen: boolean;
}

interface Message {
  id: number;
  streamId: string;
  sender: string;
  text: string;
  time: string;
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
      isFullscreen: false
    },
    {
      id: "stream-2",
      videoSrc: "/live-stream-2.mp4",
      isPlaying: false,
      isMuted: true, // Muted by default
      progress: 0,
      isFullscreen: false
    }
  ]);

  // Refs for video elements
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // State for modals
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState<{ [key: string]: boolean }>({});
  const [showSettings, setShowSettings] = useState<{ [key: string]: boolean }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [newStreamId, setNewStreamId] = useState("");

  // Messages state for each stream
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<{ [key: string]: string }>({});

  // Emoji reactions state for each stream
  const [activeReactions, setActiveReactions] = useState<{
    [key: string]: Array<{ id: number; emoji: string; timestamp: number }>
  }>({});

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

  // Toggle video play/pause for a specific stream
  const togglePlay = (streamId: string) => {
    const video = videoRefs.current[streamId];
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, isPlaying: !s.isPlaying } : s
      ));
    }
  };

  // Toggle video mute for a specific stream
  const toggleMute = (streamId: string) => {
    const video = videoRefs.current[streamId];
    if (video) {
      video.muted = !video.muted;
      setStreams(prev => prev.map(s =>
        s.id === streamId ? { ...s, isMuted: !s.isMuted } : s
      ));
    }
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
        videoSrc: "/live-stream.mp4", // You can modify this to accept custom video sources
        isPlaying: false,
        isMuted: false,
        progress: 0,
        isFullscreen: false
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

      // Close any open panels for this stream
      setShowParticipants(prev => {
        const updated = { ...prev };
        delete updated[streamId];
        return updated;
      });

      setShowSettings(prev => {
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

  // Toggle settings panel for specific stream
  const toggleSettings = (streamId: string) => {
    setShowSettings(prev => ({
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

  // Toggle comments section for specific stream
  const toggleComments = (streamId: string) => {
    setShowComments(prev => ({
      ...prev,
      [streamId]: !prev[streamId]
    }));
  };

  // Handle sending message for a specific stream
  const handleSendMessage = (streamId: string) => {
    const messageText = newMessage[streamId];
    if (messageText?.trim()) {
      const newMsg: Message = {
        id: Date.now(),
        streamId: streamId,
        sender: "You",
        text: messageText,
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage(prev => ({ ...prev, [streamId]: "" }));
    }
  };

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

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .main-container {
            padding: 8px !important;
            gap: 8px !important;
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

          .stream-wrapper > div:last-child > div {
            justify-content: center !important;
          }

          .action-button {
            width: 28px !important;
            height: 28px !important;
            font-size: 16px !important;
          }

          .meeting-code-text, .time-text {
            font-size: 11px !important;
          }

          .leave-button {
            width: 100% !important;
            padding: 10px 16px !important;
          }
        }

        @media (max-width: 1024px) {
          .streams-container {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
          }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#083A85',
        fontFamily: 'Pragati Narrow, sans-serif',
        padding: '16px'
      }}>
        <div className="main-container" style={{
          width: '100%',
          maxWidth: '1600px',
          backgroundColor: '#083A85',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: '90vh'
        }}>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#fff',
              transition: 'all 0.2s ease',
              fontWeight: '500',
              fontFamily: 'Pragati Narrow, sans-serif',
              marginBottom: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            title="Go back to previous page"
          >
            <i className="bi bi-chevron-left"></i>
            <span>Back</span>
          </button>

          {/* Streams Container - Dynamic Grid */}
          <div className="streams-container" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
            gap: '16px',
            flex: 1,
            alignItems: 'start'
          }}>

            {streams.map((stream) => (
              <div key={stream.id} className="stream-wrapper" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0px',
                height: 'fit-content'
              }}>
                <div style={{
                  backgroundColor: '#000',
                  borderRadius: '8px 8px 0 0',
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
                        el.muted = stream.isMuted; // Set initial muted state
                      }
                    }}
                    onTimeUpdate={() => handleTimeUpdate(stream.id)}
                    onError={(e) => {
                      console.error(`Video error for ${stream.id}:`, e);
                      console.error(`Video source: ${stream.videoSrc}`);
                    }}
                    onLoadedData={() => {
                      console.log(`Video loaded for ${stream.id}`);
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
                      color: '#fff'
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
                        <i className={stream.isMuted ? "bi bi-volume-mute-fill" : "bi bi-volume-up-fill"}></i>
                      </button>
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
                        onClick={() => toggleSettings(stream.id)}
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
                        <i className="bi bi-gear-fill"></i>
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

                {/* Stream Action Bar - Matches Image Layout */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#fff',
                  borderRadius: '0 0 8px 8px',
                  padding: '12px 16px',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Left Side - Meeting Code */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>{currentTime}</span>
                    <span style={{ color: '#9ca3af' }}>|</span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>vwx-jcvv-sfg</span>
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

                  {/* Center - Control Buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <button
                      style={{
                        backgroundColor: streams.length >= 2 ? '#9ca3af' : '#083A85',
                        color: '#fff',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: streams.length >= 2 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: streams.length >= 2 ? 0.5 : 1
                      }}
                      title={streams.length >= 2 ? "Maximum 2 streams allowed" : "Add stream"}
                      onClick={() => {
                        if (streams.length < 2) {
                          setShowAddStreamModal(true);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (streams.length < 2) {
                          e.currentTarget.style.backgroundColor = '#0a4da3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (streams.length < 2) {
                          e.currentTarget.style.backgroundColor = '#083A85';
                        }
                      }}
                      disabled={streams.length >= 2}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      style={{
                        backgroundColor: '#fff',
                        color: '#374151',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: '2px solid #083A85',
                        cursor: 'pointer',
                        fontSize: '20px',
                        transition: 'all 0.2s'
                      }}
                      title="Emoji reactions"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <i className="bi bi-emoji-smile"></i>
                    </button>
                    <button
                      style={{
                        backgroundColor: '#fff',
                        color: '#374151',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: '2px solid #083A85',
                        cursor: 'pointer',
                        fontSize: '20px',
                        transition: 'all 0.2s'
                      }}
                      title="Record/Stop"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                      }}
                    >
                      <i className="bi bi-record-circle"></i>
                    </button>
                  </div>

                  {/* Right Side - Leave Button */}
                  <button
                    style={{
                      backgroundColor: '#f35959ff',
                      color: '#fff',
                      fontWeight: '500',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleLeaveStream(stream.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f35959ff';
                    }}
                    title="Leave this stream"
                  >
                    Leave Stream
                  </button>
                </div>
              </div>
            ))}

          </div>

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
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
                marginTop: 0
              }}>Add New Stream</h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '24px'
              }}>Enter the stream ID to combine another livestream into multi-view. (Maximum 2 streams)</p>
              <input
                type="text"
                value={newStreamId}
                onChange={(e) => setNewStreamId(e.target.value)}
                placeholder="Enter stream ID or URL"
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

        {/* Emoji Picker - Applies to all streams */}
        {showEmojiPicker && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
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
                  streams.forEach(stream => handleEmojiReaction(stream.id, item.emoji));
                }}
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
              onClick={() => setShowEmojiPicker(false)}
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
        )}

        {/* Participants Viewers - One for Each Stream */}
        {streams.map((stream, index) => {
          const isLeft = index === 0; // First stream (stream-1) on left

          return showParticipants[stream.id] ? (
            <div key={`participants-${stream.id}`} style={{
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
                      padding: '8px 10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      gap: '10px'
                    }}
                  >
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '2px'
                      }}>
                        {participant.name}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: participant.status === 'active' ? '#10b981' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
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

        {/* Settings Panels - One for Each Stream */}
        {streams.map((stream, index) => {
          const isLeft = index === 0;

          return showSettings[stream.id] ? (
            <div key={`settings-${stream.id}`} style={{
              position: 'fixed',
              top: '50%',
              [isLeft ? 'left' : 'right']: '20px',
              transform: 'translateY(-50%)',
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              width: '320px',
              maxHeight: '400px',
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
                  }}>Settings</h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>Stream {index + 1}</span>
                </div>
                <button
                  onClick={() => toggleSettings(stream.id)}
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
                gap: '16px'
              }}>
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Video Quality</label>
                  <select style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none'
                  }}>
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Playback Speed</label>
                  <select style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    outline: 'none'
                  }}>
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>Normal</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} />
                    Show captions
                  </label>
                </div>
              </div>
            </div>
          ) : null;
        })}
      </div>
    </>
  );
};

export default MultiStream;
