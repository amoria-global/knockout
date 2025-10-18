'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaCog, FaExpand, FaCopy, FaTrash, FaTimes } from 'react-icons/fa';

// iPhone-style CSS filters
const VIDEO_FILTERS = [
  { id: 1, name: 'Original', filter: 'none', icon: '✨' },
  { id: 2, name: 'Vivid', filter: 'saturate(1.5) contrast(1.2)', icon: '🌈' },
  { id: 3, name: 'Dramatic', filter: 'contrast(1.5) saturate(1.3)', icon: '🎭' },
  { id: 4, name: 'Mono', filter: 'grayscale(1)', icon: '⚫' },
  { id: 5, name: 'Silvertone', filter: 'grayscale(1) contrast(1.2)', icon: '⚪' },
  { id: 6, name: 'Noir', filter: 'grayscale(1) contrast(1.5) brightness(0.9)', icon: '🎬' },
  { id: 7, name: 'Warm', filter: 'sepia(0.3) saturate(1.3)', icon: '☀️' },
  { id: 8, name: 'Cool', filter: 'hue-rotate(180deg) saturate(1.2)', icon: '❄️' },
  { id: 9, name: 'Vintage', filter: 'sepia(0.5) contrast(1.1) brightness(0.9)', icon: '📷' }
];

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [maxTime] = useState(90);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [videoId] = useState('vwx-jcwv-sfg');
  const [currentTime, setCurrentTime] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(VIDEO_FILTERS[0]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: isMicEnabled
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Unable to access camera. Please allow camera permissions.');
      }
    }

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update audio track when mic is toggled
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMicEnabled;
      });
    }
  }, [isMicEnabled]);

  // Timer for recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => {
          if (prev >= maxTime) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused, maxTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordedTime(0);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const copyVideoId = () => {
    navigator.clipboard.writeText(videoId);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this recording?')) {
      setRecordedTime(0);
      chunksRef.current = [];
    }
  };

  const handleSubmitVideo = () => {
    console.log('Submitting video...');
    alert('Video submitted successfully!');
  };

  const handleAddFilter = () => {
    setShowFilters(!showFilters);
  };

  const applyFilter = (filter: typeof VIDEO_FILTERS[0]) => {
    setSelectedFilter(filter);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#5a6f9e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#4a5f8f',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        border: '3px solid #6b82b8'
      }}>
        {/* Video Preview Area */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          paddingTop: '56.25%',
          borderRadius: '8px 8px 0 0',
          margin: '12px 12px 0 12px'
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px 8px 0 0',
              filter: selectedFilter.filter
            }}
          />

          {/* Timer Display */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '6px 16px',
            borderRadius: '4px',
            zIndex: 10
          }}>
            <span style={{
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {formatTime(recordedTime)}/{formatTime(maxTime)}
            </span>
          </div>

          {/* Current Filter Badge */}
          {selectedFilter.id !== 1 && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: '6px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10
            }}>
              <span style={{ fontSize: '18px' }}>
                {selectedFilter.icon}
              </span>
              <span style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {selectedFilter.name}
              </span>
            </div>
          )}

          {/* Control Buttons Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: 10
          }}>
            {/* Microphone Toggle */}
            <button
              onClick={toggleMic}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isMicEnabled ? 'rgba(255, 255, 255, 0.2)' : '#ef4444',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicEnabled ? (
                <FaMicrophone size={20} />
              ) : (
                <FaMicrophoneSlash size={20} />
              )}
            </button>

            {/* Record Button (Center) */}
            <button
              onClick={toggleRecording}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                animation: isRecording ? 'pulse 2s infinite' : 'none',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
              }}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <div style={{
                width: '28px',
                height: '28px',
                backgroundColor: '#fff',
                borderRadius: isRecording ? '4px' : '50%',
                transition: 'all 0.2s'
              }} />
            </button>

            {/* Settings and Fullscreen */}
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => console.log('Settings clicked')}
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                title="Settings"
              >
                <FaCog size={20} />
              </button>

              <button
                onClick={toggleFullscreen}
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)'
                }}
                title="Fullscreen"
              >
                <FaExpand size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div style={{
          backgroundColor: '#4a5f8f',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Left Side - Time and Video ID */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '8px 14px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                color: '#000',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {currentTime}
              </span>
              <span style={{
                color: '#000',
                fontFamily: 'monospace',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {videoId}
              </span>
              <button
                onClick={copyVideoId}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title="Copy video ID"
              >
                <FaCopy size={16} />
              </button>
            </div>
          </div>

          {/* Right Side - Action Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <button
              onClick={handleAddFilter}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Add Filter
            </button>

            <button
              onClick={handleDelete}
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Delete video"
            >
              <FaTrash size={18} />
            </button>

            <button
              onClick={handleSubmitVideo}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: '2px solid #1e40af',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Submit Video
            </button>
          </div>
        </div>
      </div>

      {/* Filter Selection Panel - Horizontal Emoji Bar Style */}
      {showFilters && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '700px'
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '50px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            overflowY: 'hidden',
            position: 'relative'
          }}>
            {/* Filter Items */}
            {VIDEO_FILTERS.map((filter) => (
              <div
                key={filter.id}
                onClick={() => applyFilter(filter)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  minWidth: '60px',
                  padding: '8px',
                  borderRadius: '16px',
                  backgroundColor: selectedFilter.id === filter.id ? '#e0f2fe' : 'transparent',
                  transition: 'all 0.2s',
                  border: selectedFilter.id === filter.id ? '2px solid #2563eb' : '2px solid transparent'
                }}
              >
                {/* Filter Icon */}
                <div style={{
                  fontSize: '32px',
                  marginBottom: '4px'
                }}>
                  {filter.icon}
                </div>
                {/* Filter Name */}
                <p style={{
                  margin: 0,
                  fontSize: '9px',
                  fontWeight: '600',
                  color: selectedFilter.id === filter.id ? '#2563eb' : '#666',
                  whiteSpace: 'nowrap'
                }}>
                  {filter.name}
                </p>
              </div>
            ))}

            {/* Close Button */}
            <button
              onClick={() => setShowFilters(false)}
              style={{
                minWidth: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f3f4f6',
                color: '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '8px',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
              title="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
