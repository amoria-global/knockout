'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface Chat {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  lastSeen?: string;
}

export default function ChatPage(): React.JSX.Element {
  const t = useTranslations('chat');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [chatMessages, setChatMessages] = useState<{[key: string]: Message[]}>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'online' | 'archived'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common emojis for quick access
  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎉', '😍', '🤔', '👏', '🙏', '💯', '🔥', '✨'];

  // Mock chat list data
  const initialChatList: Chat[] = [
   {
      id: '1',
      username: 'moise caicedo',
      handle: '@moise_caicedo25',
      avatar: 'https://i.pinimg.com/736x/63/67/e0/6367e086ac78348bbea073cb8bf27f4a.jpg',
      lastMessage: 'Yes, that works for me! How do we proceed...',
      lastMessageTime: '8:55 AM',
      unreadCount: 0,
      isOnline: true,
      lastSeen: 'Active now'
    },
    {
      id: '2',
      username: 'cole palmer',
      handle: '@cole_10',
      avatar: 'https://i.pinimg.com/1200x/e5/4b/24/e54b24db472d1c09aa4cfd32632b7c03.jpg',
      lastMessage: 'We need full-day coverage, around 8 hours...',
      lastMessageTime: 'Yesterday',
      unreadCount: 2,
      isOnline: false,
      lastSeen: 'Last seen 2 hours ago'
    },
    {
      id: '3',
      username: 'Enzo Fernandez',
      handle: '@enzo_24',
      avatar: 'https://i.pinimg.com/736x/e2/f1/38/e2f1385318acdaf425584eb398e10427.jpg',
      lastMessage: 'Good morning! Absolutely! I specialize in...',
      lastMessageTime: '2 days ago',
      unreadCount: 0,
      isOnline: false,
      lastSeen: 'Last seen yesterday at 5:30 PM'
    },
    {
      id: '4',
      username: 'pedro neto',
      handle: '@pedro_56',
      avatar: 'https://i.pinimg.com/1200x/43/ad/f4/43adf46a9d1c166831873f851b856146.jpg',
      lastMessage: 'It\'s on May 10th at Central Park. We\'ll have...',
      lastMessageTime: '3 days ago',
      unreadCount: 1,
      isOnline: true,
      lastSeen: 'Active now'
    },
    {
      id: '5',
      username: 'reece james',
      handle: '@reece-james',
      avatar: 'https://i.pinimg.com/1200x/8b/e5/d5/8be5d5d08e446b9ccc270a3c97d528cb.jpg',
      lastMessage: 'Hi! Yes, I love photographing children\'s...',
      lastMessageTime: '4 days ago',
      unreadCount: 0,
      isOnline: false,
      lastSeen: 'Last seen 3 days ago'
    },
    {
      id: '6',
      username: 'marc cucurella',
      handle: '@marc_cucu',
      avatar: 'https://i.pinimg.com/1200x/38/cc/92/38cc9214a549952930e01609bc27d0c3.jpg',
      lastMessage: 'Hey! I offer professional headshot sessions...',
      lastMessageTime: 'Last week',
      unreadCount: 0,
      isOnline: false,
      lastSeen: 'Last seen Monday at 2:15 PM'
    },
    {
      id: '7',
      username: 'jao pre',
      handle: '@jao_pre',
      avatar: 'https://i.pinimg.com/736x/fb/53/d4/fb53d421f20c2410cec506c17601e835.jpg',
      lastMessage: 'It\'s a 3-day conference from July 15-17...',
      lastMessageTime: '2 weeks ago',
      unreadCount: 5,
      isOnline: false,
      lastSeen: 'Last seen 5 days ago'
    }
  ];

  const [chatList] = useState<Chat[]>(initialChatList);

  // Initialize messages for each chat
  useEffect(() => {
    const initialMessages: {[key: string]: Message[]} = {
      '1': [
        {
          id: '1',
          text: 'Hey, I want to award you a job of videographing in my baby\'s shower. What are you offering on the table?',
          timestamp: '8:45 AM',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Hello! Thank you for reaching out and for the opportunity. For baby showers, I offer complete video coverage that includes event filming, editing, and a highlight video. If you can provide more details — such as the event date, duration, and any specific requests — I\'ll share a customized offer that fits your needs perfectly.',
          timestamp: '8:47 AM',
          isSent: false
        },
        {
          id: '3',
          text: 'That sounds great. The event is on March 15th, from 2 PM to 5 PM. We\'re expecting around 50 guests. I\'d like full coverage including the setup, games, and gift opening.',
          timestamp: '8:50 AM',
          isSent: true,
          status: 'read'
        },
        {
          id: '4',
          text: 'Perfect! For a 3-hour baby shower with 50 guests, I recommend our Premium Package which includes:\n\n• Professional videographer for 3 hours\n• Full event coverage (setup to closing)\n• Drone footage (outdoor shots)\n• Same-day highlight reel (2-3 minutes)\n• Full edited video (15-20 minutes)\n• All raw footage provided\n\nThe pricing for this package is $850. I\'m available on March 15th! Would you like to proceed with booking?',
          timestamp: '8:52 AM',
          isSent: false
        },
        {
          id: '5',
          text: 'Yes, that works for me! How do we proceed with the booking?',
          timestamp: '8:55 AM',
          isSent: true,
          status: 'delivered'
        }
      ],
      '2': [
        {
          id: '1',
          text: 'Hi! I saw your portfolio and I\'m interested in your wedding photography services. Do you have availability for June 20th?',
          timestamp: 'Yesterday',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Hello! Thank you for your interest! Yes, I\'m available on June 20th. I offer comprehensive wedding packages including pre-wedding shoots, full-day coverage, and professional editing. What type of coverage are you looking for?',
          timestamp: 'Yesterday',
          isSent: false
        },
        {
          id: '3',
          text: 'We need full-day coverage, around 8 hours. The ceremony starts at 3 PM and reception ends around 11 PM.',
          timestamp: 'Yesterday',
          isSent: true,
          status: 'read'
        }
      ],
      '3': [
        {
          id: '1',
          text: 'Good morning! I need a photographer for my product launch event on April 5th. Can you help?',
          timestamp: '2 days ago',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Good morning! Absolutely! I specialize in corporate and product photography. For product launches, I provide event coverage, product close-ups, and candid shots of attendees. How many hours of coverage do you need?',
          timestamp: '2 days ago',
          isSent: false
        }
      ],
      '4': [
        {
          id: '1',
          text: 'Hello, I\'m planning a family reunion and would love to have professional photos. Are you available for outdoor shoots?',
          timestamp: '3 days ago',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Hello! Yes, I love outdoor family shoots! I can capture beautiful candid and posed shots in natural settings. When is your reunion planned, and how many family members will be there?',
          timestamp: '3 days ago',
          isSent: false
        },
        {
          id: '3',
          text: 'It\'s on May 10th at Central Park. We\'ll have about 25 family members including kids.',
          timestamp: '3 days ago',
          isSent: true,
          status: 'delivered'
        }
      ],
      '5': [
        {
          id: '1',
          text: 'Hi! Do you do birthday party photography? My daughter is turning 5 and we\'re having a princess-themed party.',
          timestamp: '4 days ago',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Hi! Yes, I love photographing children\'s birthday parties! I can capture all the magical moments, from the decorations to the cake cutting and candid shots of the kids having fun. When is the party?',
          timestamp: '4 days ago',
          isSent: false
        }
      ],
      '6': [
        {
          id: '1',
          text: 'Hey, I need headshots for my acting portfolio. What\'s your rate for a professional headshot session?',
          timestamp: 'Last week',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Hey! I offer professional headshot sessions perfect for acting portfolios. My sessions include multiple outfit changes, various backgrounds, and professional retouching. My standard headshot package is $250 for a 1-hour session with 10 edited photos. Does that work for you?',
          timestamp: 'Last week',
          isSent: false
        }
      ],
      '7': [
        {
          id: '1',
          text: 'Good afternoon! I\'m organizing a corporate conference and need event photography coverage. Can you handle multi-day events?',
          timestamp: '2 weeks ago',
          isSent: true,
          status: 'read'
        },
        {
          id: '2',
          text: 'Good afternoon! Yes, I have extensive experience with multi-day corporate events. I can provide continuous coverage including keynote speeches, networking sessions, workshops, and sponsor areas. How many days is your conference?',
          timestamp: '2 weeks ago',
          isSent: false
        },
        {
          id: '3',
          text: 'It\'s a 3-day conference from July 15-17. We expect about 200 attendees.',
          timestamp: '2 weeks ago',
          isSent: true,
          status: 'read'
        }
      ]
    };
    setChatMessages(initialMessages);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedChat]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilterMenu && !target.closest('.filter-menu-container')) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  // Get current messages for selected chat
  const messages: Message[] = selectedChat ? (chatMessages[selectedChat.id] || []) : [];

  // Filter chats based on search text and active filter
  const filteredChatList = chatList.filter(chat => {
    // First apply search filter
    const matchesSearch = chat.username.toLowerCase().includes(searchText.toLowerCase()) ||
      chat.handle.toLowerCase().includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    // Then apply active filter
    switch (activeFilter) {
      case 'unread':
        return chat.unreadCount && chat.unreadCount > 0;
      case 'online':
        return chat.isOnline === true;
      case 'archived':
        // For now, no archived chats (can be implemented later)
        return false;
      case 'all':
      default:
        return true;
    }
  });

  // Send message function
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isSent: true,
      status: 'sent'
    };

    setChatMessages(prev => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
    }));

    setMessageText('');
    setShowEmojiPicker(false);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle file attachment
  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedChat) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: `📎 Sent a file: ${file.name}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isSent: true
      };

      setChatMessages(prev => ({
        ...prev,
        [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage]
      }));
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .message-bubble:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }

        @media (max-width: 768px) {
          .chat-container {
            flex-direction: column !important;
          }
          .chat-list-panel {
            width: 100% !important;
            display: ${selectedChat ? 'none' : 'flex'} !important;
          }
          .conversation-panel {
            display: ${selectedChat ? 'flex' : 'none'} !important;
          }
          .message-bubble {
            max-width: 85% !important;
          }
          .emoji-picker {
            left: 20px !important;
            right: 20px !important;
            width: auto !important;
          }
          .mobile-back-button {
            display: flex !important;
          }
          .desktop-back-button {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .mobile-back-button {
            display: none !important;
          }
          .desktop-back-button {
            display: flex !important;
          }
        }
      `}</style>
      <div className="chat-container" style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: "'Pragati Narrow', sans-serif"
      }}>
      {/* Left Panel - Chat List */}
      <div className="chat-list-panel" style={{
        width: '320px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <button
            onClick={() => window.history.back()}
            className="desktop-back-button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: '#666',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            <i className="bi bi-chevron-left" style={{ fontSize: '20px' }}></i>
            <span>{t('title')}</span>
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: '#666',
            cursor: 'pointer',
            padding: '4px'
          }}>
            <i className="bi bi-three-dots-vertical"></i>
          </button>
        </div>

        {/* Search Bar */}
        <div className="filter-menu-container" style={{
          margin: '12px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          padding: '10px 12px',
          gap: '8px',
          position: 'relative'
        }}>
          <i className="bi bi-search" style={{ fontSize: '16px', color: '#666' }}></i>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: '#333'
            }}
          />
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            style={{
              background: activeFilter !== 'all' ? '#083A85' : 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeFilter === 'all') {
                e.currentTarget.style.backgroundColor = '#e8e8e8';
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter === 'all') {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <i className="bi bi-sliders" style={{
              fontSize: '16px',
              color: activeFilter !== 'all' ? '#fff' : '#666'
            }}></i>
          </button>

          {/* Filter Dropdown Menu */}
          {showFilterMenu && (
            <div style={{
              position: 'absolute',
              top: '50px',
              right: '12px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              padding: '8px',
              minWidth: '180px',
              zIndex: 1000,
              border: '1px solid #e0e0e0'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#888',
                padding: '8px 12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>{t('filterChats')}</div>

              {[
                { key: 'all', label: t('allChats'), icon: 'bi-chat-dots' },
                { key: 'unread', label: t('unreadChats'), icon: 'bi-envelope-fill' },
                { key: 'online', label: t('onlineChats'), icon: 'bi-circle-fill' },
                { key: 'archived', label: t('archivedChats'), icon: 'bi-archive-fill' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => {
                    setActiveFilter(filter.key as 'all' | 'unread' | 'online' | 'archived');
                    setShowFilterMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    border: 'none',
                    backgroundColor: activeFilter === filter.key ? '#f0f7ff' : 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    marginBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeFilter !== filter.key) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeFilter !== filter.key) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <i
                    className={filter.icon}
                    style={{
                      fontSize: '14px',
                      color: activeFilter === filter.key ? '#083A85' : '#666',
                      width: '16px'
                    }}
                  ></i>
                  <span style={{
                    fontSize: '14px',
                    color: activeFilter === filter.key ? '#083A85' : '#333',
                    fontWeight: activeFilter === filter.key ? '600' : '400',
                    flex: 1,
                    textAlign: 'left'
                  }}>{filter.label}</span>
                  {activeFilter === filter.key && (
                    <i className="bi bi-check2" style={{ fontSize: '16px', color: '#083A85', fontWeight: 'bold' }}></i>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat List */}
        <div style={{
          flex: 1,
          overflowY: 'auto'
        }}>
          {filteredChatList.length > 0 ? (
            filteredChatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  backgroundColor: selectedChat?.id === chat.id ? '#f5f5f5' : '#fff',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (selectedChat?.id !== chat.id) {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedChat?.id !== chat.id) {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                {/* Avatar with online indicator */}
                <div style={{ position: 'relative', marginRight: '12px' }}>
                  <img
                    src={chat.avatar}
                    alt={chat.username}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  {chat.isOnline && (
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '14px',
                      height: '14px',
                      backgroundColor: '#10b981',
                      border: '2px solid #fff',
                      borderRadius: '50%'
                    }}></div>
                  )}
                </div>

                {/* Chat info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Username and timestamp */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: 1,
                      minWidth: 0
                    }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: chat.unreadCount && chat.unreadCount > 0 ? '700' : '600',
                        color: '#000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{chat.username}</span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: chat.unreadCount && chat.unreadCount > 0 ? '#083A85' : '#888',
                      fontWeight: chat.unreadCount && chat.unreadCount > 0 ? '600' : '400',
                      whiteSpace: 'nowrap',
                      marginLeft: '8px'
                    }}>{chat.lastMessageTime}</span>
                  </div>

                  {/* Last message and unread badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <p style={{
                      fontSize: '13px',
                      color: chat.unreadCount && chat.unreadCount > 0 ? '#333' : '#666',
                      fontWeight: chat.unreadCount && chat.unreadCount > 0 ? '500' : '400',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>{chat.lastMessage}</p>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <div style={{
                        minWidth: '20px',
                        height: '20px',
                        backgroundColor: '#083A85',
                        color: '#fff',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '0 6px'
                      }}>
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#888'
            }}>
              {t('noChatsFound')}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Conversation */}
      <div className="conversation-panel" style={{
        flex: 1,
        backgroundColor: '#e8e8e8',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {selectedChat ? (
          <>
            {/* Conversation Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Mobile back button */}
                <button
                  onClick={() => setSelectedChat(null)}
                  className="mobile-back-button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: '#666',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'none'
                  }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <div style={{ position: 'relative', marginRight: '12px' }}>
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.username}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  {selectedChat.isOnline && (
                    <div style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#10b981',
                      border: '2px solid #fff',
                      borderRadius: '50%'
                    }}></div>
                  )}
                </div>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000',
                    marginBottom: '2px'
                  }}>{selectedChat.username}</div>
                  <div style={{
                    fontSize: '13px',
                    color: selectedChat.isOnline ? '#10b981' : '#888',
                    fontWeight: selectedChat.isOnline ? '500' : '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {selectedChat.isOnline && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%'
                      }}></div>
                    )}
                    {selectedChat.lastSeen}
                  </div>
                </div>
              </div>
              <button style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#666',
                cursor: 'pointer',
                padding: '4px'
              }}>
                <i className="bi bi-three-dots-vertical"></i>
              </button>
            </div>

            {/* Date Label */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '12px'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#888',
                backgroundColor: '#fff',
                padding: '4px 12px',
                borderRadius: '12px'
              }}>{t('today')}</span>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundImage: 'linear-gradient(to bottom, #f0f0f0 0%, #e8e8e8 100%)'
            }}>
              {messages.length > 0 ? (
                <>
                  {messages.map((message, index) => {
                    const showAvatar = !message.isSent && (
                      index === messages.length - 1 ||
                      messages[index + 1]?.isSent !== message.isSent
                    );

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          marginBottom: '12px',
                          justifyContent: message.isSent ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          animation: 'fadeIn 0.3s ease-in'
                        }}
                      >
                        {!message.isSent && (
                          <div style={{ width: '36px', marginRight: '8px' }}>
                            {showAvatar && (
                              <img
                                src={selectedChat.avatar}
                                alt="avatar"
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  border: '2px solid #fff',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                              />
                            )}
                          </div>
                        )}
                        <div className="message-bubble" style={{
                          maxWidth: '65%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.isSent ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            background: message.isSent
                              ? 'linear-gradient(135deg, #083A85 0%, #0a4a9d 100%)'
                              : '#ffffff',
                            padding: '12px 16px',
                            borderRadius: '18px',
                            borderTopLeftRadius: message.isSent ? '18px' : (showAvatar ? '18px' : '6px'),
                            borderTopRightRadius: message.isSent ? (showAvatar ? '18px' : '6px') : '18px',
                            borderBottomLeftRadius: message.isSent ? '18px' : '18px',
                            borderBottomRightRadius: message.isSent ? '18px' : '18px',
                            boxShadow: message.isSent
                              ? '0 2px 8px rgba(8, 58, 133, 0.3)'
                              : '0 2px 8px rgba(0,0,0,0.08)',
                            position: 'relative'
                          }}>
                            <p style={{
                              fontSize: '15px',
                              color: message.isSent ? '#ffffff' : '#1a1a1a',
                              margin: '0',
                              lineHeight: '1.5',
                              wordWrap: 'break-word',
                              fontWeight: message.isSent ? '400' : '400'
                            }}>{message.text}</p>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginTop: '4px',
                              justifyContent: 'flex-end'
                            }}>
                              <span style={{
                                fontSize: '11px',
                                color: message.isSent ? 'rgba(255,255,255,0.8)' : '#888',
                                fontWeight: '500'
                              }}>{message.timestamp}</span>
                              {message.isSent && message.status && (
                                <span style={{ marginLeft: '2px' }}>
                                  {message.status === 'sent' && (
                                    <i className="bi bi-check" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}></i>
                                  )}
                                  {message.status === 'delivered' && (
                                    <i className="bi bi-check-all" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}></i>
                                  )}
                                  {message.status === 'read' && (
                                    <i className="bi bi-check-all" style={{ fontSize: '14px', color: '#4fc3f7' }}></i>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      marginBottom: '12px'
                    }}>
                      <img
                        src={selectedChat.avatar}
                        alt="avatar"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          marginRight: '8px',
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <div style={{
                        backgroundColor: '#fff',
                        padding: '12px 18px',
                        borderRadius: '18px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#999',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '-0.32s'
                          }}></div>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#999',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '-0.16s'
                          }}></div>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#999',
                            animation: 'bounce 1.4s infinite ease-in-out both'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <i className="bi bi-chat-heart" style={{ fontSize: '48px', color: '#d1d5db' }}></i>
                  <p style={{ fontSize: '16px', color: '#888', fontWeight: '500' }}>
                    {t('noMessagesYet')}
                  </p>
                </div>
              )}
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="emoji-picker" style={{
                position: 'absolute',
                bottom: '80px',
                left: '340px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px',
                zIndex: 1000
              }}>
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Input Container */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              gap: '10px',
              position: 'relative',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
            }}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#666',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
              >
                <i className="bi bi-emoji-smile"></i>
              </button>
              <button
                onClick={handleAttachment}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '8px',
                  color: '#666',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
              >
                <i className="bi bi-paperclip"></i>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <input
                type="text"
                placeholder={t('typeMessage')}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  fontSize: '15px',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid transparent',
                  borderRadius: '24px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Pragati Narrow', sans-serif"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#083A85';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                style={{
                  background: messageText.trim()
                    ? 'linear-gradient(135deg, #083A85 0%, #0a4a9d 100%)'
                    : '#d1d5db',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                  color: '#fff',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: messageText.trim() ? '0 2px 8px rgba(8, 58, 133, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (messageText.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = messageText.trim() ? '0 2px 8px rgba(8, 58, 133, 0.3)' : 'none';
                }}
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px'
          }}>
            <i className="bi bi-chat-dots" style={{ fontSize: '64px', color: '#d1d5db' }}></i>
            <p style={{
              fontSize: '18px',
              color: '#888',
              fontWeight: '500'
            }}>{t('selectChat')}</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
