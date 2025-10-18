"use client";

import React, { useState, useRef, useEffect } from "react";

// Main App Component
const App = () => {
  // State for messages in the chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Moise caicedo",
      text: "Hey, I want to wish you a beautiful wedding day filled with love, grace, and blessings your lovely friend.",
      time: "8:30 PM",
      delivered: true,
    },
    {
      id:2,
      sender:"cole palmer", 
      text:"Hey, may your wedding day mark the start of a lifetime of love and blessings your lovely friend.",
      time:"2:00 PM",
      delivered:true,
    },
    {
      id:3,
      sender:"Enzo fernandez", 
      text:"Hey, congratulations on your wedding day; may your union be surrounded by joy, peace, and grace",
      time:"11:00 AM",
      delivered:true,
    },
  ]);
  // State for the new message input
  const [newMessage, setNewMessage] = useState("");
  // State for video playback
  const [isPlaying, setIsPlaying] = useState(false);
  // State for video mute status
  const [isMuted, setIsMuted] = useState(false);
  // State for video progress
  const [progress, setProgress] = useState(0);
  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement>(null);
  // State for modals
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [newStreamId, setNewStreamId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Emoji reactions state
  const [activeReactions, setActiveReactions] = useState<Array<{ id: number; emoji: string; timestamp: number }>>([]);
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

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

  // Recording timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: "You",
          text: newMessage,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          delivered: false,
        },
      ]);
      setNewMessage("");
    }
  };

  // Toggle video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle video mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Update video progress bar
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  // Effect to add time update listener
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }
  }, []);

  // Handle adding new livestream
  const handleAddStream = () => {
    if (newStreamId.trim()) {
      // Here you would implement the logic to add/switch to a new stream
      console.log("Adding new stream with ID:", newStreamId);
      setShowAddStreamModal(false);
      setNewStreamId("");
    }
  };

  // Handle emoji reaction
  const handleEmojiReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji: emoji,
      timestamp: Date.now()
    };

    setActiveReactions(prev => [...prev, newReaction]);
    // Don't auto-close - let user click multiple emojis or manually close

    // Remove reaction after animation (3 seconds)
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== newReaction.id));
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
    { id: 6, name: "liam delap", status: "active", avatar:""},
  ];

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = videoRef.current?.parentElement;
    if (!videoContainer) return;

    if (!isFullscreen) {
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
      setIsFullscreen(true);
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
      setIsFullscreen(false);
    }
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
      setIsFullscreen(isCurrentlyFullscreen);
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

  // Start/Stop Recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const video = videoRef.current;
        if (!video) {
          alert('Video element not found');
          return;
        }

        // Capture the video element stream
        // @ts-ignore - captureStream is not in all TypeScript definitions
        const videoStream = video.captureStream ? video.captureStream() : video.mozCaptureStream();

        if (!videoStream) {
          alert('Unable to capture video stream. Your browser may not support this feature.');
          return;
        }

        const recorder = new MediaRecorder(videoStream, {
          mimeType: 'video/webm;codecs=vp9'
        });

        const chunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
            setRecordedChunks([...chunks]);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);

          // Create download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `livestream-recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Clear chunks after download
          setRecordedChunks([]);
        };

        recorder.start(1000); // Capture data every second
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. This feature may not be supported in your browser.');
      }
    } else {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
      }
    }
  };

  // Main component render
  return (
    <>
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: 8px !important;
            padding-top: 56px !important;
            gap: 8px !important;
          }

          .cards-wrapper {
            grid-template-columns: 1fr !important;
            padding: 12px !important;
            gap: 12px !important;
          }

          .video-section {
            width: 100% !important;
            min-height: 50vh !important;
            margin-top: 0 !important;
          }

          .chat-section {
            width: 100% !important;
            max-height: 45vh !important;
          }

          .back-button {
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            padding: 4px 10px !important;
            font-size: 13px !important;
            z-index: 100 !important;
          }

          .bottom-action-bar {
            flex-wrap: wrap !important;
            gap: 8px !important;
            padding: 8px 10px !important;
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

          .meeting-code-text {
            font-size: 12px !important;
          }

          .time-text {
            font-size: 12px !important;
          }

          .leave-button {
            width: 100% !important;
            margin-top: 8px !important;
            padding: 10px 16px !important;
          }

          .participants-modal {
            width: 90% !important;
            max-width: 300px !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
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

          .video-controls {
            padding: 8px !important;
          }

          .play-overlay-button {
            font-size: 60px !important;
          }

          .recording-indicator {
            top: 10px !important;
            left: 10px !important;
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
        }

        /* Extra small devices (iPhone SE and similar) */
        @media (max-width: 375px) {
          .main-container {
            padding: 4px !important;
            padding-top: 52px !important;
          }

          .video-section {
            min-height: 45vh !important;
          }

          .chat-section {
            max-height: 50vh !important;
          }

          .back-button {
            font-size: 12px !important;
            padding: 3px 8px !important;
            top: 8px !important;
            left: 8px !important;
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

          .play-overlay-button {
            font-size: 50px !important;
          }

          .chat-header-title {
            font-size: 14px !important;
          }

          .message-text {
            font-size: 13px !important;
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
          maxWidth: '1280px',
          height: '85vh',
          backgroundColor: '#083A85',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '12px',
          display: 'flex',
          gap: '12px'
        }}>

            {/* Wrapper for Video and Chat Cards */}
            <div style={{
              backgroundColor: '#1e3a8a',
              borderRadius: '16px',
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '20px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }} className="cards-wrapper">

            {/* Video Section */}
            <div className="video-section" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative'
            }}>
                {/* Back Button - Above Video */}
                <button
                  onClick={() => window.history.back()}
                  className="back-button"
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '0px',
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
                    zIndex: 50,
                    fontWeight: '500',
                    fontFamily: 'Pragati Narrow, sans-serif'
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

                <div style={{
                  flex: 1,
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                    <video ref={videoRef} style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}>
                        <source src="/live-stream.mp4" type="video/mp4" />
                    </video>
                    {/* Play Button Overlay */}
                    {!isPlaying && (
                        <button onClick={togglePlay} className="play-overlay-button" style={{
                          position: 'absolute',
                          zIndex: 10,
                          color: '#f35959ff',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          fontSize: '80px'
                        }} onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                           onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                             <i className="bi bi-play-circle-fill"></i>
                        </button>
                    )}

                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="recording-indicator" style={{
                          position: 'absolute',
                          top: '20px',
                          left: '20px',
                          zIndex: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          padding: '10px 16px',
                          borderRadius: '20px'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#ef4444',
                            borderRadius: '50%',
                            animation: 'blink 1s infinite'
                          }}></div>
                          <span style={{
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>REC {formatRecordingTime(recordingTime)}</span>
                        </div>
                    )}

                    {/* Floating Emoji Reactions */}
                    {activeReactions.map((reaction) => (
                      <div
                        key={reaction.id}
                        style={{
                          position: 'absolute',
                          right: `${Math.random() * 30 + 10}%`,
                          bottom: '0',
                          fontSize: '48px',
                          animation: 'floatUp 3s ease-out forwards',
                          zIndex: 15,
                          pointerEvents: 'none'
                        }}
                      >
                        {reaction.emoji}
                      </div>
                    ))}

                    {/* Video Controls */}
                    <div className="video-controls" style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '12px'
                    }}>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          marginBottom: '12px'
                        }}>
                             <div style={{
                               height: '100%',
                               backgroundColor: '#f35959ff',
                               borderRadius: '2px',
                               width: `${progress}%`
                             }}></div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          color: '#fff'
                        }}>
                            <button onClick={togglePlay} style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '24px'
                            }}>
                                <i className={isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}></i>
                            </button>
                            <button onClick={toggleMute} style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '24px'
                            }}>
                                <i className={isMuted ? "bi bi-volume-mute-fill" : "bi bi-volume-up-fill"}></i>
                            </button>
                            <button
                              onClick={() => setShowParticipants(!showParticipants)}
                              style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '20px'
                            }}>
                                <i className="bi bi-people-fill"></i>
                            </button>
                            <button
                              onClick={toggleFullscreen}
                              style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              marginLeft: 'auto',
                              fontSize: '20px'
                            }}>
                                <i className={isFullscreen ? "bi bi-fullscreen-exit" : "bi bi-fullscreen"}></i>
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
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <div className="action-buttons-group" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                        <span className="time-text" style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1f2937'
                        }}>{currentTime}</span>
                        <span style={{ color: '#9ca3af' }}>|</span>
                        <span className="meeting-code-text" style={{
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
                         <button
                            className="action-button"
                            style={{
                              backgroundColor: '#083A85',
                              color: '#fff',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            title="Add participant"
                            onClick={() => setShowAddStreamModal(true)}
                         >
                            +
                        </button>
                         <button
                            className="action-button"
                            style={{
                              backgroundColor: '#fff',
                              color: '#374151',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              border: '2px solid #083A85',
                              cursor: 'pointer',
                              fontSize: '20px'
                            }}
                            title="Emoji reactions"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                         >
                            <i className="bi bi-emoji-smile"></i>
                        </button>
                         <button
                            className="action-button"
                            style={{
                              backgroundColor: isRecording ? '#ef4444' : '#fff',
                              color: isRecording ? '#fff' : '#1f2937',
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              border: `2px solid ${isRecording ? '#ef4444' : '#083A85'}`,
                              cursor: 'pointer',
                              fontSize: '16px',
                              animation: isRecording ? 'pulse 2s infinite' : 'none'
                            }}
                            title={isRecording ? "Stop recording" : "Start recording"}
                            onClick={toggleRecording}
                         >
                            <i className={isRecording ? "bi bi-stop-circle-fill" : "bi bi-record-circle"}></i>
                        </button>
                    </div>
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
                        onClick={() => {
                            window.location.href = '/';
                        }}
                    >
                        Leave Streamcast
                    </button>
                </div>
            </div>

            {/* Chat Section */}
            <div className="chat-section" style={{
              width: '400px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                    <h3 className="chat-header-title" style={{
                      fontWeight: '600',
                      color: '#1f2937',
                      fontSize: '16px',
                      margin: 0
                    }}>Leave A Message Reaction</h3>
                </div>
                <div style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                    {messages.map((message) => (
                        <div key={message.id} style={{
                          backgroundColor: '#fff',
                          padding: '14px',
                          borderRadius: '8px',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <p className="message-text" style={{
                              fontSize: '14px',
                              color: '#1f2937',
                              lineHeight: '1.6',
                              marginBottom: '8px',
                              margin: 0
                            }}>
                                {message.text} <span style={{
                                  fontWeight: '500',
                                  color: '#111827'
                                }}>{message.sender}</span>
                            </p>
                            <div style={{
                              textAlign: 'right',
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                                <span style={{
                                  fontSize: '12px',
                                  color: '#9ca3af'
                                }}>{message.time}</span>
                                {message.delivered && (
                                    <i className="bi bi-check2" style={{ color: '#083A85', fontSize: '14px', fontWeight: 'bold' }}></i>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderTop: '1px solid #e5e7eb'
                }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      padding: '10px'
                    }}>
                         <button style={{
                           color: '#9ca3af',
                           marginRight: '8px',
                           background: 'transparent',
                           border: 'none',
                           cursor: 'pointer',
                           padding: 0,
                           display: 'flex',
                           alignItems: 'center',
                           flexShrink: 0,
                           fontSize: '20px'
                         }}>
                            <i className="bi bi-emoji-smile"></i>
                        </button>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Write your message..."
                            style={{
                              flex: 1,
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none',
                              fontSize: '14px',
                              color: '#1f2937'
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            style={{
                              color: '#083A85',
                              marginLeft: '8px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              flexShrink: 0,
                              fontSize: '20px'
                            }}
                        >
                             <i className="bi bi-send-fill"></i>
                        </button>
                    </div>
                </div>
            </div>

            </div> {/* End Wrapper for Video and Chat Cards */}

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

        {/* Emoji Picker - Google Meet Style */}
        {showEmojiPicker && (
          <div className="emoji-picker-bar" style={{
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
                onClick={() => handleEmojiReaction(item.emoji)}
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

        {/* Participants Viewer */}
        {showParticipants && (
          <div className="participants-modal" style={{
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            width: '320px',
            maxHeight: '500px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            zIndex: 1000
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>Participants ({participants.length})</h3>
              <button
                onClick={() => setShowParticipants(false)}
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
        )}
    </div>
    </>
  );
};

export default App;
