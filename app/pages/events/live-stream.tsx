"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getCurrencies, type Currency as APICurrency } from '@/lib/APIs/public';
import { recordTip, recordStreamingPayment } from '@/lib/APIs/payments/route';
import { getEventDetails } from '@/lib/APIs/events/get-event-details/route';
import { getStreamChats, sendStreamChat, type StreamChatMessage } from '@/lib/APIs/streams/chat/route';
import { contactUs } from '@/lib/APIs/public/contact-us/route';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// Dynamically import VideoMessageRecorder to avoid SSR issues
const VideoMessageRecorder = dynamic(() => import('../../components/VideoMessageRecorder'), { ssr: false });

// Event/Stream interface
interface EventStream {
  id: string;
  title: string;
  photographer: string;
  photographerId: string;
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
      photographerId: "",
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
  const searchParams = useSearchParams();

  // Blocked users (local only)
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  // Dynamic participants derived from chat messages
  const [participants, setParticipants] = useState<{ id: number; name: string; status: string; avatar: string }[]>([]);

  // Load real event metadata from API on mount if eventId is in URL
  useEffect(() => {
    const eventId = searchParams.get('eventId') || searchParams.get('id');
    if (!eventId) return;

    const loadEventDetails = async () => {
      try {
        const response = await getEventDetails(eventId);
        if (response.success && response.data) {
          const eventData = (response.data as unknown as Record<string, unknown>)?.event || response.data;
          const ev = eventData as Record<string, unknown>;
          setEvents(prev => [{
            ...prev[0],
            id: eventId,
            title: (ev.title as string) || prev[0].title,
            photographer: (ev.photographerName as string) || prev[0].photographer,
            photographerId: (ev.photographerId as string) || (ev.organizerId as string) || prev[0].photographerId,
            category: (ev.eventType as string) || (ev.category as string) || prev[0].category,
          }, ...prev.slice(1)]);
        }
      } catch {
        // Keep default event data
      }
    };
    loadEventDetails();
  }, [searchParams]);

  // Poll stream chat messages every 5 seconds
  useEffect(() => {
    if (!mainEvent?.streamId) return;

    const pollChat = async () => {
      try {
        const response = await getStreamChats(mainEvent.streamId, 0, 50);
        if (response.success && response.data) {
          const rawData = response.data as unknown as Record<string, unknown>;
          const chatMessages: StreamChatMessage[] = rawData?.data
            ? (rawData.data as StreamChatMessage[])
            : Array.isArray(response.data)
              ? (response.data as unknown as StreamChatMessage[])
              : [];

          if (chatMessages.length > 0) {
            // Convert API messages to local format and merge
            const existingIds = new Set(mainEvent.messages.map(m => String(m.id)));
            const newMessages = chatMessages
              .filter(m => !existingIds.has(m.id) && !blockedUsers.has(m.sender))
              .map((m, idx) => ({
                id: Date.now() + idx,
                sender: m.sender,
                text: m.message,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                delivered: true,
                avatar: m.avatar || `https://i.pravatar.cc/150?u=${m.sender}`,
              }));

            if (newMessages.length > 0) {
              setEvents(prev => {
                const updated = [...prev];
                updated[mainEventIndex] = {
                  ...updated[mainEventIndex],
                  messages: [...updated[mainEventIndex].messages, ...newMessages],
                };
                return updated;
              });
            }

            // Update participants from unique senders
            const senderMap = new Map<string, string>();
            chatMessages.forEach(m => {
              if (!senderMap.has(m.sender)) {
                senderMap.set(m.sender, m.avatar || `https://i.pravatar.cc/150?u=${m.sender}`);
              }
            });
            setParticipants(
              Array.from(senderMap.entries()).map(([name, avatar], idx) => ({
                id: idx + 1,
                name,
                status: 'active',
                avatar,
              }))
            );
          }
        }
      } catch {
        // Silent fail for polling
      }
    };

    // Initial fetch
    pollChat();
    const interval = setInterval(pollChat, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainEvent?.streamId, mainEventIndex, blockedUsers]);

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
  // Mobile chat visibility state
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Gift modal state
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftTargetEvent, setGiftTargetEvent] = useState<EventStream | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  // Donation prompt modal state
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationPaymentMethod, setDonationPaymentMethod] = useState<string | null>(null);
  const [donationPhone, setDonationPhone] = useState("");
  const [donationCardNumber, setDonationCardNumber] = useState("");
  const [donationCardExpiry, setDonationCardExpiry] = useState("");
  const [donationCardCvv, setDonationCardCvv] = useState("");
  const [donationCardHolderName, setDonationCardHolderName] = useState("");
  // Payment details state
  const [paymentPhone, setPaymentPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  // API currencies & gift/donation loading state
  const [streamCurrencies, setStreamCurrencies] = useState<APICurrency[]>([]);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [donationApiLoading, setDonationApiLoading] = useState(false);
  const [donationApiError, setDonationApiError] = useState<string | null>(null);

  // Fetch currencies on mount
  useEffect(() => {
    getCurrencies()
      .then(res => {
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setStreamCurrencies(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Giftable ceremony categories
  const giftableCategories = [
    'Wedding', 'Wedding Events', 'Birthday', 'Bridal Shower', 'Baby Shower',
    'Anniversary', 'Engagement', 'Graduation', 'Baptism', 'Christening'
  ];

  // Check if an event is giftable based on its category
  const isEventGiftable = (event: EventStream) => giftableCategories.some(cat =>
    event.category.toLowerCase().includes(cat.toLowerCase())
  );

  // Check if current main event is giftable (for backward compatibility)
  const isGiftableEvent = isEventGiftable(mainEvent);

  // Open gift modal for a specific event - now shows donation prompt first
  const openGiftModal = (event: EventStream) => {
    setGiftTargetEvent(event);
    setShowDonationPrompt(true);
  };

  // Handle donation prompt responses
  const handleDonationPromptYes = () => {
    setShowDonationPrompt(false);
    setShowDonationModal(true);
  };

  const handleDonationPromptNo = () => {
    setShowDonationPrompt(false);
    setShowGiftModal(true);
  };

  // Reset donation modal state
  const resetDonationModal = () => {
    setShowDonationModal(false);
    setDonationAmount("");
    setDonationPaymentMethod(null);
    setDonationPhone("");
    setDonationCardNumber("");
    setDonationCardExpiry("");
    setDonationCardCvv("");
    setDonationCardHolderName("");
  };

  // Validate donation payment details
  const isDonationPaymentValid = () => {
    if (!donationPaymentMethod || !donationAmount) return false;

    switch (donationPaymentMethod) {
      case 'mtn':
      case 'airtel':
        return donationPhone.length >= 10;
      case 'card':
        return donationCardNumber.length >= 16 && donationCardExpiry.length >= 4 && donationCardCvv.length >= 3 && donationCardHolderName.trim() !== '';
      default:
        return false;
    }
  };

  // Handle sending donation
  const handleSendDonation = async () => {
    if (!donationPaymentMethod || !donationAmount) {
      alert('Please select a payment method and enter an amount');
      return;
    }

    if (!isDonationPaymentValid()) {
      alert('Please fill in all required payment details');
      return;
    }

    setDonationApiLoading(true);
    setDonationApiError(null);

    try {
      const currencyId = streamCurrencies.length > 0 ? streamCurrencies[0].id : '';

      const response = await recordTip({
        amount: donationAmount,
        currencyId: currencyId || undefined,
        remarks: `Donation via ${donationPaymentMethod}`,
      });

      if (!response.success) {
        throw new Error(response.error || 'Donation failed');
      }

      resetDonationModal();
    } catch (err) {
      setDonationApiError(err instanceof Error ? err.message : 'Donation failed. Please try again.');
    } finally {
      setDonationApiLoading(false);
    }
  };

  // Payment methods
  const paymentMethods = [
    { id: 'mtn', name: 'MTN Mobile Money', image: '/mtn.png' },
    { id: 'airtel', name: 'Airtel Money', image: '/airtel.png' },
    { id: 'card', name: 'VISA & Master Card', image: '/cards.png' }
  ];

  // Helper to reset all gift modal state
  const resetGiftModal = () => {
    setShowGiftModal(false);
    setGiftTargetEvent(null);
    setSelectedPaymentMethod(null);
    setGiftAmount("");
    setGiftMessage("");
    setPaymentPhone("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardHolderName("");
  };

  // Validate payment details based on selected method
  const isPaymentDetailsValid = () => {
    if (!selectedPaymentMethod || !giftAmount) return false;

    switch (selectedPaymentMethod) {
      case 'mtn':
      case 'airtel':
        return paymentPhone.length >= 10;
      case 'card':
        return cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3 && cardHolderName.trim() !== '';
      default:
        return false;
    }
  };

  // Handle sending gift
  const handleSendGift = async () => {
    if (!selectedPaymentMethod || !giftAmount) {
      alert('Please select a payment method and enter an amount');
      return;
    }

    if (!isPaymentDetailsValid()) {
      alert('Please fill in all required payment details');
      return;
    }

    setGiftLoading(true);
    setGiftError(null);

    try {
      // Use target event or fallback to main event
      const targetEvent = giftTargetEvent || mainEvent;

      // Use first available currency ID
      const currencyId = streamCurrencies.length > 0 ? streamCurrencies[0].id : '';
      const remarks = giftMessage || `Gift to ${targetEvent.photographer} via ${selectedPaymentMethod}`;

      const response = await recordStreamingPayment({
        eventId: targetEvent.id,
        amount: giftAmount,
        currencyId: currencyId || undefined,
        remarks,
      });

      if (!response.success) {
        throw new Error(response.error || 'Gift payment failed');
      }

      resetGiftModal();
    } catch (err) {
      setGiftError(err instanceof Error ? err.message : 'Gift payment failed. Please try again.');
    } finally {
      setGiftLoading(false);
    }
  };

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
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const messageText = replyingTo
        ? `@${replyingTo.sender} ${newMessage}`
        : newMessage;

      const tempId = Date.now();
      const newMsg: Message = {
        id: tempId,
        sender: "You",
        text: messageText,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        delivered: false,
        avatar: "https://i.pravatar.cc/150?img=1",
        replyTo: replyingTo ? { id: replyingTo.id, sender: replyingTo.sender } : undefined
      };

      // Optimistic update
      setEvents(prev => {
        const updated = [...prev];
        updated[mainEventIndex] = {
          ...updated[mainEventIndex],
          messages: [...updated[mainEventIndex].messages, newMsg],
        };
        return updated;
      });
      setNewMessage("");
      setReplyingTo(null);

      // Send to API
      try {
        const response = await sendStreamChat(mainEvent.streamId, messageText);
        if (response.success) {
          // Mark as delivered
          setEvents(prev => {
            const updated = [...prev];
            updated[mainEventIndex] = {
              ...updated[mainEventIndex],
              messages: updated[mainEventIndex].messages.map(m =>
                m.id === tempId ? { ...m, delivered: true } : m
              ),
            };
            return updated;
          });
        }
      } catch {
        // Message stays as undelivered — no removal
      }
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
    // Block user locally and filter their messages from the chat
    setBlockedUsers(prev => new Set(prev).add(sender));
    setEvents(prev => {
      const updated = [...prev];
      updated[mainEventIndex] = {
        ...updated[mainEventIndex],
        messages: updated[mainEventIndex].messages.filter(m => m.sender !== sender),
      };
      return updated;
    });
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
        photographerId: "",
        viewers: 1250,
        category: "Live Events",
        videoSrc: events.length === 1 ? "/live-stream-2.mp4" : "/bako.mp4",
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

    // Check if any modal or menu is open
    const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;

    // Only auto-hide if no modals/menus are open (YouTube-like behavior)
    if (!hasOpenModal) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // 3 seconds like YouTube
    }
  };

  // Handle mouse leaving video player
  const handleMouseLeave = () => {
    // Clear timeout when mouse leaves
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Check if any modal or menu is open
    const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;

    // Only hide controls if no modals/menus are open and not in fullscreen
    if (!hasOpenModal && !isFullscreen) {
      setShowControls(false);
    }
  };

  // Handle touch on video player (for mobile devices) - same logic as mouse
  const handleTouch = () => {
    setShowControls(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Check if any modal or menu is open
    const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;

    // Only auto-hide if no modals/menus are open (YouTube-like behavior)
    if (!hasOpenModal) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // 3 seconds like YouTube
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

  // Participants are now populated from stream chat messages (see polling useEffect above)

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

      // Show controls when entering/exiting fullscreen
      setShowControls(true);

      // If entering fullscreen and no modals are open, start auto-hide timer
      if (isCurrentlyFullscreen) {
        const hasOpenModal = showSettings || showEmojiPicker || showParticipants || showRatingModal || showAddEventModal || showGiftModal;
        if (!hasOpenModal) {
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        }
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

  // Handle report issue — sends via contact-us API
  const handleReportIssue = async (issueType: string) => {
    setShowSettings(false);
    setShowReportIssues(false);

    try {
      await contactUs({
        fullName: 'Stream Viewer',
        email: 'stream-report@amoria.com',
        phone: '',
        subject: `Stream Report: ${issueType}`,
        message: `Issue reported on stream "${mainEvent.title}" (ID: ${mainEvent.streamId}): ${issueType}`,
      });
    } catch {
      // Silent fail — best-effort report
    }
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
  const handleSubmitRating = async () => {
    if (rating === 0) {
      return;
    }

    try {
      // Backend requires multipart/form-data for reviews
      const formData = new FormData();
      formData.append('eventId', mainEvent.id);
      formData.append('photographerId', mainEvent.photographerId);
      formData.append('rating', rating.toString());
      formData.append('comment', ratingComment);

      await apiClient.post(
        API_ENDPOINTS.PUBLIC.SUBMIT_REVIEW,
        formData
      );
    } catch {
      // Silent fail — best effort
    }

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
          /* Prevent horizontal scrolling */
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            max-width: 100vw !important;
          }

          .main-container {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh !important;
            padding: 0 !important;
            gap: 0 !important;
            overflow-x: hidden !important;
            width: 100% !important;
          }

          .layout-wrapper {
            flex-direction: column !important;
            position: relative !important;
            overflow-x: hidden !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100vh !important;
          }

          .video-section {
            width: 100% !important;
            min-height: 100vh !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }

          /* Video player container mobile adjustments */
          .video-player-container {
            height: 50vh !important;
            min-height: 300px !important;
            max-height: 50vh !important;
            width: 100% !important;
          }

          .chat-section {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 70vh !important;
            max-height: 70vh !important;
            border-left: none !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            transform: translateY(100%) !important;
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
            z-index: 1000 !important;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5) !important;
            overflow-y: auto !important;
          }

          .chat-section.chat-open {
            transform: translateY(0) !important;
          }

          .stream-info-section {
            padding: 12px !important;
            padding-bottom: 80px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          .mini-players-container {
            flex-direction: column !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            width: 100% !important;
          }

          /* Floating chat toggle button */
          .mobile-chat-toggle {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            width: 60px !important;
            height: 60px !important;
            border-radius: 50% !important;
            background: linear-gradient(135deg, #03969c 0%, #016a6e 100%) !important;
            border: none !important;
            color: #fff !important;
            font-size: 24px !important;
            cursor: pointer !important;
            box-shadow: 0 4px 20px rgba(3, 150, 156, 0.4), 0 0 0 0 rgba(3, 150, 156, 0.6) !important;
            z-index: 999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: all 0.3s ease !important;
            animation: pulse-ring 2s infinite !important;
          }

          @keyframes pulse-ring {
            0% {
              box-shadow: 0 4px 20px rgba(3, 150, 156, 0.4), 0 0 0 0 rgba(3, 150, 156, 0.6);
            }
            50% {
              box-shadow: 0 4px 20px rgba(3, 150, 156, 0.4), 0 0 0 10px rgba(3, 150, 156, 0);
            }
            100% {
              box-shadow: 0 4px 20px rgba(3, 150, 156, 0.4), 0 0 0 0 rgba(3, 150, 156, 0);
            }
          }

          .mobile-chat-toggle:active {
            transform: scale(0.95) !important;
          }

          .mobile-chat-toggle .unread-badge {
            position: absolute !important;
            top: -5px !important;
            right: -5px !important;
            background: #ef4444 !important;
            color: #fff !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            padding: 4px 8px !important;
            border-radius: 12px !important;
            min-width: 24px !important;
            text-align: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          }

          /* Show mobile close button on mobile only */
          .mobile-chat-close {
            display: flex !important;
          }

          /* Hide mobile chat toggle when chat is open */
          .chat-open ~ .mobile-chat-toggle {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .stream-title {
            font-size: clamp(14px, 4vw, 16px) !important;
          }

          .photographer-name {
            font-size: clamp(12px, 3.5vw, 13px) !important;
          }

          .stat-item {
            font-size: clamp(11px, 3vw, 12px) !important;
          }

          .control-btn {
            font-size: 18px !important;
            padding: 8px !important;
            min-width: 44px !important;
            min-height: 44px !important;
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

        /* iPhone SE and small phones (320px - 375px) */
        @media (max-width: 375px) {
          .video-player-container {
            height: 45vh !important;
            min-height: 250px !important;
          }

          .stream-title {
            font-size: clamp(13px, 4vw, 15px) !important;
            line-height: 1.3 !important;
          }

          .photographer-name {
            font-size: clamp(11px, 3.5vw, 12px) !important;
          }

          .stat-item {
            font-size: clamp(10px, 2.8vw, 11px) !important;
            padding: 4px 6px !important;
          }

          .control-btn {
            font-size: 16px !important;
            padding: 6px !important;
            min-width: 40px !important;
            min-height: 40px !important;
          }

          .stream-info-section {
            padding: 8px !important;
            padding-bottom: 70px !important;
          }

          .mobile-chat-toggle {
            width: 52px !important;
            height: 52px !important;
            font-size: 20px !important;
            bottom: 16px !important;
            right: 16px !important;
          }

          .chat-section {
            height: 75vh !important;
            max-height: 75vh !important;
          }

          /* Smaller buttons and inputs */
          input, textarea, button {
            font-size: 14px !important;
          }

          /* Reduce modal padding */
          .participants-modal {
            width: 95% !important;
            max-width: 280px !important;
            padding: 16px !important;
          }

          /* Optimize emoji picker for small screens */
          .emoji-picker-bar {
            bottom: 55px !important;
            padding: 4px !important;
            gap: 4px !important;
          }

          .emoji-picker-bar button {
            width: 36px !important;
            height: 36px !important;
            font-size: 18px !important;
          }

          /* Mini players stack better on small screens */
          .mini-players-container {
            gap: 8px !important;
            padding: 8px !important;
          }

          /* Settings menu optimization */
          .settings-menu {
            min-width: 200px !important;
            max-width: 90vw !important;
            font-size: 13px !important;
          }

          /* Progress bar larger touch target */
          .progress-bar-container {
            height: 8px !important;
            margin: 8px 0 !important;
          }

          .progress-thumb {
            width: 14px !important;
            height: 14px !important;
          }
        }

        /* Medium phones and phablets (376px - 640px) */
        @media (min-width: 376px) and (max-width: 640px) {
          .video-player-container {
            height: 48vh !important;
            min-height: 280px !important;
          }

          .stream-title {
            font-size: clamp(14px, 3.8vw, 16px) !important;
          }

          .photographer-name {
            font-size: clamp(12px, 3.2vw, 14px) !important;
          }

          .control-btn {
            min-width: 46px !important;
            min-height: 46px !important;
          }

          .mobile-chat-toggle {
            width: 56px !important;
            height: 56px !important;
            font-size: 22px !important;
          }

          .emoji-picker-bar button {
            width: 40px !important;
            height: 40px !important;
            font-size: 20px !important;
          }
        }

        /* Tablets and iPad (641px - 1024px) */
        @media (min-width: 641px) and (max-width: 1024px) {
          .video-player-container {
            height: 55vh !important;
            min-height: 350px !important;
            max-height: 60vh !important;
          }

          .stream-title {
            font-size: clamp(16px, 2.5vw, 18px) !important;
          }

          .photographer-name {
            font-size: clamp(13px, 2.2vw, 15px) !important;
          }

          .chat-section {
            height: 65vh !important;
            max-height: 65vh !important;
          }

          .mobile-chat-toggle {
            width: 64px !important;
            height: 64px !important;
            font-size: 26px !important;
            bottom: 24px !important;
            right: 24px !important;
          }

          /* Two-column layout for mini players on tablet */
          .mini-players-container {
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
            gap: 12px !important;
          }

          /* Larger touch targets for tablet */
          .control-btn {
            min-width: 48px !important;
            min-height: 48px !important;
            font-size: 20px !important;
          }

          .emoji-picker-bar button {
            width: 44px !important;
            height: 44px !important;
            font-size: 22px !important;
          }

          /* Better spacing for tablet */
          .stream-info-section {
            padding: 16px !important;
            padding-bottom: 90px !important;
          }
        }

        /* Landscape orientation handling for phones */
        @media (max-width: 896px) and (orientation: landscape) {
          .video-player-container {
            height: 85vh !important;
            min-height: 85vh !important;
            max-height: 85vh !important;
          }

          .stream-info-section {
            padding: 8px 12px !important;
            padding-bottom: 60px !important;
          }

          .mobile-chat-toggle {
            width: 48px !important;
            height: 48px !important;
            font-size: 20px !important;
            bottom: 12px !important;
            right: 12px !important;
          }

          .chat-section {
            height: 90vh !important;
            max-height: 90vh !important;
          }

          /* Hide mini players in landscape to save space */
          .mini-players-container {
            display: none !important;
          }

          .control-btn {
            min-width: 40px !important;
            min-height: 40px !important;
            font-size: 16px !important;
            padding: 6px !important;
          }

          /* Compact emoji picker */
          .emoji-picker-bar {
            bottom: 45px !important;
            padding: 3px !important;
            gap: 2px !important;
          }

          .emoji-picker-bar button {
            width: 32px !important;
            height: 32px !important;
            font-size: 16px !important;
          }
        }

        /* Safe area insets for notched devices (iPhone X+) */
        @supports (padding: env(safe-area-inset-bottom)) {
          @media (max-width: 1024px) {
            .mobile-chat-toggle {
              bottom: calc(20px + env(safe-area-inset-bottom)) !important;
            }

            .stream-info-section {
              padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important;
            }

            .chat-section {
              padding-bottom: env(safe-area-inset-bottom) !important;
            }

            .emoji-picker-bar {
              bottom: calc(60px + env(safe-area-inset-bottom)) !important;
            }
          }

          @media (max-width: 375px) {
            .mobile-chat-toggle {
              bottom: calc(16px + env(safe-area-inset-bottom)) !important;
            }

            .stream-info-section {
              padding-bottom: calc(70px + env(safe-area-inset-bottom)) !important;
            }
          }
        }

        /* High DPI / Retina displays optimization */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .progress-bar-container {
            height: 6px !important;
          }

          .progress-thumb {
            width: 16px !important;
            height: 16px !important;
          }

          @media (max-width: 375px) {
            .progress-bar-container {
              height: 8px !important;
            }

            .progress-thumb {
              width: 18px !important;
              height: 18px !important;
            }
          }
        }

        /* Desktop-specific styles (maintain unchanged) */
        @media (min-width: 1025px) {
          .mobile-chat-toggle {
            display: none !important;
          }

          .mobile-chat-close {
            display: none !important;
          }

          .chat-section {
            position: static !important;
            transform: none !important;
            height: 100vh !important;
            width: 340px !important;
            max-height: 100vh !important;
          }

          .layout-wrapper {
            flex-direction: row !important;
          }

          .video-section {
            flex: 1 !important;
            min-height: 100vh !important;
          }

          .video-player-container {
            height: calc(100vh - 450px) !important;
            min-height: 400px !important;
          }

          /* Larger control buttons for desktop */
          .control-btn {
            min-width: 52px !important;
            min-height: 52px !important;
            font-size: 24px !important;
            padding: 12px !important;
          }

          /* Make progress bar more visible on desktop */
          .progress-bar-container {
            height: 6px !important;
            margin-bottom: 12px !important;
          }

          .progress-bar-container:hover {
            height: 8px !important;
          }

          /* Larger volume slider on desktop */
          .volume-slider {
            width: 120px !important;
          }
        }

        /* Modal responsive improvements */
        .modal-content,
        .add-event-modal,
        .rating-modal,
        .participants-modal {
          max-width: 90vw !important;
          max-height: 90vh !important;
          overflow-y: auto !important;
        }

        @media (max-width: 640px) {
          .modal-content,
          .add-event-modal,
          .rating-modal {
            width: 95vw !important;
            max-width: 95vw !important;
            margin: 16px !important;
          }

          .modal-content h2,
          .add-event-modal h2,
          .rating-modal h2 {
            font-size: clamp(18px, 5vw, 22px) !important;
          }

          .modal-content input,
          .modal-content textarea,
          .add-event-modal input,
          .add-event-modal textarea,
          .rating-modal input,
          .rating-modal textarea {
            font-size: 16px !important; /* Prevents iOS zoom on focus */
          }

          .participants-modal {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
          }
        }

        /* Safe area insets for modals on notched devices */
        @supports (padding: env(safe-area-inset-bottom)) {
          .add-event-modal,
          .rating-modal,
          .participants-modal {
            padding-bottom: calc(clamp(20px, 5vw, 32px) + env(safe-area-inset-bottom)) !important;
          }

          @media (max-width: 768px) {
            .modal-content,
            .add-event-modal,
            .rating-modal,
            .participants-modal {
              margin-bottom: env(safe-area-inset-bottom) !important;
            }

            .settings-menu {
              bottom: calc(clamp(50px, 12vw, 60px) + env(safe-area-inset-bottom)) !important;
            }
          }
        }

        /* Performance optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Smooth scrolling for all containers */
        .chat-section,
        .messages-container,
        .mini-players-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        /* Dark mode optimization (already dark, but future-proof) */
        @media (prefers-color-scheme: dark) {
          body {
            color-scheme: dark;
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
            backgroundColor: '#1a1a1d',
            overflow: isSwapping ? 'visible' : 'auto',
            position: 'relative',
            paddingLeft: '40px',
            paddingTop: '20px',
            paddingRight: '20px',
          }}>

            {/* Main Video Player Container */}
            <div
              id="main-video-player"
              onClick={() => !isSwapping && togglePlay(mainEvent.id)}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouch}
              onTouchMove={handleTouch}
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
                pointerEvents: isSwapping ? 'none' : 'auto',
                borderRadius: '16px',
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
                  borderRadius: '12px',
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
                  borderRadius: '12px',
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
                  // Clear auto-hide timeout when hovering over controls
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
                    height: 'clamp(4px, 0.5vw, 6px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: 'clamp(8px, 1vw, 12px)',
                    position: 'relative',
                    transition: 'height 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.height = 'clamp(6px, 0.7vw, 8px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.height = 'clamp(4px, 0.5vw, 6px)';
                  }}
                >
                  <div style={{
                    height: '100%',
                    backgroundColor: '#03969c',
                    borderRadius: '6px',
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
                    padding: 'clamp(8px, 1vw, 12px)',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 'clamp(20px, 2vw, 28px)',
                    transition: 'transform 0.2s',
                    minWidth: 'clamp(40px, 4vw, 56px)',
                    minHeight: 'clamp(40px, 4vw, 56px)'
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
                      padding: 'clamp(8px, 1vw, 12px)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      transition: 'transform 0.2s',
                      position: 'relative',
                      zIndex: 1,
                      minWidth: 'clamp(40px, 4vw, 56px)',
                      minHeight: 'clamp(40px, 4vw, 56px)'
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
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${mainState.volume ?? 100}%`,
                          backgroundColor: '#03969c',
                          borderRadius: '6px',
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
                      padding: 'clamp(8px, 1vw, 12px)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      transition: 'transform 0.2s',
                      minWidth: 'clamp(40px, 4vw, 56px)',
                      minHeight: 'clamp(40px, 4vw, 56px)'
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
                      padding: 'clamp(8px, 1vw, 12px)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      minWidth: 'clamp(40px, 4vw, 56px)',
                      minHeight: 'clamp(40px, 4vw, 56px)'
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
                      padding: 'clamp(8px, 1vw, 12px)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      transition: 'transform 0.2s',
                      minWidth: 'clamp(40px, 4vw, 56px)',
                      minHeight: 'clamp(40px, 4vw, 56px)'
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
                        padding: 'clamp(8px, 1vw, 12px)',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 'clamp(20px, 2vw, 28px)',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        minWidth: 'clamp(40px, 4vw, 56px)',
                        minHeight: 'clamp(40px, 4vw, 56px)'
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
                        bottom: 'clamp(50px, 12vw, 60px)',
                        right: '0',
                        backgroundColor: '#18181b',
                        borderRadius: '16px',
                        padding: 'clamp(6px, 2vw, 8px)',
                        minWidth: 'clamp(200px, 50vw, 240px)',
                        maxWidth: 'min(90vw, 280px)',
                        maxHeight: 'min(60vh, 400px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 100,
                        overflowY: 'auto'
                      }}>
                        {/* Quality Settings */}
                        <div style={{ padding: 'clamp(6px, 2vw, 8px)' }}>
                          <div style={{
                            fontSize: 'clamp(11px, 2.5vw, 12px)',
                            fontWeight: '600',
                            color: '#adadb8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>Quality</div>
                          <div className="custom-scrollbar" style={{
                            maxHeight: 'clamp(140px, 30vh, 180px)',
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
                                  padding: 'clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)',
                                  backgroundColor: videoQuality === quality ? 'rgba(3, 150, 156, 0.2)' : 'transparent',
                                  border: 'none',
                                  borderRadius: '12px',
                                  color: videoQuality === quality ? '#03969c' : '#efeff1',
                                  fontSize: 'clamp(13px, 3vw, 14px)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '2px',
                                  transition: 'all 0.2s',
                                  minHeight: '40px'
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
                                  <i className="bi bi-check-lg" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}></i>
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
                              borderRadius: '12px',
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
                              borderRadius: '12px',
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
                        borderRadius: '16px',
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
                                borderRadius: '12px',
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
                      padding: 'clamp(8px, 1vw, 12px)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(20px, 2vw, 28px)',
                      transition: 'transform 0.2s',
                      minWidth: 'clamp(40px, 4vw, 56px)',
                      minHeight: 'clamp(40px, 4vw, 56px)'
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
                <>
                  {/* Backdrop overlay */}
                  <div
                    onMouseDown={(e) => {
                      // Only close if clicking directly on backdrop
                      if (e.target === e.currentTarget) {
                        setShowParticipants(false);
                      }
                    }}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      zIndex: 1999,
                      backdropFilter: 'blur(2px)'
                    }}
                  />
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="participants-modal"
                    style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: '#18181b',
                      borderRadius: '20px',
                      padding: 'clamp(16px, 4vw, 20px)',
                      width: 'min(calc(100vw - 32px), 320px)',
                      maxHeight: 'min(80vh, 500px)',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                      zIndex: 2000,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflowY: 'auto',
                      pointerEvents: 'auto'
                    }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'clamp(12px, 3vw, 16px)'
                  }}>
                    <h3 style={{
                      fontSize: 'clamp(14px, 3.5vw, 16px)',
                      fontWeight: '600',
                      color: '#efeff1',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(6px, 2vw, 8px)'
                    }}>
                      <i className="bi bi-people-fill" style={{ color: '#03969c', fontSize: 'clamp(14px, 3.5vw, 16px)' }}></i>
                      Viewers ({participants.length})
                    </h3>
                    <button
                      onClick={() => setShowParticipants(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#adadb8',
                        cursor: 'pointer',
                        fontSize: 'clamp(16px, 4vw, 18px)',
                        padding: '8px',
                        transition: 'all 0.2s',
                        minWidth: '44px',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#efeff1';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#adadb8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="custom-scrollbar" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(6px, 2vw, 8px)',
                    maxHeight: 'min(60vh, 400px)',
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
                          borderRadius: '14px',
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
                </>
              )}
            </div>

            {/* Send Gift Button - Only visible for giftable ceremonies when there's only one event */}
            {isGiftableEvent && events.length === 1 && (
              <div style={{
                padding: '12px 0',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => openGiftModal(mainEvent)}
                  style={{
                    background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 28px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(3, 150, 156, 0.3)',
                    minWidth: '130px',
                    minHeight: '120px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(3, 150, 156, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.3)';
                  }}
                >
                  <i className="bi bi-gift-fill" style={{ fontSize: '28px' }}></i>
                  <span>Send Gift</span>
                </button>
              </div>
            )}

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
                  alignItems: 'flex-end',
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
                    const isMiniEventGiftable = isEventGiftable(event);

                    return (
                      <div
                        key={event.id}
                        style={{
                          flex: '0 0 auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: '8px'
                        }}
                      >
                        {/* Mini Player Card */}
                        <div
                          onClick={() => !isSwapping && switchToMainEvent(idx)}
                          className={isSwapping && swappingToIndex === idx ? 'swapping-mini-to-main' : ''}
                          style={{
                            width: '300px',
                            height: '170px',
                            backgroundColor: '#000',
                            borderRadius: '16px',
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
                              borderRadius: '10px',
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
                              borderRadius: '10px',
                              fontSize: '12px',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <i className="bi bi-volume-mute-fill"></i>
                            </div>
                          </div>
                        </div>

                        {/* Send Gift Button for Mini Player - Only for giftable events */}
                        {isMiniEventGiftable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openGiftModal(event);
                            }}
                            style={{
                              width: '100%',
                              background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '8px 16px',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 10px rgba(3, 150, 156, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 10px rgba(3, 150, 156, 0.3)';
                            }}
                          >
                            <i className="bi bi-gift-fill" style={{ fontSize: '14px' }}></i>
                            Send Gift
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Main Event Send Gift Button - Right side, extended full height */}
                  {isGiftableEvent && (
                    <div style={{
                      flex: '1 1 auto',
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => openGiftModal(mainEvent)}
                        style={{
                          background: 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px 28px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(3, 150, 156, 0.3)',
                          minWidth: '130px',
                          alignSelf: 'stretch'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(3, 150, 156, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.3)';
                        }}
                      >
                        <i className="bi bi-gift-fill" style={{ fontSize: '28px' }}></i>
                        <span>Send Gift</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Photographer Info and Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2.5vw, 12px)',
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}>
                <img
                  src="https://i.pravatar.cc/150?img=68"
                  alt="Photographer"
                  style={{
                    width: 'clamp(40px, 10vw, 48px)',
                    height: 'clamp(40px, 10vw, 48px)',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #03969c',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <h3 className="photographer-name" style={{
                    fontSize: 'clamp(13px, 3.5vw, 15px)',
                    fontWeight: '600',
                    color: '#efeff1',
                    margin: 0,
                    marginBottom: '4px',
                    lineHeight: '1.3'
                  }}>{mainEvent.photographer}</h3>
                  <p style={{
                    fontSize: 'clamp(11px, 3vw, 13px)',
                    color: '#adadb8',
                    margin: 0
                  }}>{mainEvent.category}</p>
                </div>

                {/* Buttons Container */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2.5vw, 12px)',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    style={{
                      backgroundColor: '#03969c',
                      color: '#fff',
                      fontWeight: '600',
                      padding: '10px 24px',
                      borderRadius: '16px',
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '40px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#027f83'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#03969c'}
                  >
                    <i className="bi bi-star-fill" style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}></i>
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
                        padding: '10px 24px',
                        borderRadius: '16px',
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        minHeight: '40px',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1570d3'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
                    >
                      <i className="bi bi-plus-circle-fill" style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}></i>
                      Add Event
                    </button>
                  )}

                  {/* Leave Stream Button */}
                  <button
                    style={{
                      backgroundColor: '#e61220',
                      color: '#fff',
                      fontWeight: '600',
                      padding: '10px 24px',
                      borderRadius: '16px',
                      fontSize: 'clamp(12px, 2.5vw, 13px)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '40px',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e61220'}
                    onClick={handleLeaveStream}
                  >
                    <i className="bi bi-box-arrow-left" style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}></i>
                    Leave Stream
                  </button>
                </div>
              </div>

              {/* Stream Title */}
              <h2 className="stream-title" style={{
                fontSize: 'clamp(15px, 4vw, 18px)',
                fontWeight: '600',
                color: '#efeff1',
                margin: '0 0 12px 0',
                lineHeight: '1.4'
              }}>{mainEvent.title}</h2>

              {/* Stats Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 3vw, 16px)',
                flexWrap: 'wrap'
              }}>
                <div className="stat-item" style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-clock" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i>
                  {mainEvent.startTime}
                </div>
                <div className="stat-item" style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <i className="bi bi-calendar3" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i>
                  {currentTime}
                </div>
                <div className="stat-item" style={{
                  fontSize: 'clamp(11px, 2.8vw, 13px)',
                  color: '#adadb8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap'
                }}>
                  <span>Stream ID:</span>
                  <span style={{ color: '#efeff1', fontWeight: '600' }}>{mainEvent.streamId}</span>
                  <button
                    style={{
                      color: isCopied ? '#03969c' : '#adadb8',
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'clamp(13px, 3vw, 14px)',
                      transition: 'color 0.2s',
                      minWidth: '32px',
                      minHeight: '32px',
                      justifyContent: 'center'
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
                      fontSize: 'clamp(11px, 2.5vw, 12px)',
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
          <div className={`chat-section ${isChatOpen ? 'chat-open' : ''}`} style={{
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
              backgroundColor: '#18181b',
              position: 'relative'
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
                {/* Mobile Close Button */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="mobile-chat-close"
                  style={{
                    display: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: '#adadb8',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '18px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#efeff1'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#adadb8'}
                >
                  <i className="bi bi-chevron-down"></i>
                </button>
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
                  borderRadius: '12px',
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
                            borderRadius: '10px',
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
                            borderRadius: '10px',
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
                            borderRadius: '10px',
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
                  borderRadius: '12px',
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
                      borderRadius: '10px',
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
                borderRadius: '16px',
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
                  borderRadius: '16px',
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
        <div
          style={{
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
            backdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            // Only close if clicking directly on backdrop
            if (e.target === e.currentTarget) {
              setShowAddEventModal(false);
            }
          }}
        >
          <div className="modal-content add-event-modal" style={{
            backgroundColor: '#18181b',
            borderRadius: '20px',
            padding: 'clamp(20px, 5vw, 32px)',
            maxWidth: '320px',
            width: 'auto',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            margin: 'auto',
            pointerEvents: 'auto'
          }} onMouseDown={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: 'clamp(18px, 4.5vw, 20px)',
              fontWeight: '600',
              color: '#efeff1',
              marginBottom: '8px',
              marginTop: 0,
              lineHeight: '1.3'
            }}>Add Another Event</h2>
            <p style={{
              fontSize: 'clamp(12px, 3vw, 13px)',
              color: '#adadb8',
              marginBottom: 'clamp(16px, 4vw, 24px)',
              lineHeight: '1.5'
            }}>Enter the event ID or host ID to join another live stream (maximum 3 events).</p>
            <input
              type="text"
              value={newEventId}
              onChange={(e) => setNewEventId(e.target.value)}
              placeholder="Enter Event Link or Host ID"
              style={{
                width: '100%',
                padding: 'clamp(10px, 3vw, 12px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '14px',
                fontSize: '16px',
                marginBottom: 'clamp(16px, 4vw, 24px)',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#2f2f35',
                color: '#efeff1',
                minHeight: '44px'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
            />
            <div style={{
              display: 'flex',
              gap: 'clamp(8px, 2vw, 12px)',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowAddEventModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: '#efeff1',
                  fontSize: 'clamp(13px, 3vw, 14px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '44px',
                  minWidth: '100px',
                  flex: '1',
                  maxWidth: '150px'
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
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: newEventId.trim() ? '#1890ff' : '#4b5563',
                  color: '#fff',
                  fontSize: 'clamp(13px, 3vw, 14px)',
                  fontWeight: '600',
                  cursor: newEventId.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  minHeight: '44px',
                  minWidth: '100px',
                  flex: '1',
                  maxWidth: '150px'
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
        <div
          style={{
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
            backdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            // Only close if clicking directly on backdrop
            if (e.target === e.currentTarget) {
              setShowRatingModal(false);
              setRating(0);
              setRatingComment('');
            }
          }}
        >
          <div className="rating-modal" style={{
            backgroundColor: '#18181b',
            borderRadius: '20px',
            padding: 'clamp(20px, 5vw, 32px)',
            paddingTop: 'clamp(40px, 8vw, 50px)',
            maxWidth: '400px',
            width: 'auto',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            margin: 'auto',
            pointerEvents: 'auto'
          }} onMouseDown={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => {
                setShowRatingModal(false);
                setRating(0);
                setRatingComment('');
              }}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 16px)',
                right: 'clamp(12px, 3vw, 16px)',
                background: 'transparent',
                border: 'none',
                color: '#adadb8',
                cursor: 'pointer',
                fontSize: 'clamp(18px, 4vw, 20px)',
                padding: '8px',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#efeff1';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#adadb8';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Title */}
            <h2 style={{
              fontSize: 'clamp(18px, 5vw, 24px)',
              fontWeight: '600',
              color: '#efeff1',
              marginBottom: '8px',
              marginTop: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 2vw, 10px)',
              flexWrap: 'wrap',
              lineHeight: '1.3'
            }}>
              <i className="bi bi-star-fill" style={{ color: '#03969c', fontSize: 'clamp(20px, 5vw, 28px)' }}></i>
              Rate this Live Stream
            </h2>
            <p style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#adadb8',
              marginBottom: 'clamp(16px, 4vw, 24px)',
              lineHeight: '1.5'
            }}>Share your experience with {mainEvent.photographer}</p>

            {/* Star Rating */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(4px, 2vw, 8px)',
              marginBottom: 'clamp(20px, 5vw, 32px)',
              flexWrap: 'wrap'
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
                    padding: 'clamp(4px, 1vw, 8px)',
                    fontSize: 'clamp(32px, 10vw, 48px)',
                    color: (hoverRating || rating) >= star ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s',
                    transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                marginBottom: 'clamp(16px, 4vw, 24px)',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
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
            <div style={{ marginBottom: 'clamp(16px, 4vw, 24px)' }}>
              <label style={{
                fontSize: 'clamp(13px, 3vw, 14px)',
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
                maxLength={500}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 3vw, 12px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#2f2f35',
                  color: '#efeff1',
                  minHeight: 'clamp(80px, 20vw, 100px)',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <div style={{
                fontSize: 'clamp(11px, 2.5vw, 12px)',
                color: '#adadb8',
                marginTop: '6px',
                textAlign: 'right'
              }}>
                {ratingComment.length}/500
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 'clamp(8px, 2vw, 12px)',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setRatingComment('');
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: '#efeff1',
                  fontSize: 'clamp(13px, 3vw, 14px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '44px',
                  minWidth: '100px',
                  flex: '1',
                  maxWidth: '150px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: rating === 0 ? '#4b5563' : '#03969c',
                  color: '#fff',
                  fontSize: 'clamp(13px, 3vw, 14px)',
                  fontWeight: '600',
                  cursor: rating === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'clamp(6px, 1.5vw, 8px)',
                  minHeight: '44px',
                  minWidth: '100px',
                  flex: '1',
                  maxWidth: '180px'
                }}
                onMouseEnter={(e) => {
                  if (rating > 0) e.currentTarget.style.backgroundColor = '#027f83';
                }}
                onMouseLeave={(e) => {
                  if (rating > 0) e.currentTarget.style.backgroundColor = '#03969c';
                }}
                disabled={rating === 0}
              >
                <i className="bi bi-send-fill" style={{ fontSize: 'clamp(12px, 3vw, 14px)' }}></i>
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Prompt Modal */}
      {showDonationPrompt && (
        <div
          style={{
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
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowDonationPrompt(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: 'clamp(24px, 5vw, 32px)',
              width: 'clamp(300px, 90vw, 420px)',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '70px',
              height: '70px',
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <i className="bi bi-heart-fill" style={{ fontSize: '32px', color: '#ef4444' }}></i>
            </div>
            <h3 style={{
              fontSize: 'clamp(18px, 4vw, 22px)',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '12px',
            }}>
              Would you like to make a donation?
            </h3>
            <p style={{
              fontSize: 'clamp(13px, 3vw, 15px)',
              color: '#6b7280',
              lineHeight: '1.6',
              marginBottom: '28px',
            }}>
              Your contribution helps support families in need, medical bills, school requirements, and food for children.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
            }}>
              <button
                onClick={handleDonationPromptNo}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                No, thanks
              </button>
              <button
                onClick={handleDonationPromptYes}
                style={{
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
                }}
              >
                Yes, donate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donation Payment Modal */}
      {showDonationModal && (
        <div
          style={{
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
            backdropFilter: 'blur(4px)',
          }}
          onClick={resetDonationModal}
        >
          <div
            style={{
              backgroundColor: '#18181b',
              borderRadius: '16px',
              padding: 'clamp(16px, 4vw, 24px)',
              width: 'clamp(320px, 95vw, 480px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #333',
            }}>
              <div>
                <h3 style={{
                  fontSize: 'clamp(18px, 4vw, 22px)',
                  fontWeight: '700',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '4px',
                }}>
                  <i className="bi bi-heart-fill" style={{ color: '#ef4444' }}></i>
                  Make a Donation
                </h3>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                  Support families in need
                </p>
              </div>
              <button
                onClick={resetDonationModal}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#333',
                  border: 'none',
                  color: '#fff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                Donation Amount (UGX)
              </label>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '10px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '12px',
              }}>
                {['10000', '20000', '50000', '100000'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDonationAmount(amount)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: donationAmount === amount ? '#f59e0b' : '#27272a',
                      color: donationAmount === amount ? '#000' : '#fff',
                      border: '1px solid',
                      borderColor: donationAmount === amount ? '#f59e0b' : '#3f3f46',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {parseInt(amount).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setDonationPaymentMethod(method.id)}
                    style={{
                      padding: '12px',
                      backgroundColor: donationPaymentMethod === method.id ? '#f59e0b' : '#27272a',
                      border: '1px solid',
                      borderColor: donationPaymentMethod === method.id ? '#f59e0b' : '#3f3f46',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <img src={method.image} alt={method.name} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: donationPaymentMethod === method.id ? '#000' : '#fff',
                      textAlign: 'left',
                    }}>
                      {method.name}
                    </span>
                    {donationPaymentMethod === method.id && (
                      <i className="bi bi-check-circle-fill" style={{ marginLeft: 'auto', color: '#000' }}></i>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            {(donationPaymentMethod === 'mtn' || donationPaymentMethod === 'airtel') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={donationPhone}
                  onChange={(e) => setDonationPhone(e.target.value)}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {donationPaymentMethod === 'card' && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={donationCardHolderName}
                    onChange={(e) => setDonationCardHolderName(e.target.value)}
                    placeholder="Enter cardholder name"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '10px',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={donationCardNumber}
                    onChange={(e) => setDonationCardNumber(e.target.value)}
                    placeholder="Enter card number"
                    maxLength={19}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: '16px',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '10px',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={donationCardExpiry}
                      onChange={(e) => setDonationCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '10px',
                        color: '#fff',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                      CVV
                    </label>
                    <input
                      type="text"
                      value={donationCardCvv}
                      onChange={(e) => setDonationCardCvv(e.target.value)}
                      placeholder="CVV"
                      maxLength={4}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        fontSize: '16px',
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '10px',
                        color: '#fff',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Donation error message */}
            {donationApiError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '10px',
                color: '#EF4444',
                fontSize: '13px',
              }}>
                {donationApiError}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSendDonation}
              disabled={!isDonationPaymentValid() || donationApiLoading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                color: '#fff',
                background: (isDonationPaymentValid() && !donationApiLoading)
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : '#3f3f46',
                border: 'none',
                borderRadius: '12px',
                cursor: (isDonationPaymentValid() && !donationApiLoading) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: (isDonationPaymentValid() && !donationApiLoading) ? '0 4px 20px rgba(245, 158, 11, 0.4)' : 'none',
              }}
            >
              <i className="bi bi-heart-fill" style={{ color: '#ef4444' }}></i>
              {donationApiLoading ? 'Processing...' : `Donate ${donationAmount ? `(UGX ${parseInt(donationAmount).toLocaleString()})` : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <div
          style={{
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
            backdropFilter: 'blur(4px)',
            padding: '16px',
            overflowY: 'auto'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              resetGiftModal();
            }
          }}
        >
          <div className="gift-modal" style={{
            backgroundColor: '#18181b',
            borderRadius: '20px',
            padding: 'clamp(20px, 5vw, 32px)',
            paddingTop: 'clamp(40px, 8vw, 50px)',
            maxWidth: '450px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            margin: 'auto',
            pointerEvents: 'auto'
          }} onMouseDown={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => resetGiftModal()}
              style={{
                position: 'absolute',
                top: 'clamp(12px, 3vw, 16px)',
                right: 'clamp(12px, 3vw, 16px)',
                background: 'transparent',
                border: 'none',
                color: '#adadb8',
                cursor: 'pointer',
                fontSize: 'clamp(18px, 4vw, 20px)',
                padding: '8px',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#efeff1';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#adadb8';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            {/* Title */}
            <h2 style={{
              fontSize: 'clamp(18px, 5vw, 24px)',
              fontWeight: '600',
              color: '#efeff1',
              marginBottom: '8px',
              marginTop: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 2vw, 10px)',
              flexWrap: 'wrap',
              lineHeight: '1.3'
            }}>
              <i className="bi bi-gift-fill" style={{ color: '#03969c', fontSize: 'clamp(20px, 5vw, 28px)' }}></i>
              Send a Gift
            </h2>
            <p style={{
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#adadb8',
              marginBottom: 'clamp(16px, 4vw, 24px)',
              lineHeight: '1.5'
            }}>Show your appreciation to {giftTargetEvent?.photographer || mainEvent.photographer}</p>

            {/* Gift Amount Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#efeff1',
                marginBottom: '8px'
              }}>Gift Amount (UGX)</label>
              <input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#efeff1',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
              {['10000', '20000', '50000', '100000'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setGiftAmount(amount)}
                  style={{
                    flex: '1 1 calc(25% - 6px)',
                    minWidth: '70px',
                    padding: '10px 12px',
                    backgroundColor: giftAmount === amount ? '#03969c' : '#27272a',
                    border: '1px solid',
                    borderColor: giftAmount === amount ? '#03969c' : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#efeff1',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (giftAmount !== amount) {
                      e.currentTarget.style.borderColor = '#03969c';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (giftAmount !== amount) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {parseInt(amount).toLocaleString()}
                </button>
              ))}
            </div>

            {/* Payment Method Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#efeff1',
                marginBottom: '12px'
              }}>Select Payment Method</label>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: selectedPaymentMethod === method.id ? 'rgba(3, 150, 156, 0.15)' : '#27272a',
                      border: '2px solid',
                      borderColor: selectedPaymentMethod === method.id ? '#03969c' : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPaymentMethod !== method.id) {
                        e.currentTarget.style.borderColor = 'rgba(3, 150, 156, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPaymentMethod !== method.id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img
                        src={method.image}
                        alt={method.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <span style={{
                      color: '#efeff1',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>{method.name}</span>
                    {selectedPaymentMethod === method.id && (
                      <i className="bi bi-check-circle-fill" style={{
                        marginLeft: 'auto',
                        color: '#03969c',
                        fontSize: '20px'
                      }}></i>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Details Input - MTN/Airtel Mobile Money */}
            {(selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'airtel') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#efeff1',
                  marginBottom: '8px'
                }}>Your Phone Number *</label>
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder={selectedPaymentMethod === 'mtn' ? "e.g., 0781234567" : "e.g., 0721234567"}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#27272a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#efeff1',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                <p style={{
                  fontSize: '11px',
                  color: '#71717a',
                  marginTop: '6px',
                  marginBottom: 0
                }}>You will receive a payment confirmation SMS on this number</p>
              </div>
            )}

            {/* Payment Details Input - Card */}
            {selectedPaymentMethod === 'card' && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#efeff1',
                    marginBottom: '8px'
                  }}>Card Holder Name *</label>
                  <input
                    type="text"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    placeholder="Name on card"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#27272a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#efeff1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#efeff1',
                    marginBottom: '8px'
                  }}>Card Number *</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#27272a',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#efeff1',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                      letterSpacing: '2px'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#efeff1',
                      marginBottom: '8px'
                    }}>Expiry Date *</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2);
                        }
                        setCardExpiry(value);
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#27272a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#efeff1',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#efeff1',
                      marginBottom: '8px'
                    }}>CVV *</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="***"
                      maxLength={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#27272a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: '#efeff1',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gift Message */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: '#efeff1',
                marginBottom: '8px'
              }}>Add a Message (Optional)</label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Write a congratulatory message..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#27272a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#efeff1',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#03969c'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            {/* Gift error message */}
            {giftError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '10px',
                color: '#EF4444',
                fontSize: '13px',
              }}>
                {giftError}
              </div>
            )}

            {/* Send Gift Button */}
            <button
              onClick={handleSendGift}
              disabled={!isPaymentDetailsValid() || giftLoading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: (!isPaymentDetailsValid() || giftLoading)
                  ? '#3f3f46'
                  : 'linear-gradient(135deg, #03969c 0%, #026d72 100%)',
                border: 'none',
                borderRadius: '12px',
                color: (!isPaymentDetailsValid() || giftLoading) ? '#71717a' : '#fff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: (!isPaymentDetailsValid() || giftLoading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: (!isPaymentDetailsValid() || giftLoading)
                  ? 'none'
                  : '0 4px 15px rgba(3, 150, 156, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (isPaymentDetailsValid() && !giftLoading) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(3, 150, 156, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (isPaymentDetailsValid() && !giftLoading) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(3, 150, 156, 0.3)';
                }
              }}
            >
              <i className="bi bi-gift-fill" style={{ fontSize: '18px' }}></i>
              {giftLoading ? 'Processing...' : `Send Gift ${giftAmount ? `(UGX ${parseInt(giftAmount).toLocaleString()})` : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Chat Toggle Button (hidden on desktop) */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="mobile-chat-toggle"
        style={{ display: 'none' }}
      >
        <i className="bi bi-chat-dots-fill"></i>
        {mainEvent.messages.length > 0 && (
          <span className="unread-badge">{mainEvent.messages.length}</span>
        )}
      </button>

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
