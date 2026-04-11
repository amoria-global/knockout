'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VideoMessageRecorderProps {
  onClose: () => void;
  onSend: (videoBlob: Blob) => void;
}

// CSS-only filters (like record.tsx)
interface VideoFilter {
  id: string;
  name: string;
  filter: string;
  icon: string;
}

const VIDEO_FILTERS: VideoFilter[] = [
  { id: 'none', name: 'Original', filter: 'none', icon: '✨' },
  { id: 'vivid', name: 'Vivid', filter: 'saturate(1.5) contrast(1.2)', icon: '🌈' },
  { id: 'dramatic', name: 'Dramatic', filter: 'contrast(1.5) saturate(1.3)', icon: '🎭' },
  { id: 'mono', name: 'Mono', filter: 'grayscale(1)', icon: '⚫' },
  { id: 'silvertone', name: 'Silvertone', filter: 'grayscale(1) contrast(1.2)', icon: '⚪' },
  { id: 'noir', name: 'Noir', filter: 'grayscale(1) contrast(1.5) brightness(0.9)', icon: '🎬' },
  { id: 'warm', name: 'Warm', filter: 'sepia(0.3) saturate(1.3)', icon: '☀️' },
  { id: 'cool', name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)', icon: '❄️' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(0.5) contrast(1.1) brightness(0.9)', icon: '📷' },
  { id: 'fade', name: 'Fade', filter: 'contrast(0.85) brightness(1.2) saturate(0.8)', icon: '🌫️' },
  { id: 'brighten', name: 'Brighten', filter: 'brightness(1.3) contrast(1.1)', icon: '💡' },
  { id: 'sunset', name: 'Sunset', filter: 'sepia(0.4) saturate(1.4) hue-rotate(-20deg)', icon: '🌅' },
  { id: 'ocean', name: 'Ocean', filter: 'hue-rotate(180deg) saturate(1.5) brightness(1.1)', icon: '🌊' },
  { id: 'neon', name: 'Neon', filter: 'saturate(2) brightness(1.3) contrast(1.2)', icon: '💜' },
  { id: 'retro', name: 'Retro', filter: 'sepia(0.6) hue-rotate(10deg) saturate(1.2)', icon: '📼' },
  { id: 'dreamy', name: 'Dreamy', filter: 'brightness(1.15) blur(0.5px) saturate(1.3)', icon: '✨' },
  { id: 'sharp', name: 'Sharp', filter: 'contrast(1.3) saturate(1.1)', icon: '🔪' },
  { id: 'soft', name: 'Soft', filter: 'brightness(1.1) contrast(0.9) saturate(0.9)', icon: '🌸' },
  { id: 'poppy', name: 'Poppy', filter: 'saturate(1.8) contrast(1.3)', icon: '🎨' },
  { id: 'muted', name: 'Muted', filter: 'saturate(0.6) brightness(1.1)', icon: '🔇' },
  { id: 'golden', name: 'Golden', filter: 'sepia(0.3) saturate(1.5) brightness(1.1)', icon: '✨' },
  { id: 'rose', name: 'Rose', filter: 'sepia(0.2) hue-rotate(-10deg) saturate(1.4)', icon: '🌹' },
  { id: 'arctic', name: 'Arctic', filter: 'brightness(1.2) saturate(0.7) hue-rotate(180deg)', icon: '🧊' },
  { id: 'fire', name: 'Fire', filter: 'saturate(1.6) hue-rotate(-20deg) brightness(1.2)', icon: '🔥' },
  { id: 'forest', name: 'Forest', filter: 'hue-rotate(60deg) saturate(1.3)', icon: '🌲' },
  { id: 'lavender', name: 'Lavender', filter: 'hue-rotate(250deg) saturate(1.2) brightness(1.1)', icon: '💜' },
];

const VideoMessageRecorder: React.FC<VideoMessageRecorderProps> = ({ onClose, onSend }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter>(VIDEO_FILTERS[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const MAX_DURATION = 60; // 60 seconds = 1 minute

  // Initialize camera (based on record.tsx but with better quality)
  const initializeCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: 1920,
          height: 1080
        },
        audio: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing camera:', err);
      setError('Failed to access camera. Please check permissions.');
      setIsLoading(false);
    }
  }, [facingMode]);

  // Start recording (EXACT copy from record.tsx - no options for maximum compatibility)
  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      // Use default MediaRecorder settings - let browser decide best format
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create blob from recorded chunks
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  // Stop recording (like record.tsx)
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Toggle pause/resume
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Start countdown before recording
  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          startRecording();
          return null;
        }
        return prev! - 1;
      });
    }, 1000);
  };

  // Handle send
  const handleSend = () => {
    if (recordedBlob) {
      onSend(recordedBlob);
      cleanup();
      onClose();
    }
  };

  // Cleanup
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // Recording timer
  useEffect(() => {
    if (!isRecording || isPaused) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= MAX_DURATION) {
          stopRecording();
          return MAX_DURATION;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();
    return cleanup;
  }, [initializeCamera]);

  // Switch to preview when recorded blob is ready (EXACT copy from record.tsx)
  useEffect(() => {
    if (recordedBlob && videoRef.current) {
      // Switch to playback mode (exact method from record.tsx)
      const url = URL.createObjectURL(recordedBlob);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
      videoRef.current.play();
    }
  }, [recordedBlob]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (recordingTime / MAX_DURATION) * 100;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#000',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes countdownPulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        /* Hide scrollbar for filter container */
        .filter-scroll::-webkit-scrollbar {
          display: none;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .video-recorder-header {
            padding: 10px 14px !important;
          }

          .video-recorder-header h2 {
            font-size: 15px !important;
          }

          .control-buttons {
            gap: 6px !important;
            padding: 12px 10px !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
          }

          .control-button {
            padding: 7px 14px !important;
            font-size: 12px !important;
            min-width: auto !important;
            flex: 1 1 auto !important;
            min-width: calc(50% - 3px) !important;
            min-height: 36px !important;
          }

          .filter-panel {
            width: 160px !important;
            padding: 12px 8px !important;
          }

          .filter-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }

          .filter-button {
            width: 45px !important;
            height: 45px !important;
            min-width: 45px !important;
            min-height: 45px !important;
            font-size: 18px !important;
          }

          .filter-label {
            font-size: 8px !important;
          }
        }

        @media (max-width: 480px) {
          .video-recorder-header {
            padding: 8px 10px !important;
          }

          .video-recorder-header h2 {
            font-size: 13px !important;
          }

          .control-buttons {
            gap: 4px !important;
            padding: 8px 6px !important;
            flex-direction: column !important;
          }

          .control-button {
            padding: 6px 12px !important;
            font-size: 11px !important;
            width: 100% !important;
            min-width: 100% !important;
            flex: none !important;
            min-height: 36px !important;
          }

          .filter-panel {
            width: 140px !important;
            padding: 10px 6px !important;
            top: 70px !important;
            bottom: 70px !important;
          }

          .filter-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }

          .filter-button {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
          }

          .filter-label {
            font-size: 7px !important;
          }

          .timer-display {
            font-size: 14px !important;
            padding: 6px 12px !important;
          }

          .recording-indicator {
            font-size: 12px !important;
            padding: 6px 10px !important;
          }
        }

        @media (max-width: 360px) {
          .control-buttons {
            gap: 3px !important;
            padding: 6px 4px !important;
          }

          .control-button {
            padding: 5px 10px !important;
            font-size: 10px !important;
            min-height: 34px !important;
          }

          .filter-panel {
            width: 120px !important;
          }

          .filter-grid {
            gap: 6px !important;
          }

          .filter-button {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            font-size: 14px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="video-recorder-header" style={{
        padding: '16px 20px',
        backgroundColor: '#18181b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 className="video-recorder-header" style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#fff'
        }}>
          Record Video Message
        </h2>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#e32733',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      {/* Video Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
        overflow: 'hidden',
        minHeight: 0
      }}>
        {/* Loading Spinner */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#e32733',
            fontSize: '16px'
          }}>
            <i className="bi bi-hourglass-split" style={{ fontSize: '32px', animation: 'pulse 1.5s infinite' }}></i>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            color: '#ef4444',
            fontSize: '14px',
            padding: '20px',
            textAlign: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-exclamation-triangle" style={{ fontSize: '48px' }}></i>
            <p>{error}</p>
          </div>
        )}

        {/* Video Element with CSS Filter */}
        <video
          ref={videoRef}
          autoPlay
          muted={!recordedBlob}
          playsInline
          controls={!!recordedBlob}
          loop={!!recordedBlob}
          preload="metadata"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // Changed from 'cover' to prevent zoom
            filter: selectedFilter.filter, // Apply filter always (like record.tsx)
            transform: facingMode === 'user' && !recordedBlob ? 'scaleX(-1)' : 'none'
          }}
        />

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            fontSize: '120px',
            fontWeight: '700',
            color: '#fff',
            animation: 'countdownPulse 1s ease-in-out'
          }}>
            {countdown}
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && !isPaused && (
          <div className="recording-indicator" style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            padding: '8px 12px',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#fff',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }}></div>
            REC
          </div>
        )}

        {/* Timer and Progress Bar */}
        {isRecording && (
          <>
            <div className="timer-display" style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '8px 16px',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'monospace'
            }}>
              {formatTime(recordingTime)} / {formatTime(MAX_DURATION)}
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                height: '100%',
                width: `${progressPercentage}%`,
                backgroundColor: progressPercentage > 90 ? '#ef4444' : '#e32733',
                transition: 'width 0.3s, background-color 0.3s'
              }}></div>
            </div>
          </>
        )}
      </div>

      {/* Filter Selection - Vertical Sidebar on Left (3 columns grid) */}
      {showFilters && !recordedBlob && (
        <div className="filter-panel" style={{
          position: 'absolute',
          left: 0,
          top: '80px',
          bottom: '80px',
          width: '240px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          padding: '16px 12px',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          zIndex: 100,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          <div className="filter-scroll filter-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {VIDEO_FILTERS.map((filter) => (
              <div
                key={filter.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <button
                  className="filter-button"
                  onClick={() => setSelectedFilter(filter)}
                  title={filter.name}
                  style={{
                    width: '50px',
                    height: '50px',
                    minWidth: '50px',
                    minHeight: '50px',
                    borderRadius: '50%',
                    border: selectedFilter.id === filter.id ? '3px solid #e32733' : '3px solid rgba(255, 255, 255, 0.3)',
                    background: selectedFilter.id === filter.id
                      ? 'linear-gradient(135deg, rgba(227, 39, 51, 0.3), rgba(227, 39, 51, 0.6))'
                      : 'rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: selectedFilter.id === filter.id
                      ? '0 0 20px rgba(227, 39, 51, 0.5)'
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFilter.id !== filter.id) {
                      e.currentTarget.style.borderColor = 'rgba(227, 39, 51, 0.6)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFilter.id !== filter.id) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {filter.icon}
                </button>
                <span className="filter-label" style={{
                  fontSize: '9px',
                  color: selectedFilter.id === filter.id ? '#e32733' : 'rgba(255, 255, 255, 0.7)',
                  fontWeight: selectedFilter.id === filter.id ? '600' : '400',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s',
                  maxWidth: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {filter.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      {!recordedBlob && !isRecording && (
        <div className="control-buttons" style={{
          padding: '24px 20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          backgroundColor: '#18181b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            className="control-button"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '5px 22px',
              backgroundColor: showFilters ? 'rgba(227, 39, 51, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              border: showFilters ? '2px solid rgba(227, 39, 51, 0.6)' : '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-funnel"></i>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <button
            className="control-button"
            onClick={startCountdown}
            disabled={countdown !== null}
            style={{
              padding: '5px 22px',
              backgroundColor: '#e32733',
              border: 'none',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '700',
              cursor: countdown !== null ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 16px rgba(227, 39, 51, 0.4)',
              opacity: countdown !== null ? 0.5 : 1
            }}
          >
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#fff',
              borderRadius: '50%'
            }}></div>
            Start Recording
          </button>

          <button
            className="control-button"
            onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
            style={{
              padding: '5px 22px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-arrow-repeat"></i>
            Flip
          </button>
        </div>
      )}

      {/* Recording Controls */}
      {isRecording && (
        <div className="control-buttons" style={{
          padding: '24px 20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          backgroundColor: '#18181b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            className="control-button"
            onClick={togglePause}
            style={{
              padding: '5px 22px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className={`bi bi-${isPaused ? 'play' : 'pause'}-fill`}></i>
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            className="control-button"
            onClick={stopRecording}
            style={{
              padding: '5px 22px',
              backgroundColor: '#e32733',
              border: 'none',
              borderRadius: '30px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className="bi bi-stop-fill"></i>
            Stop
          </button>
        </div>
      )}

      {/* Preview Controls */}
      {recordedBlob && (
        <div style={{
          padding: '24px 20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          backgroundColor: '#18181b',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this recording?')) {
                  // Clear all recording data (matching record.tsx)
                  setRecordedBlob(null);
                  setRecordingTime(0);
                  chunksRef.current = [];

                  // Restart camera stream (matching record.tsx)
                  if (videoRef.current && streamRef.current) {
                    videoRef.current.src = '';
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.muted = true;
                  }
                }
              }}
              style={{
                padding: '5px 22px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '30px',
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
            >
              <i className="bi bi-trash-fill"></i>
              Delete
            </button>

            <button
                onClick={handleSend}
                style={{
                  padding: '5px 22px',
                  backgroundColor: '#e32733',
                  border: 'none',
                  borderRadius: '30px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 16px rgba(227, 39, 51, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c71f2b';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e32733';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <i className="bi bi-send-fill"></i>
                Send Video
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoMessageRecorder;
