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
  // State for volume
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
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

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 10, 100));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 10, 0));
          break;
        case 'arrowleft':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.currentTime + 5,
              videoRef.current.duration
            );
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, volume]);

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

        /* Volume Slider Styling */
        input[type="range"].volume-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"].volume-slider::-webkit-slider-track {
          height: 2px;
          border-radius: 2px;
        }

        input[type="range"].volume-slider::-moz-range-track {
          height: 2px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.3);
        }

        input[type="range"].volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          margin-top: -4px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        input[type="range"].volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        input[type="range"].volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"].volume-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
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
      height: '100vh',
      backgroundColor: '#083A85',
      fontFamily: 'Pragati Narrow, sans-serif',
      padding: '16px',
      overflow: 'hidden'
    }}>
        {/* Back Button - Top Left */}
        <button
          onClick={() => window.history.back()}
          className="back-button"
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            backgroundColor: 'transparent',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '50px',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#fff',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            fontWeight: '600',
            fontFamily: 'Pragati Narrow, sans-serif',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Go back to previous page"
        >
          <i className="bi bi-chevron-left" style={{ fontSize: '16px', fontWeight: 'bold' }}></i>
          <span>Back</span>
        </button>

        <div className="main-container" style={{
          width: '100%',
          maxWidth: '1280px',
          height: '85vh',
          backgroundColor: '#083A85',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '12px',
          paddingTop: '55px',
          display: 'flex',
          gap: '12px',
          overflow: 'hidden'
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
              height: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }} className="cards-wrapper">

            {/* Video Section */}
            <div className="video-section" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              position: 'relative',
              height: '100%',
              overflow: 'hidden'
            }}>

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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseEnter={() => setShowVolumeSlider(true)}
                              onMouseLeave={() => setShowVolumeSlider(false)}
                            >
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
                                  <i className={isMuted || volume === 0 ? "bi bi-volume-mute-fill" : volume < 50 ? "bi bi-volume-down-fill" : "bi bi-volume-up-fill"}></i>
                              </button>
                              {showVolumeSlider && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <input
                                    type="range"
                                    className="volume-slider"
                                    min="0"
                                    max="100"
                                    value={volume}
                                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                    style={{
                                      width: '100px',
                                      background: `linear-gradient(to right, #f35959ff ${volume}%, rgba(255, 255, 255, 0.3) ${volume}%)`
                                    }}
                                  />
                                  <span style={{
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    minWidth: '35px'
                                  }}>{Math.round(volume)}%</span>
                                </div>
                              )}
                            </div>
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
              height: '100%',
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

"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';

// Dynamically import VideoMessageRecorder to avoid SSR issues
const VideoMessageRecorder = dynamic(() => import('../../components/VideoMessageRecorder'), { ssr: false });

// Event/Stream interface
interface EventStream {
  id: string;
  title: string;
  photographer: string;
  category: string;
  videoSrc: string;
  streamId: string;
  viewers: number;
  startTime: string;
  messages: Message[];
}

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  delivered: boolean;
  avatar: string;
  videoUrl?: string;
  replyTo?: {
    id: number;
    sender: string;
  };
}

// Main App Component
const App = () => {
  // State for multiple events (up to 3)
  const [events, setEvents] = useState<EventStream[]>([
    {
      id: "event-1",
      title: "Beautiful Wedding Ceremony Live Stream",
      photographer: "John Anderson Photography",
      viewers: 15886,
      category: "Wedding Events",
      videoSrc: "/live-stream.mp4",
      streamId: "vwx-jcvv-sfg",
      startTime: "Started 2 hours ago",
      messages: [
        {
          id: 1,
          sender: "Moise caicedo",
          text: "Hey, I want to wish you a beautiful wedding day filled with love, grace, and blessings your lovely friend.",
          time: "8:30 PM",
          delivered: true,
          avatar: "https://i.pravatar.cc/150?img=12"
        },
        {
          id:2,
          sender:"cole palmer",
          text:"Hey, may your wedding day mark the start of a lifetime of love and blessings your lovely friend.",
          time:"2:00 PM",
          delivered:true,
          avatar: "https://i.pravatar.cc/150?img=33"
        },
        {
          id:3,
          sender:"Enzo fernandez",
          text:"Hey, congratulations on your wedding day; may your union be surrounded by joy, peace, and grace",
          time:"11:00 AM",
          delivered:true,
          avatar: "https://i.pravatar.cc/150?img=5"
        },
      ]
    }
  ]);

  // Main focused event (index in events array)
  const [mainEventIndex, setMainEventIndex] = useState(0);
  const mainEvent = events[mainEventIndex];

  // Swap animation state
  const [isSwapping, setIsSwapping] = useState(false);
  const [swappingFromIndex, setSwappingFromIndex] = useState<number | null>(null);
  const [swappingToIndex, setSwappingToIndex] = useState<number | null>(null);

  // State for the new message input
  const [newMessage, setNewMessage] = useState("");
  // Load saved volume from localStorage or default to 100
  const getSavedVolume = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('livestream-volume');
      return saved ? parseInt(saved, 10) : 100;
    }
    return 100;
  };

  // State for video playback - per event
  const [playbackState, setPlaybackState] = useState<{ [key: string]: { isPlaying: boolean; isMuted: boolean; progress: number; volume: number } }>({
    "event-1": { isPlaying: false, isMuted: false, progress: 0, volume: getSavedVolume() }
  });

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  // Refs for the video elements - one per event
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  // Ref to always have latest playback state in enforcement loop
  const playbackStateRef = useRef(playbackState);
  // Direct volume storage ref - bypasses React state for immediate access
  const volumeRef = useRef<{ [key: string]: number }>({ "event-1": getSavedVolume() });

  // Update ref whenever playback state changes
  useEffect(() => {
    playbackStateRef.current = playbackState;
  }, [playbackState]);

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    const mainEventId = events[mainEventIndex]?.id;
    if (mainEventId && playbackState[mainEventId]) {
      const volume = playbackState[mainEventId].volume;
      if (typeof window !== 'undefined') {
        localStorage.setItem('livestream-volume', volume.toString());
        console.log(`[localStorage] Saved volume: ${volume}`);
      }
    }
  }, [playbackState, mainEventIndex, events]);

  // State for modals
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [newEventId, setNewEventId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [showReportIssues, setShowReportIssues] = useState(false);
  const [videoQuality, setVideoQuality] = useState<'auto' | '1080p' | '720p' | '480p' | '360p' | 'source'>('auto');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  // Emoji reactions state
  const [activeReactions, setActiveReactions] = useState<Array<{ id: number; emoji: string; timestamp: number }>>([]);
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  // Copy state
  const [isCopied, setIsCopied] = useState(false);
  const [showVideoMessageRecorder, setShowVideoMessageRecorder] = useState(false);
  // Message actions state
  const [openMessageMenu, setOpenMessageMenu] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: number; sender: string; text: string } | null>(null);
  // Video controls visibility state
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Enforce video states - mute mini-players and manage main player pause state
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Skip enforcement during swaps to prevent conflicts
      if (isSwapping) return;

      // Use ref to get latest playback state without closure issues
      const currentPlaybackState = playbackStateRef.current;

      events.forEach((event, idx) => {
        const video = videoRefs.current[event.id];
        if (!video) return;

        const state = currentPlaybackState[event.id];

        if (idx !== mainEventIndex) {
          // Mini-player: ALWAYS muted, volume at 0, and ALWAYS playing
          if (!video.muted) {
            video.muted = true;
          }
          if (video.volume !== 0) {
            video.volume = 0;
          }
          // Keep mini-players playing at all times
          if (video.paused) {
            video.play().catch(err => console.log(`Mini-player play error for ${event.id}:`, err));
          }
        } else {
          // Main player: Enforce correct volume and mute state
          if (state) {
            // ALWAYS enforce volume from volumeRef (source of truth) - this is critical to prevent resets
            const savedVolume = volumeRef.current[event.id] ?? state.volume ?? 100;
            const targetVolume = savedVolume / 100;
            // Set volume EVERY TIME to override any browser/DOM resets
            if (video.volume !== targetVolume) {
              console.log(`[Enforcement] Volume correction needed. Video: ${video.volume}, volumeRef: ${volumeRef.current[event.id]}, State: ${state.volume}, Setting to: ${targetVolume}`);
              video.volume = targetVolume;
            }

            // Enforce unmuted (unless user explicitly muted it)
            // Only change mute if video is playing (when paused, we mute for safety)
            if (state.isPlaying) {
              if (!state.isMuted && video.muted) {
                video.muted = false;
              } else if (state.isMuted && !video.muted) {
                video.muted = true;
              }
            }

            // Respect pause state - ONLY pause if needed, don't auto-play
            // (togglePlay handles playing, this loop only prevents unwanted playback)
            if (!state.isPlaying && !video.paused) {
              video.pause();
              // Extra safety: mute when paused to prevent audio leaks
              video.muted = true;
              console.log(`[Enforcement] Pausing ${event.id} - state says paused but video is playing`);
            }
            // Don't auto-resume here - let togglePlay handle it to avoid conflicts
          }
        }
      });
    }, 200); // Check more frequently (every 200ms) to catch resets quickly

    return () => clearInterval(intervalId);
  }, [mainEventIndex, events.length, isSwapping]); // Don't include playbackState to avoid re-creating interval

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const updatedEvents = [...events];
      const messageText = replyingTo
        ? `@${replyingTo.sender} ${newMessage}`
        : newMessage;

      updatedEvents[mainEventIndex].messages = [
        ...updatedEvents[mainEventIndex].messages,
        {
          id: updatedEvents[mainEventIndex].messages.length + 1,
          sender: "You",
          text: messageText,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          delivered: false,
          avatar: "https://i.pravatar.cc/150?img=1",
          replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender } : undefined
        },
      ];
      setEvents(updatedEvents);
      setNewMessage("");
      setReplyingTo(null);
    }
  };

  // Handle sending a video message
  const handleSendVideoMessage = (videoBlob: Blob) => {
    // Create a URL for the video blob to display in chat
    const videoUrl = URL.createObjectURL(videoBlob);

    const updatedEvents = [...events];
    updatedEvents[mainEventIndex].messages = [
      ...updatedEvents[mainEventIndex].messages,
      {
        id: updatedEvents[mainEventIndex].messages.length + 1,
        sender: "You",
        text: "[Video Message]",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        delivered: false,
        avatar: "https://i.pravatar.cc/150?img=1",
        videoUrl // Store video URL in message
      },
    ];
    setEvents(updatedEvents);

    // Here you would typically upload the videoBlob to your server
    console.log('Video message recorded:', videoBlob);
  };

  // Handle delete message
  const handleDeleteMessage = (messageId: number) => {
    const updatedEvents = [...events];
    updatedEvents[mainEventIndex].messages = updatedEvents[mainEventIndex].messages.filter(
      msg => msg.id !== messageId
    );
    setEvents(updatedEvents);
    setOpenMessageMenu(null);
  };

  // Handle edit message
  const handleEditMessage = (messageId: number, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingMessageText(currentText);
    setOpenMessageMenu(null);
  };

  // Handle save edited message
  const handleSaveEditedMessage = (messageId: number) => {
    if (editingMessageText.trim()) {
      const updatedEvents = [...events];
      const messageIndex = updatedEvents[mainEventIndex].messages.findIndex(
        msg => msg.id === messageId
      );
      if (messageIndex !== -1) {
        updatedEvents[mainEventIndex].messages[messageIndex].text = editingMessageText.trim();
        setEvents(updatedEvents);
      }
    }
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  // Handle block user
  const handleBlockUser = (sender: string) => {
    // In a real app, this would block the user and filter their messages
    alert(`Blocked user: ${sender}`);
    setOpenMessageMenu(null);
  };

  // Handle reply to message
  const handleReplyToMessage = (messageId: number, sender: string, text: string) => {
    setReplyingTo({ id: messageId, sender, text });
    setOpenMessageMenu(null);
    // Focus on the message input
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="Send a message"]') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // Toggle video play/pause - ONLY for main player
  const togglePlay = (eventId: string) => {
    const video = videoRefs.current[eventId];
    if (video) {
      console.log(`[togglePlay] ===== TOGGLE PLAY START =====`);

      // Read current playing state from React state (for UI consistency)
      const currentState = playbackState[eventId];
      const currentRefState = playbackStateRef.current[eventId];
      const willBePlaying = !currentState?.isPlaying;

      // CRITICAL: Read volume from volumeRef FIRST (direct storage, always current)
      const preservedVolume = volumeRef.current[eventId] ?? currentRefState?.volume ?? currentState?.volume ?? 100;
      console.log(`[togglePlay] Volume sources - volumeRef: ${volumeRef.current[eventId]}, playbackStateRef: ${currentRefState?.volume}, state: ${currentState?.volume}, using: ${preservedVolume}`);

      // STEP 1: Update volumeRef to ensure it's preserved
      volumeRef.current[eventId] = preservedVolume;

      // STEP 2: Update the playbackStateRef (before state) - critical for immediate reads
      playbackStateRef.current = {
        ...playbackStateRef.current,
        [eventId]: {
          ...currentRefState,
          isPlaying: willBePlaying,
          volume: preservedVolume // Explicitly preserve volume
        }
      };
      console.log(`[togglePlay] Updated playbackStateRef with volume:`, playbackStateRef.current[eventId]?.volume);

      // STEP 3: Update React state (async)
      setPlaybackState(prev => ({
        ...prev,
        [eventId]: {
          ...prev[eventId],
          isPlaying: willBePlaying,
          volume: preservedVolume // Explicitly preserve volume
        }
      }));

      // STEP 4: Apply to main video only
      if (willBePlaying) {
        // When playing, restore main player's volume and mute state
        console.log(`[togglePlay] PLAYING - setting video.volume to:`, preservedVolume / 100);
        video.muted = currentRefState?.isMuted || false;
        video.volume = preservedVolume / 100;
        console.log(`[togglePlay] Video element volume is now:`, video.volume);
        video.play().catch(err => console.log('Play error:', err));
      } else {
        // When pausing main player, mute it to prevent audio leaks
        // But PRESERVE the volume level in state AND DOM
        console.log(`[togglePlay] PAUSING - setting video.volume to:`, preservedVolume / 100);
        video.muted = true;
        video.volume = preservedVolume / 100; // Keep volume in DOM even when muted
        console.log(`[togglePlay] Video element volume is now:`, video.volume);
        video.pause();
      }

      // Ensure ALL mini-players continue playing (muted)
      events.forEach((event, idx) => {
        if (idx !== mainEventIndex) {
          const miniVideo = videoRefs.current[event.id];
          if (miniVideo) {
            miniVideo.muted = true;
            miniVideo.volume = 0;
            // Keep mini-players playing
            if (miniVideo.paused) {
              miniVideo.play().catch(err => console.log('Mini play error:', err));
            }
          }
        }
      });

      console.log(`[togglePlay] ===== TOGGLE PLAY END =====`);
    }
  };

  // Toggle video mute - ONLY for main player
  const toggleMute = (eventId: string) => {
    const video = videoRefs.current[eventId];
    if (video) {
      // Only allow mute toggle on main player
      const mainEventId = events[mainEventIndex]?.id;
      if (eventId !== mainEventId) {
        // Mini-players must always be muted
        return;
      }

      const currentState = playbackState[eventId];
      const newMutedState = !currentState?.isMuted;
      video.muted = newMutedState;
      setPlaybackState(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], isMuted: newMutedState }
      }));
    }
  };

  // Handle volume change
  const handleVolumeChange = (eventId: string, newVolume: number) => {
    console.log(`[handleVolumeChange] ===== VOLUME CHANGE START ===== Setting volume to ${newVolume} for ${eventId}`);
    const video = videoRefs.current[eventId];
    if (video) {
      // STEP 1: Store in direct volume ref FIRST - this is the source of truth
      volumeRef.current[eventId] = newVolume;
      console.log(`[handleVolumeChange] Stored in volumeRef:`, volumeRef.current[eventId]);

      // STEP 2: Set video element volume immediately
      video.volume = newVolume / 100;
      console.log(`[handleVolumeChange] Video element volume set to:`, video.volume);

      // STEP 3: Update the playbackStateRef (before state) - for enforcement loop
      const updatedEventState = {
        ...playbackStateRef.current[eventId],
        volume: newVolume,
        isMuted: newVolume === 0
      };
      playbackStateRef.current = {
        ...playbackStateRef.current,
        [eventId]: updatedEventState
      };
      console.log(`[handleVolumeChange] Updated playbackStateRef:`, playbackStateRef.current[eventId]);

      // STEP 4: Update React state (async) - for UI
      setPlaybackState(prev => {
        const newState = {
          ...prev,
          [eventId]: {
            ...prev[eventId],
            volume: newVolume,
            isMuted: newVolume === 0
          }
        };
        console.log(`[handleVolumeChange] Updated React state:`, newState[eventId]);
        return newState;
      });

      // STEP 5: Update mute state
      if (newVolume === 0) {
        video.muted = true;
      } else if (playbackStateRef.current[eventId]?.isMuted) {
        video.muted = false;
      }

      console.log(`[handleVolumeChange] ===== VOLUME CHANGE END =====`);
    }
  };

  // Update video progress bar
  const handleTimeUpdate = (eventId: string) => {
    const video = videoRefs.current[eventId];
    if (video) {
      const progress = (video.currentTime / video.duration) * 100;
      setPlaybackState(prev => ({
        ...prev,
        [eventId]: { ...prev[eventId], progress }
      }));
    }
  };

  // Effect to add listeners for main video
  useEffect(() => {
    const video = videoRefs.current[mainEvent.id];
    if (video) {
        const handleUpdate = () => handleTimeUpdate(mainEvent.id);

        const handlePlay = () => {
          console.log(`[handlePlay Listener] Play event on main video`);
          // When main plays, update all video states - preserve volume from volumeRef
          const newStates: { [key: string]: any } = {};
          events.forEach(event => {
            const preservedVolume = volumeRef.current[event.id] ?? playbackStateRef.current[event.id]?.volume ?? 100;
            newStates[event.id] = {
              ...playbackState[event.id],
              isPlaying: true,
              volume: preservedVolume // CRITICAL: preserve from volumeRef
            };
            console.log(`[handlePlay Listener] Event ${event.id} volume: ${preservedVolume}`);
          });
          setPlaybackState(prev => ({ ...prev, ...newStates }));
        };

        const handlePause = () => {
          console.log(`[handlePause Listener] Pause event on main video`);
          // When main pauses, pause ALL videos - preserve volume from volumeRef
          const newStates: { [key: string]: any } = {};
          events.forEach(event => {
            const preservedVolume = volumeRef.current[event.id] ?? playbackStateRef.current[event.id]?.volume ?? 100;
            newStates[event.id] = {
              ...playbackState[event.id],
              isPlaying: false,
              volume: preservedVolume // CRITICAL: preserve from volumeRef
            };
            console.log(`[handlePause Listener] Event ${event.id} volume: ${preservedVolume}`);
          });
          setPlaybackState(prev => ({ ...prev, ...newStates }));

          // Actually pause all video elements
          events.forEach(event => {
            const v = videoRefs.current[event.id];
            if (v && !v.paused) {
              v.pause();
            }
          });
        };

        video.addEventListener('timeupdate', handleUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', handleUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }
  }, [mainEvent.id, events]);

  // Sync video elements when main event ID changes only (not on every state change)
  useEffect(() => {
    // Skip sync during swaps - the swap function handles it
    if (isSwapping) return;

    // Use a ref to track if we've already applied state to prevent loops
    let isApplying = false;

    const syncVideos = () => {
      if (isApplying || isSwapping) return;
      isApplying = true;

      const mainVideo = videoRefs.current[mainEvent.id];
      const mainState = playbackState[mainEvent.id];

      // Apply state to main video
      if (mainVideo && mainState) {
        mainVideo.muted = mainState.isMuted || false;
        mainVideo.volume = (mainState.volume ?? 100) / 100;

        if (mainState.isPlaying && mainVideo.paused) {
          mainVideo.play().catch(err => console.log('Main play error:', err));
        } else if (!mainState.isPlaying && !mainVideo.paused) {
          mainVideo.muted = true; // Mute when pausing to prevent audio leaks
          mainVideo.pause();
          // Keep volume in DOM even when paused
          mainVideo.volume = (mainState.volume ?? 100) / 100;
        }
      }

      // Sync ALL videos (not just mini-players)
      events.forEach((event, idx) => {
        const video = videoRefs.current[event.id];
        if (!video) return;

        const state = playbackState[event.id];

        if (idx !== mainEventIndex) {
          // Mini-player: ALWAYS muted with zero volume and ALWAYS playing
          video.muted = true;
          video.volume = 0;
          // Keep mini-players playing
          if (video.paused) {
            video.play().catch(err => console.log(`[Sync] Mini play error for ${event.id}:`, err));
          }
        } else {
          // Main player: Enforce pause state
          if (state) {
            if (!state.isPlaying && !video.paused) {
              video.muted = true; // Mute when pausing to prevent audio leaks
              video.pause();
              console.log(`[Sync] Paused ${event.id}`);
            } else if (state.isPlaying && video.paused) {
              // Restore proper mute state when playing
              video.muted = state.isMuted || false;
              video.play().catch(err => console.log(`[Sync] Play error for ${event.id}:`, err));
            }
          }
        }
      });

      isApplying = false;
    };

    syncVideos();
    const timeoutId = setTimeout(syncVideos, 150);
    // Also check after a longer delay to catch late-mounting videos
    const timeoutId2 = setTimeout(syncVideos, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [mainEvent.id, isSwapping]); // Depend on isSwapping to skip during swaps

  // Handle adding new event
  const handleAddEvent = () => {
    if (newEventId.trim() && events.length < 3) {
      const newEvent: EventStream = {
        id: `event-${Date.now()}`,
        title: "New Event Live Stream",
        photographer: "Guest Photographer",
        viewers: 1250,
        category: "Live Events",
        videoSrc: events.length === 1 ? "/live-stream-2.mp4" : "/bak",
        streamId: newEventId.trim(),
        startTime: "Just started",
        messages: []
      };

      // Use saved volume from localStorage or current main volume
      const savedVolume = getSavedVolume();
      const currentMainVolume = playbackState[events[mainEventIndex].id]?.volume ?? savedVolume;
      console.log(`[handleAddEvent] New event volume: ${currentMainVolume}`);

      setEvents(prev => [...prev, newEvent]);
      setPlaybackState(prev => ({
        ...prev,
        [newEvent.id]: { isPlaying: true, isMuted: false, progress: 0, volume: currentMainVolume }
      }));

      // Switch to the new event as main
      setMainEventIndex(events.length);

      setShowAddEventModal(false);
      setNewEventId("");

      // Mute the current main (will become mini) with zero volume
      setTimeout(() => {
        const currentMainVideo = videoRefs.current[events[mainEventIndex].id];
        if (currentMainVideo) {
          currentMainVideo.muted = true;
          currentMainVideo.volume = 0;
        }
      }, 100);
    }
  };

  // Switch main event with animation - COMPLETELY REFACTORED
  const switchToMainEvent = (index: number) => {
    if (index !== mainEventIndex && !isSwapping) {
      setIsSwapping(true);
      setSwappingFromIndex(mainEventIndex);
      setSwappingToIndex(index);

      const newMainEventId = events[index].id;
      const oldMainEventId = events[mainEventIndex].id;

      // Get current states
      const oldMainState = playbackState[oldMainEventId] || { volume: 100, isPlaying: true, isMuted: false };
      const newMainState = playbackState[newMainEventId] || { volume: 100, isPlaying: true, isMuted: true };

      // Save the volume we want to apply to new main (keep the current main's volume setting)
      const targetVolume = oldMainState.volume ?? 100;

      // CRITICAL: Save current playback positions (currentTime) BEFORE any manipulation
      const savedPositions: { [key: string]: number } = {};
      events.forEach((event) => {
        const video = videoRefs.current[event.id];
        if (video) {
          savedPositions[event.id] = video.currentTime;
        }
      });

      // IMMEDIATELY pause, mute ALL videos and set volume to 0 to prevent audio overlap during animation
      events.forEach((event) => {
        const video = videoRefs.current[event.id];
        if (video) {
          video.pause();
          video.muted = true;
          video.volume = 0;
        }
      });

      // Wait for animation to complete before switching
      setTimeout(() => {
        // Switch the main event index
        setMainEventIndex(index);
        setNewMessage("");

        // Update states - DO THIS ONCE, not multiple times
        const newStates: { [key: string]: any } = {};

        // New main player state
        newStates[newMainEventId] = {
          volume: targetVolume,
          isMuted: false,
          isPlaying: true,
          progress: newMainState.progress || 0
        };

        // Old main (now mini) state - always playing
        newStates[oldMainEventId] = {
          volume: 0,
          isMuted: true,
          isPlaying: true, // Mini-players always play
          progress: oldMainState.progress || 0
        };

        // Update state ONCE
        setPlaybackState(prev => ({
          ...prev,
          ...newStates
        }));

        // Apply to DOM after state update
        setTimeout(() => {
          // First, get fresh references to ALL video elements
          const allVideoRefs = Object.keys(videoRefs.current);

          // CRITICAL: Pause and mute ALL videos first to prevent any ghost playback
          allVideoRefs.forEach(eventId => {
            const video = videoRefs.current[eventId];
            if (video) {
              video.pause();
              video.muted = true;
              video.volume = 0;
            }
          });

          // Small delay to ensure all videos are stopped
          setTimeout(() => {
            // NOW configure the new main player - UNMUTE, set proper volume, and RESTORE position
            const freshNewMainVideo = videoRefs.current[newMainEventId];
            if (freshNewMainVideo) {
              // Restore the playback position from before the swap
              if (savedPositions[newMainEventId] !== undefined) {
                freshNewMainVideo.currentTime = savedPositions[newMainEventId];
              }
              freshNewMainVideo.muted = false;
              freshNewMainVideo.volume = targetVolume / 100;
              freshNewMainVideo.play().catch(err => console.log('Play error:', err));
            }

            // Ensure all mini-players (including old main) stay muted with zero volume and PLAYING
            events.forEach((event, idx) => {
              if (idx !== index) {
                const video = videoRefs.current[event.id];
                if (video) {
                  // Restore the playback position for mini-players too
                  if (savedPositions[event.id] !== undefined) {
                    video.currentTime = savedPositions[event.id];
                  }
                  video.muted = true;
                  video.volume = 0;
                  // Mini-players ALWAYS play
                  if (video.paused) {
                    video.play().catch(err => console.log('Mini play error:', err));
                  }
                }
              }
            });
          }, 30);
        }, 20);

        // Reset animation state
        setTimeout(() => {
          setIsSwapping(false);
          setSwappingFromIndex(null);
          setSwappingToIndex(null);
        }, 80);
      }, 500); // Animation duration - matches CSS animation
    }
  };

  // Handle leaving/removing an event
  const handleLeaveStream = () => {
    if (events.length === 1) {
      // Last event, go back
      window.history.back();
    } else {
      // Remove main event
      const updatedEvents = events.filter((_, idx) => idx !== mainEventIndex);
      setEvents(updatedEvents);

      // Delete playback state for removed event
      setPlaybackState(prev => {
        const newState = { ...prev };
        delete newState[mainEvent.id];
        return newState;
      });

      // Set first remaining event as main
      setMainEventIndex(0);
    }
  };

  // Handle mouse movement on video player - show controls
  const handleMouseMove = () => {
    setShowControls(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Set new timeout to hide controls after 2 seconds of inactivity
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      // Also close any open popups when hiding controls
      setShowEmojiPicker(false);
      setShowSettings(false);
      setShowParticipants(false);
    }, 1000);
  };

  // Handle mouse leaving video player - hide controls
  const handleMouseLeave = () => {
    // Only hide if not in fullscreen (in fullscreen, keep auto-hide behavior)
    if (!isFullscreen) {
      setShowControls(false);
      // Also close any open popups
      setShowEmojiPicker(false);
      setShowSettings(false);
      setShowParticipants(false);
    }

    // Clear timeout when mouse leaves
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle emoji reaction
  const handleEmojiReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now() + Math.random(),
      emoji: emoji,
      timestamp: Date.now()
    };

    setActiveReactions(prev => [...prev, newReaction]);

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

  // Handle copy stream ID
  const handleCopyStreamId = async () => {
    try {
      await navigator.clipboard.writeText(mainEvent.streamId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy stream ID:', err);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const videoContainer = videoRefs.current[mainEvent.id]?.parentElement;
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

      // Show controls when entering fullscreen, let auto-hide take over
      if (isCurrentlyFullscreen) {
        setShowControls(true);
        // Start the auto-hide timer
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 10);
      } else {
        // Show controls when exiting fullscreen
        setShowControls(true);
      }
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

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-menu') && !target.closest('.settings-button')) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const mainState = playbackState[mainEvent.id];
      const mainVideo = videoRefs.current[mainEvent.id];

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay(mainEvent.id);
          break;
        case 'm':
          e.preventDefault();
          toggleMute(mainEvent.id);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (isFullscreen) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(mainEvent.id, Math.min((mainState?.volume || 100) + 10, 100));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(mainEvent.id, Math.max((mainState?.volume || 100) - 10, 0));
          break;
        case 'arrowleft':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.max(mainVideo.currentTime - 5, 0);
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.min(
              mainVideo.currentTime + 5,
              mainVideo.duration
            );
          }
          break;
        case 'j':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.max(mainVideo.currentTime - 10, 0);
          }
          break;
        case 'l':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = Math.min(
              mainVideo.currentTime + 10,
              mainVideo.duration
            );
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
          e.preventDefault();
          if (mainVideo && mainVideo.duration) {
            const percentage = parseInt(e.key) / 10;
            mainVideo.currentTime = mainVideo.duration * percentage;
          }
          break;
        case 'home':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = 0;
          }
          break;
        case 'end':
          e.preventDefault();
          if (mainVideo) {
            mainVideo.currentTime = mainVideo.duration;
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [playbackState, mainEvent.id, isFullscreen]);

  // Handle quality change
  const handleQualityChange = (quality: 'auto' | '1080p' | '720p' | '480p' | '360p' | 'source') => {
    setVideoQuality(quality);
    console.log('Quality changed to:', quality);
  };

  // Handle captions toggle
  const handleCaptionsToggle = () => {
    setCaptionsEnabled(!captionsEnabled);
    const video = videoRefs.current[mainEvent.id];
    if (video) {
      const tracks = video.textTracks;
      if (tracks.length > 0) {
        tracks[0].mode = !captionsEnabled ? 'showing' : 'hidden';
      }
    }
  };

  // Handle report issue
  const handleReportIssue = (issueType: string) => {
    setShowSettings(false);
    setShowReportIssues(false);
    alert(`Thank you for reporting: "${issueType}". Our team will investigate this shortly.`);
    console.log('Reported issue:', issueType);
  };

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMessageMenu !== null) {
        setOpenMessageMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMessageMenu]);

  // Handle video seek
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRefs.current[mainEvent.id];
    if (!video) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * video.duration;

    video.currentTime = newTime;
    setPlaybackState(prev => ({
      ...prev,
      [mainEvent.id]: { ...prev[mainEvent.id], progress: pos * 100 }
    }));
  };

  // Handle rating submission
  const handleSubmitRating = () => {
    if (rating === 0) {
      alert('Please select a rating before submitting.');
      return;
    }

    console.log('Rating submitted:', {
      rating,
      comment: ratingComment,
      streamId: mainEvent.streamId,
      photographer: mainEvent.photographer
    });

    alert(`Thank you for rating this live stream ${rating} star${rating > 1 ? 's' : ''}!`);

    setShowRatingModal(false);
    setRating(0);
    setRatingComment('');
  };

  // Start/Stop Recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const video = videoRefs.current[mainEvent.id];
        if (!video) {
          alert('Video element not found');
          return;
        }

        const videoStream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();

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

          const a = document.createElement('a');
          a.href = url;
          a.download = `livestream-recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setRecordedChunks([]);
        };

        recorder.start(1000);
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        alert('Failed to start recording. This feature may not be supported in your browser.');
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        setIsRecording(false);
        setMediaRecorder(null);
      }
    }
  };

  // Get main state with proper defaults using nullish coalescing for individual properties
  const mainState = playbackState[mainEvent.id]
    ? playbackState[mainEvent.id]
    : { isPlaying: false, isMuted: false, progress: 0, volume: 100 };

  // Log if we're using default state
  if (!playbackState[mainEvent.id]) {
    console.warn(`[mainState] No playback state found for ${mainEvent.id}, using defaults`);
  }

  // Main component render
  return (
    <>
      <style>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Cursor hiding when controls are hidden */
        .video-player-container {
          cursor: pointer;
        }

        .video-player-container.hide-cursor {
          cursor: none !important;
        }

        .video-player-container.hide-cursor * {
          cursor: none !important;
        }

        /* Fullscreen specific cursor hiding */
        .video-player-container:fullscreen.hide-cursor,
        .video-player-container:-webkit-full-screen.hide-cursor,
        .video-player-container:-moz-full-screen.hide-cursor,
        .video-player-container:-ms-fullscreen.hide-cursor {
          cursor: none !important;
        }

        .video-player-container:fullscreen.hide-cursor *,
        .video-player-container:-webkit-full-screen.hide-cursor *,
        .video-player-container:-moz-full-screen.hide-cursor *,
        .video-player-container:-ms-fullscreen.hide-cursor * {
          cursor: none !important;
        }

        /* Make fullscreen take full height and ensure proper rendering */
        .video-player-container:fullscreen,
        .video-player-container:-webkit-full-screen,
        .video-player-container:-moz-full-screen,
        .video-player-container:-ms-fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          max-height: 100vh !important;
          background: #000 !important;
        }

        /* Ensure video fills fullscreen container */
        .video-player-container:fullscreen video,
        .video-player-container:-webkit-full-screen video,
        .video-player-container:-moz-full-screen video,
        .video-player-container:-ms-fullscreen video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
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

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes cardSwapMainToMini {
          0% {
            transform: scale(1) translate(0, 0) rotateZ(0deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 20px 60px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.3);
            filter: brightness(1.1);
          }
          15% {
            transform: scale(0.92) translate(-5vw, 8vh) rotateZ(-4deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 25px 70px rgba(3, 150, 156, 0.7), 0 0 120px rgba(3, 150, 156, 0.4);
            filter: brightness(1.15);
          }
          35% {
            transform: scale(0.65) translate(-8vw, 20vh) rotateZ(-8deg);
            opacity: 0.95;
            z-index: 1500;
            box-shadow: 0 30px 80px rgba(3, 150, 156, 0.8), 0 0 140px rgba(3, 150, 156, 0.5);
            filter: brightness(1.2);
          }
          50% {
            transform: scale(0.5) translate(-6vw, 32vh) rotateZ(-6deg);
            opacity: 0.9;
            z-index: 1000;
            box-shadow: 0 35px 90px rgba(3, 150, 156, 0.9), 0 0 160px rgba(3, 150, 156, 0.6);
            filter: brightness(1.1);
          }
          70% {
            transform: scale(0.38) translate(-3vw, 45vh) rotateZ(-3deg);
            opacity: 0.95;
            z-index: 500;
            box-shadow: 0 20px 50px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.4);
            filter: brightness(1.05);
          }
          90% {
            transform: scale(0.33) translate(-1vw, 52vh) rotateZ(-1deg);
            opacity: 1;
            z-index: 100;
            box-shadow: 0 12px 35px rgba(3, 150, 156, 0.4), 0 0 60px rgba(3, 150, 156, 0.2);
            filter: brightness(1);
          }
          100% {
            transform: scale(0.32) translate(0, 54vh) rotateZ(0deg);
            opacity: 1;
            z-index: 1;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            filter: brightness(1);
          }
        }

        @keyframes cardSwapMiniToMain {
          0% {
            transform: scale(0.32) translate(0, 0) rotateZ(0deg);
            opacity: 1;
            z-index: 1;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            filter: brightness(1);
          }
          10% {
            transform: scale(0.33) translate(1vw, -2vh) rotateZ(1deg);
            opacity: 1;
            z-index: 100;
            box-shadow: 0 12px 35px rgba(3, 150, 156, 0.4), 0 0 60px rgba(3, 150, 156, 0.2);
            filter: brightness(1);
          }
          30% {
            transform: scale(0.38) translate(3vw, -10vh) rotateZ(3deg);
            opacity: 0.95;
            z-index: 500;
            box-shadow: 0 20px 50px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.4);
            filter: brightness(1.05);
          }
          50% {
            transform: scale(0.5) translate(6vw, -22vh) rotateZ(6deg);
            opacity: 0.9;
            z-index: 1000;
            box-shadow: 0 35px 90px rgba(3, 150, 156, 0.9), 0 0 160px rgba(3, 150, 156, 0.6);
            filter: brightness(1.1);
          }
          65% {
            transform: scale(0.65) translate(8vw, -36vh) rotateZ(8deg);
            opacity: 0.95;
            z-index: 1500;
            box-shadow: 0 30px 80px rgba(3, 150, 156, 0.8), 0 0 140px rgba(3, 150, 156, 0.5);
            filter: brightness(1.2);
          }
          85% {
            transform: scale(0.92) translate(5vw, -48vh) rotateZ(4deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 25px 70px rgba(3, 150, 156, 0.7), 0 0 120px rgba(3, 150, 156, 0.4);
            filter: brightness(1.15);
          }
          100% {
            transform: scale(1) translate(0, -54vh) rotateZ(0deg);
            opacity: 1;
            z-index: 2000;
            box-shadow: 0 20px 60px rgba(3, 150, 156, 0.6), 0 0 100px rgba(3, 150, 156, 0.3);
            filter: brightness(1.1);
          }
        }

        @keyframes fadeInOut {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes trailGlow {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(3, 150, 156, 0.4),
              0 0 40px rgba(3, 150, 156, 0.3),
              0 0 60px rgba(3, 150, 156, 0.2);
          }
          50% {
            box-shadow:
              0 0 40px rgba(3, 150, 156, 0.8),
              0 0 80px rgba(3, 150, 156, 0.6),
              0 0 120px rgba(3, 150, 156, 0.4),
              0 0 160px rgba(3, 150, 156, 0.2);
          }
        }

        .swapping-main-to-mini {
          animation:
            cardSwapMainToMini 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards,
            trailGlow 0.5s ease-in-out infinite;
          position: relative;
          will-change: transform, opacity, filter;
          pointer-events: none;
          z-index: 2000;
          isolation: isolate;
        }

        .swapping-mini-to-main {
          animation:
            cardSwapMiniToMain 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards,
            trailGlow 0.5s ease-in-out infinite;
          position: relative;
          will-change: transform, opacity, filter;
          pointer-events: none;
          z-index: 2000;
          isolation: isolate;
        }

        .swapping-main-to-mini::before,
        .swapping-mini-to-main::before {
          content: '';
          position: absolute;
          inset: -10px;
          background: linear-gradient(45deg,
            rgba(3, 150, 156, 0.3),
            rgba(3, 150, 156, 0.1),
            rgba(3, 150, 156, 0.3));
          border-radius: 12px;
          opacity: 0.6;
          filter: blur(20px);
          z-index: -1;
          animation: trailGlow 0.8s ease-in-out infinite;
        }

        button {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        /* Scrollbar Styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Volume Slider Styling */
        input[type="range"].volume-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"].volume-slider::-webkit-slider-track {
          height: 3px;
          border-radius: 2px;
        }

        input[type="range"].volume-slider::-moz-range-track {
          height: 3px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.3);
        }

        input[type="range"].volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          margin-top: -4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }

        input[type="range"].volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }

        input[type="range"].volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }

        input[type="range"].volume-slider::-moz-range-thumb:hover {
          transform: scale(1.3);
        }

        /* Progress Bar Styling */
        input[type="range"].progress-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: transparent;
          cursor: pointer;
          outline: none;
        }

        input[type="range"].progress-slider::-webkit-slider-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        input[type="range"].progress-slider::-moz-range-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        input[type="range"].progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #03969c;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          transition: all 0.2s;
        }

        input[type="range"].progress-slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #03969c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          transition: all 0.2s;
        }

        input[type="range"].progress-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        input[type="range"].progress-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }

        /* Progress bar hover effect */
        .progress-bar-container:hover .progress-thumb {
          opacity: 1 !important;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1024px) {
          .main-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: 0 !important;
            gap: 0 !important;
          }

          .layout-wrapper {
            flex-direction: column !important;
          }

          .video-section {
            width: 100% !important;
          }

          .chat-section {
            width: 100% !important;
            height: 50vh !important;
            border-left: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          }

          .stream-info-section {
            padding: 12px !important;
          }

          .mini-players-container {
            flex-direction: column !important;
          }
        }

        @media (max-width: 768px) {
          .stream-title {
            font-size: 16px !important;
          }

          .photographer-name {
            font-size: 13px !important;
          }

          .stat-item {
            font-size: 12px !important;
          }

          .control-btn {
            font-size: 18px !important;
            padding: 6px !important;
          }

          .emoji-picker-bar {
            bottom: 60px !important;
            padding: 6px !important;
          }

          .participants-modal {
            width: 90% !important;
            max-width: 300px !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
          }
        }
      `}</style>

    {/* Swap Overlay Effect */}
    {isSwapping && (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(2px)',
        zIndex: 1500,
        pointerEvents: 'none',
        animation: 'fadeInOut 0.5s ease-in-out forwards'
      }} />
    )}

    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#0e0e10',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#efeff1',
      overflow: 'hidden'
    }} className="main-container">

        {/* Main Layout Wrapper */}
        <div style={{
          display: 'flex',
          width: '100%',
          height: '100vh',
          gap: '0'
        }} className="layout-wrapper">

          {/* Left Section: Video Player */}
          <div className="video-section" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0e0e10',
            overflow: isSwapping ? 'visible' : 'auto',
            position: 'relative'
          }}>

            {/* Main Video Player Container */}
            <div
              id="main-video-player"
              onClick={() => !isSwapping && togglePlay(mainEvent.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`video-player-container ${!showControls ? 'hide-cursor' : ''} ${isSwapping && swappingFromIndex === mainEventIndex ? 'swapping-main-to-mini' : ''}`}
              style={{
                height: events.length > 1 ? 'calc(100vh - 450px)' : 'calc(100vh - 200px)',
                minHeight: '400px',
                backgroundColor: '#000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: isSwapping ? 'visible' : 'hidden',
                transition: isSwapping ? 'none' : 'all 0.3s ease',
                zIndex: isSwapping && swappingFromIndex === mainEventIndex ? 1000 : 1,
                pointerEvents: isSwapping ? 'none' : 'auto'
              }}>
              <video
                key={mainEvent.id}
                ref={(el) => {
                  if (el) {
                    videoRefs.current[mainEvent.id] = el;
                    console.log(`[Video Ref] ===== VIDEO ELEMENT MOUNTED =====`);

                    // PRIORITY ORDER for volume:
                    // 1. volumeRef (direct storage - current session adjustments)
                    // 2. playbackStateRef (ref storage)
                    // 3. localStorage (from previous session)
                    // 4. Default 100

                    const currentState = playbackStateRef.current[mainEvent.id];
                    const savedVolume = getSavedVolume();

                    let volumeToSet = 100;

                    if (volumeRef.current[mainEvent.id] !== undefined) {
                      // HIGHEST PRIORITY: Use volumeRef (current session's adjustments)
                      volumeToSet = volumeRef.current[mainEvent.id];
                      console.log(`[Video Ref] Using volumeRef (CURRENT ADJUSTMENT): ${volumeToSet}`);
                    } else if (currentState && currentState.volume !== undefined) {
                      // Use playbackStateRef
                      volumeToSet = currentState.volume;
                      // Also update volumeRef to match
                      volumeRef.current[mainEvent.id] = volumeToSet;
                      console.log(`[Video Ref] Using playbackStateRef: ${volumeToSet}`);
                    } else {
                      // FALLBACK: Use saved volume from localStorage
                      volumeToSet = savedVolume;
                      volumeRef.current[mainEvent.id] = volumeToSet;
                      console.log(`[Video Ref] Using localStorage: ${volumeToSet}`);
                    }

                    el.volume = volumeToSet / 100;
                    el.muted = currentState?.isMuted || false;
                    console.log(`[Video Ref] Set video element volume to: ${volumeToSet} (el.volume=${el.volume})`);
                    console.log(`[Video Ref] ===== VIDEO ELEMENT MOUNT COMPLETE =====`);
                  } else {
                    // Clean up ref when element is unmounted
                    delete videoRefs.current[mainEvent.id];
                  }
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none'
                }}
                muted={mainState.isMuted}
                onPlay={() => {
                  console.log(`[onPlay Event] Video play event fired`);
                  // CRITICAL: Preserve volume from volumeRef (source of truth)
                  const currentVolume = volumeRef.current[mainEvent.id] ?? playbackStateRef.current[mainEvent.id]?.volume ?? 100;
                  console.log(`[onPlay Event] Preserving volume: ${currentVolume}`);

                  setPlaybackState(prev => ({
                    ...prev,
                    [mainEvent.id]: {
                      ...prev[mainEvent.id],
                      isPlaying: true,
                      volume: currentVolume // Use volumeRef as source
                    }
                  }));

                  // Update refs immediately
                  volumeRef.current[mainEvent.id] = currentVolume;
                  playbackStateRef.current = {
                    ...playbackStateRef.current,
                    [mainEvent.id]: {
                      ...playbackStateRef.current[mainEvent.id],
                      isPlaying: true,
                      volume: currentVolume
                    }
                  };
                }}
                onPause={() => {
                  console.log(`[onPause Event] Video pause event fired`);
                  // CRITICAL: Preserve volume from volumeRef (source of truth)
                  const currentVolume = volumeRef.current[mainEvent.id] ?? playbackStateRef.current[mainEvent.id]?.volume ?? 100;
                  console.log(`[onPause Event] Preserving volume: ${currentVolume}`);

                  setPlaybackState(prev => ({
                    ...prev,
                    [mainEvent.id]: {
                      ...prev[mainEvent.id],
                      isPlaying: false,
                      volume: currentVolume // Use volumeRef as source
                    }
                  }));

                  // Update refs immediately
                  volumeRef.current[mainEvent.id] = currentVolume;
                  playbackStateRef.current = {
                    ...playbackStateRef.current,
                    [mainEvent.id]: {
                      ...playbackStateRef.current[mainEvent.id],
                      isPlaying: false,
                      volume: currentVolume
                    }
                  };
                }}
              >
                <source src={mainEvent.videoSrc} type="video/mp4" />
              </video>

              {/* Viewer Count */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  zIndex: 10,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: showControls ? 1 : 0,
                  transform: showControls ? 'translateY(0)' : 'translateY(-20px)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}
              >
                <i className="bi bi-eye-fill"></i>
                {mainEvent.viewers.toLocaleString()}
              </div>

              {/* Live Badge */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: '#eb0400',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: showControls ? 1 : 0,
                  transform: showControls ? 'translateY(0)' : 'translateY(-20px)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                LIVE
              </div>

              {/* Play Button Overlay */}
              {!mainState.isPlaying && (
                <button onClick={() => togglePlay(mainEvent.id)} style={{
                  position: 'absolute',
                  zIndex: 10,
                  color: '#fff',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '50px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }} onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}>
                  <i className="bi bi-play-fill"></i>
                </button>
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '16px',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)',
                    opacity: showControls ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    animation: 'blink 1s infinite'
                  }}></div>
                  <span style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '700'
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
                    bottom: '60px',
                    fontSize: '48px',
                    animation: 'floatUp 3s ease-out forwards',
                    zIndex: 15,
                    pointerEvents: 'none'
                  }}
                >
                  {reaction.emoji}
                </div>
              ))}

              {/* Modern Video Controls */}
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  setShowControls(true);
                  if (controlsTimeoutRef.current) {
                    clearTimeout(controlsTimeoutRef.current);
                  }
                }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%)',
                  padding: '40px 16px 16px',
                  zIndex: 20,
                  opacity: showControls ? 1 : 0,
                  transform: showControls ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  pointerEvents: showControls ? 'auto' : 'none'
                }}
              >
                {/* Progress Bar */}
                <div
                  onClick={handleProgressChange}
                  className="progress-bar-container"
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    position: 'relative',
                    transition: 'height 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.height = '6px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.height = '4px';
                  }}
                >
                  <div style={{
                    height: '100%',
                    backgroundColor: '#03969c',
                    borderRadius: '2px',
                    width: `${mainState.progress}%`,
                    position: 'relative',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#03969c',
                      borderRadius: '50%',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }} className="progress-thumb"></div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#fff'
                }}>
                  <button onClick={() => togglePlay(mainEvent.id)} className="control-btn" style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '20px',
                    transition: 'transform 0.2s'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <i className={mainState.isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}></i>
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative'
                    }}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button onClick={() => toggleMute(mainEvent.id)} className="control-btn" style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '20px',
                      transition: 'transform 0.2s',
                      position: 'relative',
                      zIndex: 1
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                       onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                      <i className={mainState.isMuted || mainState.volume === 0 ? "bi bi-volume-mute-fill" : mainState.volume < 50 ? "bi bi-volume-down-fill" : "bi bi-volume-up-fill"}></i>
                    </button>

                    {/* Modern Volume Slider */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      opacity: showVolumeSlider ? 1 : 0,
                      width: showVolumeSlider ? 'auto' : '0',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      pointerEvents: showVolumeSlider ? 'auto' : 'none'
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '100px',
                        height: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${mainState.volume ?? 100}%`,
                          backgroundColor: '#03969c',
                          borderRadius: '2px',
                          transition: 'width 0.1s ease'
                        }}></div>

                        <input
                          type="range"
                          className="volume-slider"
                          min="0"
                          max="100"
                          value={mainState.volume ?? 100}
                          onChange={(e) => handleVolumeChange(mainEvent.id, Number(e.target.value))}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            transform: 'translateY(-50%)',
                            width: '100%',
                            height: '20px',
                            opacity: 0,
                            cursor: 'pointer',
                            margin: 0
                          }}
                        />

                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: `${mainState.volume}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '12px',
                          height: '12px',
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          border: '2px solid #03969c',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                          pointerEvents: 'none',
                          transition: 'all 0.1s ease'
                        }}></div>
                      </div>

                      <span style={{
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: '600',
                        minWidth: '38px',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums'
                      }}>{Math.round(mainState.volume)}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="control-btn"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '20px',
                      transition: 'transform 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                       onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="Emoji reactions"
                  >
                    <i className="bi bi-emoji-smile"></i>
                  </button>

                  <button
                    onClick={toggleRecording}
                    className="control-btn"
                    style={{
                      background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                      border: 'none',
                      color: isRecording ? '#ef4444' : '#fff',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '20px',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                       onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title={isRecording ? "Stop recording" : "Start recording"}
                  >
                    <i className={isRecording ? "bi bi-stop-circle-fill" : "bi bi-record-circle"}></i>
                  </button>

                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className="control-btn"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '20px',
                      transition: 'transform 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                       onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    title="View participants"
                  >
                    <i className="bi bi-people-fill"></i>
                  </button>

                  <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="control-btn settings-button"
                      style={{
                        background: showSettings ? 'rgba(3, 150, 156, 0.2)' : 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '20px',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title="Settings"
                    >
                      <i className="bi bi-gear-fill"></i>
                    </button>

                    {/* Settings Dropdown */}
                    {showSettings && !showReportIssues && (
                      <div className="settings-menu" style={{
                        position: 'absolute',
                        bottom: '60px',
                        right: '0',
                        backgroundColor: '#18181b',
                        borderRadius: '8px',
                        padding: '8px',
                        minWidth: '240px',
                        maxHeight: '400px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 100
                      }}>
                        {/* Quality Settings */}
                        <div style={{ padding: '8px' }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#adadb8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>Quality</div>
                          <div className="custom-scrollbar" style={{
                            maxHeight: '180px',
                            overflowY: 'auto',
                            marginRight: '-4px',
                            paddingRight: '4px'
                          }}>
                            {(['auto', 'source', '1080p', '720p', '480p', '360p'] as const).map((quality) => (
                              <button
                                key={quality}
                                onClick={() => handleQualityChange(quality)}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  backgroundColor: videoQuality === quality ? 'rgba(3, 150, 156, 0.2)' : 'transparent',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: videoQuality === quality ? '#03969c' : '#efeff1',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '2px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (videoQuality !== quality) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (videoQuality !== quality) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <span style={{ textTransform: 'capitalize' }}>{quality}</span>
                                {videoQuality === quality && (
                                  <i className="bi bi-check-lg" style={{ fontSize: '16px' }}></i>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{
                          height: '1px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          margin: '8px 0'
                        }}></div>

                        {/* Captions Settings */}
                        <div style={{ padding: '8px' }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#adadb8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>Captions</div>
                          <button
                            onClick={handleCaptionsToggle}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#efeff1',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span>{captionsEnabled ? 'On' : 'Off'}</span>
                            <div style={{
                              width: '36px',
                              height: '20px',
                              backgroundColor: captionsEnabled ? '#016a6e' : 'rgba(255, 255, 255, 0.2)',
                              borderRadius: '10px',
                              position: 'relative',
                              transition: 'all 0.2s'
                            }}>
                              <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: captionsEnabled ? '18px' : '2px',
                                transition: 'all 0.2s'
                              }}></div>
                            </div>
                          </button>
                        </div>

                        <div style={{
                          height: '1px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          margin: '8px 0'
                        }}></div>

                        {/* Report Issue */}
                        <div style={{ padding: '8px' }}>
                          <button
                            onClick={() => setShowReportIssues(true)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              color: '#ef4444',
                              fontSize: '14px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="bi bi-exclamation-triangle-fill"></i>
                              Report playback issue
                            </div>
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Report Issues Submenu */}
                    {showReportIssues && (
                      <div className="settings-menu" style={{
                        position: 'absolute',
                        bottom: '50px',
                        right: '0',
                        backgroundColor: '#18181b',
                        borderRadius: '8px',
                        padding: '8px',
                        minWidth: '240px',
                        maxHeight: '400px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 100
                      }}>
                        <div style={{
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <button
                            onClick={() => setShowReportIssues(false)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#adadb8',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '16px',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#efeff1'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#adadb8'}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#efeff1'
                          }}>Report Playback Issue</div>
                        </div>

                        <div style={{
                          height: '1px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          margin: '8px 0'
                        }}></div>

                        <div style={{ padding: '8px' }}>
                          {[
                            { icon: 'bi-skip-forward-fill', text: 'Buffering or lag', value: 'Buffering or lag' },
                            { icon: 'bi-file-play', text: 'Video not playing', value: 'Video not playing' },
                            { icon: 'bi-badge-hd', text: 'Poor video quality', value: 'Poor video quality' },
                            { icon: 'bi-volume-mute-fill', text: 'No audio', value: 'No audio' },
                            { icon: 'bi-soundwave', text: 'Audio/Video out of sync', value: 'Audio/Video out of sync' },
                            { icon: 'bi-pip', text: 'Video player issues', value: 'Video player issues' },
                            { icon: 'bi-wifi-off', text: 'Connection issues', value: 'Connection issues' },
                            { icon: 'bi-three-dots', text: 'Other issue', value: 'Other issue' }
                          ].map((issue, index) => (
                            <button
                              key={index}
                              onClick={() => handleReportIssue(issue.value)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#efeff1',
                                fontSize: '14px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '2px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className={`bi ${issue.icon}`} style={{ fontSize: '16px', color: '#ef4444' }}></i>
                              {issue.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="control-btn"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '20px',
                      transition: 'transform 0.2s'
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                       onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <i className={isFullscreen ? "bi bi-fullscreen-exit" : "bi bi-fullscreen"}></i>
                  </button>
                </div>
              </div>

              {/* Emoji Picker - Modern Style */}
              {showEmojiPicker && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="emoji-picker-bar"
                  style={{
                    position: 'absolute',
                    bottom: '90px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    borderRadius: '24px',
                    padding: '8px 16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                  }}>
                  {emojiList.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiReaction(item.emoji)}
                      className="emoji-button"
                      style={{
                        fontSize: '24px',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '40px',
                        height: '40px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.3)';
                        e.currentTarget.style.backgroundColor = 'rgba(3, 150, 156, 0.2)';
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
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    margin: '0 4px'
                  }}></div>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#adadb8',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      minWidth: '40px',
                      height: '40px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#efeff1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#adadb8';
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}

              {/* Participants Viewer */}
              {showParticipants && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="participants-modal"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '20px',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#18181b',
                    borderRadius: '8px',
                    padding: '20px',
                    width: '320px',
                    maxHeight: '500px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    zIndex: 25,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#efeff1',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="bi bi-people-fill" style={{ color: '#03969c' }}></i>
                      Viewers ({participants.length})
                    </h3>
                    <button
                      onClick={() => setShowParticipants(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#adadb8',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '4px',
                        transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#efeff1'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#adadb8'}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="custom-scrollbar" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
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
                          backgroundColor: '#2f2f35',
                          borderRadius: '4px',
                          gap: '12px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a42'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2f2f35'}
                      >
                        <img
                          src={participant.avatar || `https://ui-avatars.com/api/?name=${participant.name}&background=9333ea&color=fff`}
                          alt={participant.name}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(3, 150, 156, 0.3)'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#efeff1',
                            marginBottom: '4px'
                          }}>
                            {participant.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: participant.status === 'active' ? '#10b981' : '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span style={{
                              width: '6px',
                              height: '6px',
                              backgroundColor: participant.status === 'active' ? '#10b981' : '#6b7280',
                              borderRadius: '50%',
                              display: 'inline-block'
                            }}></span>
                            {participant.status === 'active' ? 'Watching' : 'Idle'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info Section (includes mini-players) */}
            <div className="stream-info-section" style={{
              backgroundColor: '#18181b',
              padding: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              overflowY: isSwapping ? 'visible' : 'auto',
              overflow: isSwapping ? 'visible' : undefined,
              flex: 1,
              position: 'relative'
            }}>
              {/* Mini Players Container */}
              {events.length > 1 && (
                <div className="mini-players-container" style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '20px',
                  overflowX: isSwapping ? 'visible' : 'auto',
                  overflow: isSwapping ? 'visible' : undefined,
                  paddingBottom: '12px',
                  position: 'relative'
                }}>
                  {events.map((event, idx) => {
                    if (idx === mainEventIndex) return null;
                    const miniState = playbackState[event.id] || { isPlaying: false, isMuted: true, progress: 0, volume: 0 };

                    return (
                      <div
                        key={event.id}
                        onClick={() => !isSwapping && switchToMainEvent(idx)}
                        className={isSwapping && swappingToIndex === idx ? 'swapping-mini-to-main' : ''}
                        style={{
                          flex: '0 0 auto',
                          width: '300px',
                          height: '170px',
                          backgroundColor: '#000',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: isSwapping ? 'default' : 'pointer',
                          border: '2px solid rgba(3, 150, 156, 0.3)',
                          transition: isSwapping ? 'none' : 'all 0.3s',
                          position: 'relative',
                          pointerEvents: isSwapping ? 'none' : 'auto',
                          zIndex: isSwapping && swappingToIndex === idx ? 1000 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!isSwapping) {
                            e.currentTarget.style.border = '2px solid rgba(3, 150, 156, 0.8)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSwapping) {
                            e.currentTarget.style.border = '2px solid rgba(3, 150, 156, 0.3)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%'
                        }}>
                          <video
                            key={event.id}
                            ref={(el) => {
                              if (el) {
                                videoRefs.current[event.id] = el;
                              } else {
                                // Clean up ref when element is unmounted
                                delete videoRefs.current[event.id];
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            muted={true}
                            loop
                          >
                            <source src={event.videoSrc} type="video/mp4" />
                          </video>

                          {/* Overlay */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '8px'
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#fff',
                              marginBottom: '2px',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}>{event.photographer}</div>
                            <div style={{
                              fontSize: '10px',
                              color: '#adadb8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <i className="bi bi-eye-fill"></i>
                              {event.viewers.toLocaleString()}
                            </div>
                          </div>

                          {/* Live Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            backgroundColor: '#eb0400',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            LIVE
                          </div>

                          {/* Muted indicator */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            padding: '4px 6px',
                            borderRadius: '3px',
                            fontSize: '12px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <i className="bi bi-volume-mute-fill"></i>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Photographer Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <img
                  src="https://i.pravatar.cc/150?img=68"
                  alt="Photographer"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #03969c'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <h3 className="photographer-name" style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#efeff1',
                    margin: 0,
                    marginBottom: '4px'
                  }}>{mainEvent.photographer}</h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#adadb8',
                    margin: 0
                  }}>{mainEvent.category}</p>
                </div>
                <button
                  onClick={() => setShowRatingModal(true)}
                  style={{
                    backgroundColor: '#03969c',
                    color: '#fff',
                    fontWeight: '600',
                    padding: '8px 24px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#027f83'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#03969c'}
                >
                  <i className="bi bi-star-fill"></i>
                  Rate this Live
                </button>

                {/* Add Event Button */}
                {events.length < 3 && (
                  <button
                    onClick={() => setShowAddEventModal(true)}
                    style={{
                      backgroundColor: '#1890ff',
                      color: '#fff',
                      fontWeight: '600',
                      padding: '8px 24px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1570d3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Add Event
                  </button>
                )}

                {/* Leave Stream Button */}
                <button
                  style={{
                    backgroundColor: '#e61220',
                    color: '#fff',
                    fontWeight: '600',
                    padding: '8px 20px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e61220'}
                  onClick={handleLeaveStream}
                >
                  Leave Stream
                </button>
              </div>

              {/* Stream Title */}
              <h2 className="stream-title" style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#efeff1',
                margin: '0 0 12px 0',
                lineHeight: '1.4'
              }}>{mainEvent.title}</h2>

              {/* Stats Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div className="stat-item" style={{
                  fontSize: '13px',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-clock"></i>
                  {mainEvent.startTime}
                </div>
                <div className="stat-item" style={{
                  fontSize: '13px',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-calendar3"></i>
                  {currentTime}
                </div>
                <div className="stat-item" style={{
                  fontSize: '13px',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>Stream ID:</span>
                  <span style={{ color: '#efeff1', fontWeight: '600' }}>{mainEvent.streamId}</span>
                  <button
                    style={{
                      color: isCopied ? '#03969c' : '#adadb8',
                      padding: '2px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px',
                      transition: 'color 0.2s'
                    }}
                    title={isCopied ? 'Copied!' : 'Copy stream ID'}
                    onClick={handleCopyStreamId}
                    onMouseEnter={(e) => {
                      if (!isCopied) e.currentTarget.style.color = '#efeff1';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCopied) e.currentTarget.style.color = '#adadb8';
                    }}
                  >
                    <i className={isCopied ? "bi bi-clipboard-check-fill" : "bi bi-clipboard"}></i>
                  </button>
                  {isCopied && (
                    <span style={{
                      color: '#03969c',
                      fontSize: '12px',
                      fontWeight: '600',
                      animation: 'slideIn 0.3s ease-out'
                    }}>
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Live Chat */}
          <div className="chat-section" style={{
            width: '340px',
            backgroundColor: '#1f1f23',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Chat Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#18181b'
            }}>
              <h3 style={{
                fontWeight: '600',
                color: '#efeff1',
                fontSize: '14px',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-chat-dots-fill"></i>
                Live Chat
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: 'rgba(3, 150, 156, 0.2)',
                  color: '#03969c',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>{mainEvent.messages.length}</span>
              </h3>
            </div>

            {/* Messages List */}
            <div className="custom-scrollbar" style={{
              flex: 1,
              padding: '12px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {mainEvent.messages.map((message) => (
                <div key={message.id} style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s',
                  animation: 'slideIn 0.3s ease-out',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <img
                    src={message.avatar}
                    alt={message.sender}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#efeff1'
                      }}>{message.sender}</span>
                      <span style={{
                        fontSize: '11px',
                        color: '#adadb8'
                      }}>{message.time}</span>
                    </div>
                    {editingMessageId === message.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEditedMessage(message.id);
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                              setEditingMessageText("");
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(3, 150, 156, 0.5)',
                            borderRadius: '4px',
                            color: '#efeff1',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditedMessage(message.id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#03969c',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditingMessageText("");
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#efeff1',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {message.videoUrl ? (
                          <div style={{ marginTop: '4px' }}>
                            <video
                              src={message.videoUrl}
                              controls
                              style={{
                                width: '100%',
                                maxWidth: '250px',
                                borderRadius: '8px',
                                backgroundColor: '#000'
                              }}
                            />
                            <p style={{
                              fontSize: '12px',
                              color: '#03969c',
                              marginTop: '4px',
                              fontStyle: 'italic'
                            }}>
                              Video Message
                            </p>
                          </div>
                        ) : (
                          <p style={{
                            fontSize: '13px',
                            color: '#adadb8',
                            lineHeight: '1.5',
                            margin: 0,
                            wordWrap: 'break-word'
                          }}>
                            {message.text}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Three-dot menu button */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMessageMenu(openMessageMenu === message.id ? null : message.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#adadb8',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = '#efeff1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#adadb8';
                      }}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>

                    {/* Dropdown menu */}
                    {openMessageMenu === message.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: '#1f1f23',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
                          minWidth: '150px',
                          zIndex: 1000,
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {message.sender === "You" ? (
                          <>
                            <button
                              onClick={() => handleEditMessage(message.id, message.text)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#efeff1',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(3, 150, 156, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-pencil"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-trash"></i>
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleReplyToMessage(message.id, message.sender, message.text)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#efeff1',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(3, 150, 156, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-reply-fill"></i>
                              Reply
                            </button>
                            <button
                              onClick={() => handleBlockUser(message.sender)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '13px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <i className="bi bi-slash-circle"></i>
                              Block User
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#18181b'
            }}>
              {/* Reply Preview */}
              {replyingTo && (
                <div style={{
                  backgroundColor: 'rgba(3, 150, 156, 0.1)',
                  border: '1px solid rgba(3, 150, 156, 0.3)',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#03969c',
                      fontWeight: '600',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="bi bi-reply-fill"></i>
                      Replying to {replyingTo.sender}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#adadb8',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {replyingTo.text}
                    </div>
                  </div>
                  <button
                    onClick={handleCancelReply}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#adadb8',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#efeff1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#adadb8';
                    }}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#2f2f35',
                borderRadius: '4px',
                padding: '8px 12px',
                gap: '8px'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={replyingTo ? `Reply to @${replyingTo.sender}...` : "Send a message..."}
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: '#efeff1'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  style={{
                    color: newMessage.trim() ? '#03969c' : '#adadb8',
                    background: 'transparent',
                    border: 'none',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '18px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim()) e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  disabled={!newMessage.trim()}
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>

              {/* Send Video Message Button */}
              <button
                onClick={() => setShowVideoMessageRecorder(true)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#e61220',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#eb0918';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 15, 10, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e61220';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <i className="bi bi-camera-video-fill" style={{ fontSize: '16px' }}></i>
                Send 1 Min Video Message
              </button>

              <p style={{
                fontSize: '11px',
                color: '#adadb8',
                margin: '8px 0 0 0',
                textAlign: 'center'
              }}>
                Chat with other viewers watching the stream
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setShowAddEventModal(false)}>
          <div className="modal-content" style={{
            backgroundColor: '#18181b',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#efeff1',
              marginBottom: '8px',
              marginTop: 0
            }}>Add Another Event</h2>
            <p style={{
              fontSize: '13px',
              color: '#adadb8',
              marginBottom: '24px'
            }}>Enter the event ID or host ID to join another live stream (maximum 3 events).</p>
            <input
              type="text"
              value={newEventId}
              onChange={(e) => setNewEventId(e.target.value)}
              placeholder="Enter Event Link or Host ID"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '24px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#2f2f35',
                color: '#efeff1'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
            />
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAddEventModal(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: '#efeff1',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEventId.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: newEventId.trim() ? '#1890ff' : '#4b5563',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newEventId.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (newEventId.trim()) e.currentTarget.style.backgroundColor = '#1570d3';
                }}
                onMouseLeave={(e) => {
                  if (newEventId.trim()) e.currentTarget.style.backgroundColor = '#1890ff';
                }}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => {
          setShowRatingModal(false);
          setRating(0);
          setRatingComment('');
        }}>
          <div style={{
            backgroundColor: '#18181b',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => {
                setShowRatingModal(false);
                setRating(0);
                setRatingComment('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#adadb8',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#efeff1'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#adadb8'}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Title */}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#efeff1',
              marginBottom: '8px',
              marginTop: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <i className="bi bi-star-fill" style={{ color: '#03969c', fontSize: '28px' }}></i>
              Rate this Live Stream
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#adadb8',
              marginBottom: '24px'
            }}>Share your experience with {mainEvent.photographer}</p>

            {/* Star Rating */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '32px'
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '48px',
                    color: (hoverRating || rating) >= star ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s',
                    transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)'}
                >
                  <i className={(hoverRating || rating) >= star ? "bi bi-star-fill" : "bi bi-star"}></i>
                </button>
              ))}
            </div>

            {/* Rating text */}
            {rating > 0 && (
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fbbf24'
              }}>
                {rating === 1 && '⭐ Poor'}
                {rating === 2 && '⭐⭐ Fair'}
                {rating === 3 && '⭐⭐⭐ Good'}
                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
              </div>
            )}

            {/* Comment Section */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#efeff1',
                marginBottom: '8px',
                display: 'block'
              }}>
                Add a comment (optional)
              </label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your thoughts about this live stream..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#2f2f35',
                  color: '#efeff1',
                  minHeight: '100px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#adadb8',
                marginTop: '8px',
                textAlign: 'right'
              }}>
                {ratingComment.length}/500
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setRatingComment('');
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: '#efeff1',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                style={{
                  padding: '12px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: rating === 0 ? '#4b5563' : '#03969c',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: rating === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (rating > 0) e.currentTarget.style.backgroundColor = '#027f83';
                }}
                onMouseLeave={(e) => {
                  if (rating > 0) e.currentTarget.style.backgroundColor = '#03969c';
                }}
                disabled={rating === 0}
              >
                <i className="bi bi-send-fill"></i>
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Message Recorder */}
      {showVideoMessageRecorder && (
        <VideoMessageRecorder
          onClose={() => setShowVideoMessageRecorder(false)}
          onSend={handleSendVideoMessage}
        />
      )}
    </>
  );
};

export default App;
