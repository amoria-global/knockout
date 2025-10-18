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
  const [maxTime] = useState(60); // Changed to 60 seconds (1 minute)
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [videoId] = useState('vwx-jcwv-sfg');
  const [currentTime, setCurrentTime] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(VIDEO_FILTERS[0]);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);

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

      mediaRecorder.onstop = () => {
        // Create blob from recorded chunks
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        console.log('Recording saved, size:', blob.size);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordedTime(0);
      setRecordedBlob(null); // Clear previous recording
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Unable to start recording. Please check your camera and microphone permissions.');
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
    if (recordedBlob || recordedTime > 0) {
      if (confirm('Are you sure you want to delete this recording?')) {
        // Stop recording if currently recording
        if (isRecording) {
          stopRecording();
        }

        // Clear all recording data
        setRecordedTime(0);
        setRecordedBlob(null);
        chunksRef.current = [];
        setIsPlayingBack(false);

        // Restart camera stream if needed
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }

        alert('Recording deleted successfully!');
      }
    } else {
      alert('No recording to delete.');
    }
  };

  const handlePlayback = () => {
    if (recordedBlob && videoRef.current) {
      // Switch to playback mode
      const url = URL.createObjectURL(recordedBlob);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.controls = true;
      videoRef.current.muted = false;
      videoRef.current.play();
      setIsPlayingBack(true);
    } else {
      alert('No recording available to preview!');
    }
  };

  const handleBackToCamera = () => {
    if (videoRef.current && streamRef.current) {
      // Return to live camera view
      videoRef.current.src = '';
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.controls = false;
      videoRef.current.muted = true;
      setIsPlayingBack(false);
    }
  };

  const handleSubmitVideo = () => {
    if (!recordedBlob) {
      alert('Please record a video first!');
      return;
    }

    if (recordedTime < 5) {
      alert('Your video is too short. Please record at least 5 seconds.');
      return;
    }

    // For now, just log and show success
    // Later this will upload to your backend API
    console.log('Submitting video...');
    console.log('Video size:', recordedBlob.size);
    console.log('Video duration:', recordedTime, 'seconds');
    console.log('Event ID:', videoId);

    alert(`Thank you for sharing your memory! Your ${recordedTime}-second video has been recorded successfully. (Backend integration pending)`);
  };

  const handleAddFilter = () => {
    setShowFilters(!showFilters);
  };

  const applyFilter = (filter: typeof VIDEO_FILTERS[0]) => {
    setSelectedFilter(filter);
    const index = VIDEO_FILTERS.findIndex(f => f.id === filter.id);
    setCurrentFilterIndex(index);
  };

  const nextFilter = () => {
    const nextIndex = (currentFilterIndex + 1) % VIDEO_FILTERS.length;
    setCurrentFilterIndex(nextIndex);
    setSelectedFilter(VIDEO_FILTERS[nextIndex]);
  };

  const prevFilter = () => {
    const prevIndex = (currentFilterIndex - 1 + VIDEO_FILTERS.length) % VIDEO_FILTERS.length;
    setCurrentFilterIndex(prevIndex);
    setSelectedFilter(VIDEO_FILTERS[prevIndex]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        background: 'linear-gradient(180deg, #5E799F 0%, #083A85 47%, #335992 100%)',
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

          {/* Control Buttons Overlay - Hidden during playback */}
          {!isPlayingBack && (
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
          )}
        </div>

        {/* Bottom Action Bar */}
        <div style={{
          backgroundColor: 'transparent',
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
            {/* Filter Controls - Inline when showing */}
            {!isPlayingBack && showFilters && (
              <>
                <button
                  onClick={prevFilter}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '6px',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  title="Previous filter"
                >
                  ←
                </button>

                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    fontSize: '24px',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }}>
                    {selectedFilter.icon}
                  </div>
                </div>

                <button
                  onClick={nextFilter}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '6px',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  title="Next filter"
                >
                  →
                </button>

                <div style={{
                  padding: '10px 16px',
                  height: '44px',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedFilter.name}
                  </span>
                </div>
              </>
            )}

            {!isPlayingBack && (
              <button
                onClick={handleAddFilter}
                style={{
                  padding: '10px 20px',
                  height: '44px',
                  backgroundColor: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showFilters ? 'Close' : 'Add Filter'}
              </button>
            )}

            {/* Preview Button - Shows when recording exists and not currently playing back */}
            {recordedBlob && !isPlayingBack && (
              <button
                onClick={handlePlayback}
                style={{
                  padding: '10px 20px',
                  height: '44px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Preview your recording"
              >
                Preview
              </button>
            )}

            {/* Back to Camera Button - Shows when in playback mode */}
            {isPlayingBack && (
              <button
                onClick={handleBackToCamera}
                style={{
                  padding: '10px 20px',
                  height: '44px',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Return to camera view"
              >
                Back to Camera
              </button>
            )}

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
                height: '44px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: '2px solid #1e40af',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Submit Video
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        /* Hide scrollbar for filter panel */
        .filter-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
