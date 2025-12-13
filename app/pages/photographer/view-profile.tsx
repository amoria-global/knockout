'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import AmoriaKNavbar from '../../components/navbar';
import ReviewModal from '../../components/ReviewModal';

// Shared photographer data - matches photographers.tsx exactly
const photographersData = [
  {
    id: 1,
    name: 'Cole Palmer',
    image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    bannerImage: 'https://i.pinimg.com/736x/8b/89/70/8b8970fb8745252e4d36f60305967d37.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Gasabo',
    specialty: 'Videographer',
    categories: ['Weddings', 'Concerts', 'Birthdays', 'Corporate', 'Events'],
    rating: 4.9,
    reviews: 127,
    completedJobs: 50,
  },
  {
    id: 2,
    name: 'Enzo Fernandez',
    image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    verified: true,
    location: 'Musanze - Rwanda, Musanze',
    specialty: 'Photographer',
    categories: ['Events', 'Corporate', 'Portraits'],
    rating: 4.8,
    reviews: 98,
    completedJobs: 65,
  },
  {
    id: 3,
    name: 'Liam delap',
    image: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/09/23/45/092345eac1919407e0c49f67e285b831.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Kicukiro',
    specialty: 'Photographer',
    categories: ['Portraits', 'Fashion', 'Weddings'],
    rating: 4.7,
    reviews: 156,
    completedJobs: 80,
  },
  {
    id: 4,
    name: 'Moises Caicedo',
    image: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    verified: true,
    location: 'Huye - Rwanda, Huye',
    specialty: 'Videographer',
    categories: ['Commercial', 'Product', 'Events'],
    rating: 4.9,
    reviews: 143,
    completedJobs: 72,
  },
  {
    id: 5,
    name: 'Pedro neto',
    image: 'https://i.pinimg.com/736x/0f/22/d0/0f22d09fadd8a310fa484d1e94c8c55f.jpg',
    bannerImage: 'https://i.pinimg.com/736x/0f/22/d0/0f22d09fadd8a310fa484d1e94c8c55f.jpg',
    verified: true,
    location: 'Rubavu - Rwanda, Rubavu',
    specialty: 'Photographer',
    categories: ['Weddings', 'Events', 'Family'],
    rating: 4.8,
    reviews: 134,
    completedJobs: 58,
  },
  {
    id: 6,
    name: 'Reece James',
    image: 'https://i.pinimg.com/1200x/7c/85/39/7c8539e01282b4f5d555f9182a4acf44.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/7c/85/39/7c8539e01282b4f5d555f9182a4acf44.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Nyarugenge',
    specialty: 'Photographer',
    categories: ['Fashion', 'Portraits', 'Commercial'],
    rating: 4.9,
    reviews: 167,
    completedJobs: 91,
  },
  {
    id: 7,
    name: 'Levi Colwill',
    image: 'https://i.pinimg.com/736x/e2/a6/5d/e2a65d23bea44eae43bd4c5965e4ff56.jpg',
    bannerImage: 'https://i.pinimg.com/736x/e2/a6/5d/e2a65d23bea44eae43bd4c5965e4ff56.jpg',
    verified: true,
    location: 'Nyanza - Rwanda, Nyanza',
    specialty: 'Videographer',
    categories: ['Events', 'Sports', 'Concerts'],
    rating: 4.7,
    reviews: 92,
    completedJobs: 55,
  },
  {
    id: 8,
    name: 'Aleandro Gernacho',
    image: 'https://i.pinimg.com/1200x/44/1a/bb/441abbf59cee7bf34891180e25f241dd.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/44/1a/bb/441abbf59cee7bf34891180e25f241dd.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Gasabo',
    specialty: 'Photographer',
    categories: ['Commercial', 'Corporate', 'Headshots'],
    rating: 4.8,
    reviews: 118,
    completedJobs: 68,
  },
  {
    id: 9,
    name: 'Marc Cucurella',
    image: 'https://i.pinimg.com/1200x/29/aa/49/29aa4967c90b6694814729ae5786c40c.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/29/aa/49/29aa4967c90b6694814729ae5786c40c.jpg',
    verified: true,
    location: 'Musanze - Rwanda, Musanze',
    specialty: 'Photographer',
    categories: ['Portraits', 'Weddings', 'Lifestyle'],
    rating: 4.9,
    reviews: 145,
    completedJobs: 75,
  },
  {
    id: 10,
    name: 'Axel Disasi',
    image: 'https://i.pinimg.com/1200x/05/8c/26/058c26d6ce2094fa9f47dd4732dc7fbe.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/05/8c/26/058c26d6ce2094fa9f47dd4732dc7fbe.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Kicukiro',
    specialty: 'Videographer',
    categories: ['Weddings', 'Events', 'Engagements'],
    rating: 4.8,
    reviews: 129,
    completedJobs: 62,
  },
  {
    id: 11,
    name: 'Romeo Lavia',
    image: 'https://i.pinimg.com/1200x/d9/71/12/d971127ada9316145eb3bdbf889653d2.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/d9/71/12/d971127ada9316145eb3bdbf889653d2.jpg',
    verified: true,
    location: 'Huye - Rwanda, Huye',
    specialty: 'Photographer',
    categories: ['Fashion', 'Commercial', 'Editorial'],
    rating: 4.9,
    reviews: 178,
    completedJobs: 88,
  },
  {
    id: 12,
    name: 'Robert Sanchez',
    image: 'https://i.pinimg.com/736x/2a/61/2d/2a612dd46f350c345caa4e36a9db9f93.jpg',
    bannerImage: 'https://i.pinimg.com/736x/2a/61/2d/2a612dd46f350c345caa4e36a9db9f93.jpg',
    verified: true,
    location: 'Rubavu - Rwanda, Rubavu',
    specialty: 'Videographer',
    categories: ['Events', 'Portraits', 'Parties'],
    rating: 4.7,
    reviews: 103,
    completedJobs: 59,
  },
  {
    id: 13,
    name: 'James Maddison',
    image: 'https://i.pinimg.com/1200x/44/1a/bb/441abbf59cee7bf34891180e25f241dd.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/44/1a/bb/441abbf59cee7bf34891180e25f241dd.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Gasabo',
    specialty: 'Photographer',
    categories: ['Weddings', 'Lifestyle', 'Portraits'],
    rating: 4.8,
    reviews: 142,
    completedJobs: 73,
  },
  {
    id: 14,
    name: 'Dejan Kulusevski',
    image: 'https://i.pinimg.com/1200x/29/aa/49/29aa4967c90b6694814729ae5786c40c.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/29/aa/49/29aa4967c90b6694814729ae5786c40c.jpg',
    verified: true,
    location: 'Musanze - Rwanda, Musanze',
    specialty: 'Videographer',
    categories: ['Sports', 'Events', 'Action'],
    rating: 4.9,
    reviews: 158,
    completedJobs: 84,
  },
  {
    id: 15,
    name: 'Pape Sarr',
    image: 'https://i.pinimg.com/1200x/7c/85/39/7c8539e01282b4f5d555f9182a4acf44.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/7c/85/39/7c8539e01282b4f5d555f9182a4acf44.jpg',
    verified: true,
    location: 'Huye - Rwanda, Huye',
    specialty: 'Photographer',
    categories: ['Fashion', 'Editorial', 'Portraits'],
    rating: 4.7,
    reviews: 125,
    completedJobs: 67,
  },
  {
    id: 16,
    name: 'Yves Bissouma',
    image: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/8e/5e/69/8e5e6976723a4d5f4e0999a9dd5ac8c6.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Kicukiro',
    specialty: 'Videographer',
    categories: ['Corporate', 'Conferences', 'Commercial'],
    rating: 4.8,
    reviews: 136,
    completedJobs: 71,
  },
  {
    id: 17,
    name: 'Son Heung-min',
    image: 'https://i.pinimg.com/736x/0f/22/d0/0f22d09fadd8a310fa484d1e94c8c55f.jpg',
    bannerImage: 'https://i.pinimg.com/736x/0f/22/d0/0f22d09fadd8a310fa484d1e94c8c55f.jpg',
    verified: true,
    location: 'Rubavu - Rwanda, Rubavu',
    specialty: 'Photographer',
    categories: ['Sports', 'Action', 'Events'],
    rating: 4.9,
    reviews: 189,
    completedJobs: 95,
  },
  {
    id: 18,
    name: 'Cristian Romero',
    image: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    bannerImage: 'https://i.pinimg.com/1200x/84/1b/a6/841ba626d4bb44b8906d8c25400e261f.jpg',
    verified: true,
    location: 'Nyanza - Rwanda, Nyanza',
    specialty: 'Videographer',
    categories: ['Weddings', 'Cinematic', 'Events'],
    rating: 4.8,
    reviews: 147,
    completedJobs: 76,
  },
  {
    id: 19,
    name: 'Guglielmo Vicario',
    image: 'https://i.pinimg.com/736x/e2/a6/5d/e2a65d23bea44eae43bd4c5965e4ff56.jpg',
    bannerImage: 'https://i.pinimg.com/736x/e2/a6/5d/e2a65d23bea44eae43bd4c5965e4ff56.jpg',
    verified: true,
    location: 'Kigali - Rwanda, Nyarugenge',
    specialty: 'Photographer',
    categories: ['Portraits', 'Headshots', 'Professional'],
    rating: 4.7,
    reviews: 114,
    completedJobs: 63,
  },
  {
    id: 20,
    name: 'Destiny Udogie',
    image: 'https://i.pinimg.com/1200x/e9/1f/59/e91f59ed85a702d7252f2b0c8e02c7d2.jpg',
    bannerImage: 'https://i.pinimg.com/736x/8b/89/70/8b8970fb8745252e4d36f60305967d37.jpg',
    verified: true,
    location: 'Musanze - Rwanda, Musanze',
    specialty: 'Videographer',
    categories: ['Music Videos', 'Concerts', 'Entertainment'],
    rating: 4.9,
    reviews: 171,
    completedJobs: 87,
  }
];

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ViewProfileContent(): React.JSX.Element {
  const t = useTranslations('viewProfile');
  const searchParams = useSearchParams();
  const photographerId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('overview');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'profile' | 'cover' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showBookingBanner, setShowBookingBanner] = useState(false);

  // Handle Book Now button click with success banner
  const handleBookNowClick = () => {
    setShowBookingBanner(true);
    setTimeout(() => {
      window.location.href = `/user/photographers/book-now?id=${photographerId}`;
    }, 1500);
  };

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  useEffect(() => {
    // Handle ESC key to close image viewer
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageViewerOpen) {
        closeImageViewer();
      }
    };

    if (imageViewerOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [imageViewerOpen]);

  const openImageViewer = (type: 'profile' | 'cover') => {
    setCurrentImageType(type);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentImageType(null);
  };

  // Get photographer data based on ID or default to first one
  const selectedPhotographer = photographersData.find(p => p.id === Number(photographerId)) || photographersData[0];

  // Sample data for the photographer needed for rendering - now using selected photographer's images
  const photographerData = {
    name: selectedPhotographer.name,
    location: selectedPhotographer.location,
    eventsCompleted: selectedPhotographer.completedJobs,
    rating: selectedPhotographer.rating,
    profileImage: selectedPhotographer.image,
    backgroundImage: selectedPhotographer.bannerImage, 
    about: 'Whether you\'re capturing moments or living them Across Connect brings people together to create something unforgettable',
    specialties: ['Wedding', 'Birthday', 'Other', 'Corporate', 'Portrait', 'Family'],
    equipments: ['Canon EOS R5', 'Sony A7 IV', 'Canon RF 24-70mm f/2.8', 'Canon RF 70-200mm f/2.8', 'Godox AD600Pro', 'DJI Mavic 3 Pro', 'Profoto B10', 'Manfrotto Tripod'],
    portfolio: {
      beliefs: 'I believe in capturing authentic moments that tell genuine stories. Every photograph should evoke emotion and preserve memories that last a lifetime. My approach is to blend creativity with technical excellence to create timeless visual narratives.',
      skills: [
        { name: 'Portrait Photography', level: 95 },
        { name: 'Event Photography', level: 90 },
        { name: 'Photo Editing (Lightroom/Photoshop)', level: 88 },
        { name: 'Studio Lighting', level: 85 },
        { name: 'Drone Photography', level: 75 },
        { name: 'Client Communication', level: 92 },
      ],
      qualifications: [
        {
          id: 1,
          title: 'Professional Photography Certification',
          issuer: 'International Photography Institute',
          year: '2019',
          description: 'Advanced certification in professional photography techniques',
        },
        {
          id: 2,
          title: 'Adobe Certified Professional',
          issuer: 'Adobe Inc.',
          year: '2020',
          description: 'Certification in Photoshop and Lightroom',
        },
        {
          id: 3,
          title: 'Wedding Photography Specialist',
          issuer: 'Professional Photographers Association',
          year: '2021',
          description: 'Specialized training in wedding and event photography',
        },
      ],
      education: [
        {
          id: 1,
          degree: 'Bachelor of Fine Arts in Photography',
          institution: 'Kigali Institute of Arts',
          year: '2015 - 2018',
          description: 'Focused on visual arts, photography techniques, and digital media',
        },
        {
          id: 2,
          degree: 'Diploma in Digital Media',
          institution: 'Rwanda Technical College',
          year: '2013 - 2015',
          description: 'Foundation in digital media production and visual communication',
        },
      ],
      training: [
        'Advanced Wedding Photography Workshop - 2022',
        'Commercial Photography Masterclass - 2021',
        'Lighting Techniques for Professionals - 2020',
        'Portrait Photography Intensive - 2019',
      ],
      projects: [
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=500',
          title: 'Elite Wedding Series 2023',
          description: 'Documented 15+ luxury weddings across Rwanda',
          year: '2023',
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500',
          title: 'Corporate Brand Campaign',
          description: 'Photography for major corporate brand launches',
          year: '2023',
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500',
          title: 'Portrait Collection',
          description: 'Curated portrait series featuring diverse subjects',
          year: '2022',
        },
      ],
    },
    reviews: [
      {
        id: 1,
        name: 'Moise caicedo',
        avatar: 'https://i.pinimg.com/1200x/85/c5/96/85c596eec98acf0645c5c231f3f8b870.jpg',
        rating: 5,
        date: '2024-01-15',
        comment: 'Cole did an amazing job at our wedding! The photos were stunning and he captured every special moment perfectly. Highly recommend!',
      },
      {
        id: 2,
        name: 'Enzo Fernandez',
        avatar: 'https://i.pinimg.com/1200x/85/c5/96/85c596eec98acf0645c5c231f3f8b870.jpg',
        rating: 4,
        date: '2024-01-10',
        comment: 'Great photographer with excellent attention to detail. Very professional and made everyone feel comfortable during the shoot.',
      },
      {
        id: 3,
        name: 'moses Grant',
        avatar: 'https://i.pinimg.com/736x/4a/e1/fc/4ae1fc1554465849a9d897bbc7742024.jpg',
        rating: 5,
        date: '2023-12-28',
        comment: 'Outstanding work! Cole was punctual, creative, and delivered beautiful photos ahead of schedule. Will definitely book again.',
      },
      {
        id: 4,
        name: 'Liam delap',
        avatar: 'https://i.pinimg.com/736x/4a/e1/fc/4ae1fc1554465849a9d897bbc7742024.jpg',
        rating: 4,
        date: '2023-12-15',
        comment: 'Very satisfied with the results. Cole has a great eye for composition and lighting. The edited photos exceeded our expectations.',
      },
    ],
    experience: [
      {
        id: 1,
        position: 'Lead Wedding Photographer',
        company: 'Elegant Moments Photography',
        location: 'Kigali, Rwanda',
        startDate: '2020',
        endDate: 'Present',
        description: 'Specializing in wedding and engagement photography, managing a team of 3 photographers. Handled over 100 weddings with a focus on candid and creative shots.',
      },
      {
        id: 2,
        position: 'Event Photographer',
        company: 'Rwanda Events & Co',
        location: 'Kigali, Rwanda',
        startDate: '2018',
        endDate: '2020',
        description: 'Covered corporate events, conferences, and private celebrations across Rwanda.',
      },
      {
        id: 3,
        position: 'Photography Assistant',
        company: 'Studio Vision',
        location: 'Kigali, Rwanda',
        startDate: '2016',
        endDate: '2018',
        description: 'Assisted senior photographers in various projects and learned advanced photography techniques.',
      },
    ],
  };

  const handleBookNow = () => {
    // Navigate to booking page
    console.log('Book Now clicked');
  };

  const handleStartChat = () => {
    // Navigate to chat page
    console.log('Start Chat clicked');
  };

  const handleReviewSubmit = (review: { name: string; rating: number; comment: string; images: File[] }) => {
    console.log('Review submitted:', review);
    // Here you would typically send the review to your backend API
    // Example: await api.submitReview(photographerId, review);
    alert(`Thank you ${review.name} for your review! It has been submitted successfully.`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i
          key={i}
          className={i <= rating ? 'bi bi-star-fill' : 'bi bi-star'}
          style={{ color: '#FFA500', fontSize: '14px' }}
        ></i>
      );
    }
    return stars;
  };

  return (
    <>
      <AmoriaKNavbar />

      {/* Success Booking Banner */}
      {showBookingBanner && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#10b981',
            color: '#fff',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            animation: 'slideDown 0.4s ease-out',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-check-lg" style={{ fontSize: '20px', fontWeight: 'bold' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>
              Booking Photographer Successfully!
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9 }}>
              Redirecting to package selection...
            </div>
          </div>
          <div
            style={{
              marginLeft: '20px',
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="min-h-screen bg-white" style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in' }}>
        {/* Header Section - Matching Photographers Card Design */}
      <div
        style={{
          position: 'relative',
          margin: isMobile ? '0 clamp(12px, 3vw, 24px)' : '0 24px',
          marginTop: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
        }}
      >
        {/* Banner Container with Border - 50% Taller */}
        <div
          style={{
            position: 'relative',
            height: isMobile ? 'clamp(180px, 35vw, 270px)' : '270px',
            backgroundImage: `url(${photographerData.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: isMobile ? 'clamp(12px, 3vw, 17px)' : '17px',
            border: isMobile ? '2px solid #bab8b8' : '3px solid #bab8b8',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onClick={() => openImageViewer('cover')}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1.01)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {/* Back Button - Glassmorphism */}
          <button
              onClick={(e) => {
                e.stopPropagation();
                window.history.back();
              }}
              style={{
                  position: 'absolute',
                  top: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
                  left: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
                  zIndex: 10,
                  width: isMobile ? 'clamp(36px, 8vw, 40px)' : '40px',
                  height: isMobile ? 'clamp(36px, 8vw, 40px)' : '40px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              aria-label="Go back"
              >
              <i className="bi bi-chevron-left" style={{ fontSize: isMobile ? 'clamp(16px, 4vw, 20px)' : '20px', fontWeight: 'bold' }}></i>
          </button>

          {/* View Full Size Indicator */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 10,
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none',
            }}
          >
            <i className="bi bi-arrows-fullscreen" style={{ fontSize: '14px' }}></i>
            {t('viewFull')}
          </div>

          {/* Overlay - Matching photographers.tsx */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(13, 27, 42, 0.3)',
              borderRadius: '17px',
            }}
          ></div>
        </div>

        {/* Profile Picture Container - Positioned with click to view */}
        <div
          style={{
            position: 'absolute',
            top: isMobile ? 'clamp(150px, 28vw, 230px)' : '230px',
            left: isMobile ? 'clamp(12px, 3vw, 20px)' : '20px',
            width: isMobile ? 'clamp(60px, 12vw, 70px)' : '70px',
            height: isMobile ? 'clamp(60px, 12vw, 70px)' : '70px',
            zIndex: 10,
            cursor: 'pointer',
          }}
          onClick={() => openImageViewer('profile')}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img
              src={photographerData.profileImage}
              alt={photographerData.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid white',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
              loading="lazy"
            />
            {/* Verification Badge - Matching photographers.tsx */}
            <div
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '0px',
                background: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                zIndex: 5,
              }}
            >
              <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
            </div>

            {/* Hover overlay indicator */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s ease',
                pointerEvents: 'none',
              }}
              className="profile-hover-overlay"
            >
              <i className="bi bi-eye view-icon" style={{ color: 'white', fontSize: '20px', opacity: 0, transition: 'opacity 0.3s ease' }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section - White Background with Shadow */}
      <div
        style={{
          backgroundColor: '#fff',
          position: 'relative',
          zIndex: 5,
          paddingBottom: isMobile ? 'clamp(16px, 4vw, 24px)' : '24px',
          marginTop: '0',
          marginRight: isMobile ? 'clamp(12px, 3vw, 24px)' : '24px',
          marginBottom: '0',
          marginLeft: isMobile ? 'clamp(12px, 3vw, 24px)' : '24px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          borderRadius: isMobile ? '0 0 clamp(12px, 3vw, 17px) clamp(12px, 3vw, 17px)' : '0 0 17px 17px',
          border: isMobile ? '2px solid #bab8b8' : '3px solid #bab8b8',
          borderTop: 'none',
        }}
      >
        {/* Profile Content - Hybrid Layout */}
        <div
          style={{
            paddingTop: isMobile ? 'clamp(32px, 7vw, 38px)' : '38px',
            paddingLeft: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
            paddingRight: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
            paddingBottom: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: isMobile ? 'clamp(16px, 4vw, 20px)' : '20px',
          }}
        >
          {/* Left Side - Name, Location, and Stats under profile photo */}
          <div style={{ flex: 1 }}>
            {/* Name */}
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px',
            }}>
              {photographerData.name}
            </h3>

            {/* Location */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#40444d',
              fontSize: '15px',
              marginBottom: '16px',
            }}>
              <i className="bi bi-geo-alt-fill" style={{ fontSize: '15px' }}></i>
              <span>{photographerData.location}</span>
            </div>

            {/* Stats Row */}
            <div style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              marginTop: '12px',
            }}>
              {/* Rating */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <i className="bi bi-star-fill" style={{ color: '#FFA500', fontSize: '16px' }}></i>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#111827',
                }}>
                  {photographerData.rating}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}>
                  Rating
                </span>
              </div>

              {/* Events Completed */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <i className="bi bi-calendar-check-fill" style={{ color: '#083A85', fontSize: '16px' }}></i>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#111827',
                }}>
                  {photographerData.eventsCompleted}+
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  fontWeight: '500',
                }}>
                  {t('events')}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Section - Availability, Working Hours, Starting Price */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '20px' : '72px',
              alignItems: isMobile ? 'flex-start' : 'center',
              flex: isMobile ? 'none' : 2,
              justifyContent: 'flex-start',
              paddingLeft: isMobile ? '0' : '40px',
            }}
          >
            {/* Availability */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#083A85',
                  marginBottom: '4px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                Availability
              </div>
              <div style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                Monday - Sunday
              </div>
            </div>

            {/* Working Hours */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#083A85',
                  marginBottom: '4px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                Working Hours
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="bi bi-clock-fill" style={{ color: '#083A85', fontSize: '14px' }}></i>
                08:00 AM - 11:50 PM
              </div>
            </div>

            {/* Starting Price */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#083A85',
                  marginBottom: '4px',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                Starting Price
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="bi bi-tag-fill" style={{ color: '#10b981', fontSize: '14px' }}></i>
                <span
                  style={{
                    fontSize: '16px',
                    color: '#10b981',
                    fontWeight: '700',
                  }}
                >
                  $200.00 / Event
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Modern Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 'clamp(10px, 2.5vw, 12px)' : '12px',
            alignItems: 'stretch',
            width: isMobile ? '100%' : 'auto',
          }}>
            <button
              onClick={handleBookNowClick}
              disabled={showBookingBanner}
              style={{
                padding: isMobile ? 'clamp(12px, 3vw, 14px) clamp(20px, 5vw, 24px)' : '12px 24px',
                backgroundColor: showBookingBanner ? '#10b981' : '#083A85',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? 'clamp(6px, 1.5vw, 8px)' : '8px',
                fontSize: isMobile ? 'clamp(14px, 3.5vw, 15px)' : '15px',
                fontWeight: '600',
                cursor: showBookingBanner ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? 'clamp(6px, 1.5vw, 8px)' : '8px',
                boxShadow: '0 4px 12px rgba(8, 58, 133, 0.25)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isMobile && !showBookingBanner) {
                  e.currentTarget.style.backgroundColor = '#062d6b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(8, 58, 133, 0.35)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && !showBookingBanner) {
                  e.currentTarget.style.backgroundColor = '#083A85';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                }
              }}
            >
              <i className="bi bi-calendar-check" style={{ fontSize: isMobile ? 'clamp(14px, 3.5vw, 16px)' : '16px' }}></i>
              {showBookingBanner ? 'Booking...' : t('bookNow')}
            </button>

            <button
              onClick={() => (window.location.href = 'https://connekt-dashboard.vercel.app/user/client/inbox')}
              style={{
                padding: isMobile ? 'clamp(12px, 3vw, 14px) clamp(20px, 5vw, 24px)' : '12px 24px',
                backgroundColor: '#fff',
                color: '#083A85',
                border: '2px solid #083A85',
                borderRadius: isMobile ? 'clamp(6px, 1.5vw, 8px)' : '8px',
                fontSize: isMobile ? 'clamp(14px, 3.5vw, 15px)' : '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? 'clamp(6px, 1.5vw, 8px)' : '8px',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <i className="bi bi-chat-dots" style={{ fontSize: isMobile ? 'clamp(14px, 3.5vw, 16px)' : '16px' }}></i>
              {t('startChat')}
            </button>
          </div>
        </div>

        {/* Tabs - Modernized with Better Transitions */}
        <div
          style={{
            display: isMobile ? 'grid' : 'flex',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : undefined,
            backgroundColor: '#f9fafb',
            padding: '0',
            gap: '0',
            overflow: isMobile ? 'visible' : 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
          }}
        >
          {[
            { key: 'overview', label: t('tabs.overview') },
            { key: 'portfolio', label: t('tabs.portfolio') },
            { key: 'reviews', label: t('tabs.reviews') },
            { key: 'working-experience', label: t('tabs.workingExperience') }
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: isMobile ? undefined : 1,
                  padding: isMobile ? 'clamp(12px, 3vw, 16px) clamp(8px, 2vw, 12px)' : '16px 12px',
                  border: 'none',
                  backgroundColor: isActive ? '#fff' : 'transparent',
                  fontSize: isMobile ? 'clamp(13px, 3.2vw, 15px)' : '15px',
                  fontWeight: isActive ? '700' : '600',
                  color: isActive ? '#083A85' : '#6b7280',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderBottom: isActive ? '3px solid #083A85' : '3px solid transparent',
                  position: 'relative',
                  boxShadow: isActive ? '0 2px 8px rgba(8, 58, 133, 0.1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isMobile) {
                    e.currentTarget.style.color = '#083A85';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isMobile) {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area with Gray Background */}
      <div style={{
        backgroundColor: '#f0f4f8',
        padding: isMobile ? 'clamp(16px, 4vw, 24px)' : '24px',
        minHeight: isMobile ? '300px' : '400px'
      }}>
        <div style={{
          padding: isMobile ? 'clamp(20px, 5vw, 32px)' : '32px',
          backgroundColor: '#fff',
          borderRadius: isMobile ? 'clamp(12px, 3vw, 16px)' : '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
        }}>
          {activeTab === 'overview' && (
            <div>
              {/* About Section - Enhanced */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}></div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#000', margin: 0 }}>
                    {t('overview.about')}
                  </h3>
                </div>
                <p style={{
                  fontSize: '16px',
                  color: '#4b5563',
                  lineHeight: '1.8',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '10px',
                  borderLeft: '3px solid #083A85',
                }}>
                  {photographerData.about}
                </p>
              </div>

              {/* Specialties Section - Enhanced with Icons */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}></div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#000', margin: 0 }}>
                    {t('overview.specialties')}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {photographerData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#f0f9ff',
                        border: '2px solid #dbeafe',
                        borderRadius: '25px',
                        fontSize: '15px',
                        color: '#083A85',
                        fontWeight: '600',
                        cursor: 'default',
                        transition: 'all 0.3s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#083A85';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f9ff';
                        e.currentTarget.style.color = '#083A85';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <i className="bi bi-camera-fill" style={{ fontSize: '14px' }}></i>
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Equipments Section - Enhanced Grid Layout */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}></div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#000', margin: 0 }}>
                    {t('overview.equipment')}
                  </h3>
                </div>
                {photographerData.equipments.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile
                      ? 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))'
                      : 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: isMobile ? 'clamp(10px, 2.5vw, 12px)' : '12px'
                  }}>
                    {photographerData.equipments.map((equipment, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '14px 18px',
                          backgroundColor: '#fff',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '15px',
                          color: '#374151',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.3s ease',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#083A85';
                          e.currentTarget.style.backgroundColor = '#f0f9ff';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <i className="bi bi-gear-fill" style={{ color: '#083A85', fontSize: '16px' }}></i>
                        {equipment}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>{t('overview.noEquipment')}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              {/* Professional Beliefs - Enhanced with Quote Design */}
              <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}></div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#000', margin: 0 }}>
                    Professional Philosophy
                  </h3>
                </div>
                <div style={{
                  position: 'relative',
                  padding: '24px 28px',
                  backgroundColor: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderLeft: '4px solid #083A85',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(8, 58, 133, 0.1)',
                }}>
                  <i className="bi bi-quote" style={{
                    position: 'absolute',
                    top: '10px',
                    left: '16px',
                    fontSize: '36px',
                    color: 'rgba(8, 58, 133, 0.15)',
                  }}></i>
                  <p style={{
                    fontSize: '16px',
                    color: '#1e3a8a',
                    lineHeight: '1.8',
                    fontStyle: 'italic',
                    margin: 0,
                    paddingLeft: '20px',
                  }}>
                    "{photographerData.portfolio.beliefs}"
                  </p>
                </div>
              </div>

              {/* Skills - Enhanced with Better Visual Design */}
              <div style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}></div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#000', margin: 0 }}>
                    {t('portfolio.professionalSkills')}
                  </h3>
                </div>
                <div style={{ display: 'grid', gap: '16px' }}>
                  {photographerData.portfolio.skills.map((skill, index) => (
                    <div key={index} style={{
                      padding: '18px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#083A85';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {skill.name}
                        </span>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#fff',
                          backgroundColor: '#036920',
                          padding: '4px 12px',
                          borderRadius: '12px',
                        }}>
                          {skill.level}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        <div
                          style={{
                            width: `${skill.level}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #083A85 0%, #05a332 0%)',
                            borderRadius: '10px',
                            transition: 'width 0.8s ease',
                            boxShadow: '0 0 10px rgba(8, 58, 133, 0.3)',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  {t('portfolio.education')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {photographerData.portfolio.education.map((edu) => (
                    <div
                      key={edu.id}
                      style={{
                        padding: '14px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#000' }}>
                          {edu.degree}
                        </h4>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#083A85', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '4px' }}>
                          {edu.year}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                        {edu.institution}
                      </p>
                      <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>
                        {edu.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualifications & Certifications */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  {t('portfolio.qualifications')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {photographerData.portfolio.qualifications.map((qual) => (
                    <div
                      key={qual.id}
                      style={{
                        padding: '14px',
                        backgroundColor: '#ffffffff',
                        borderRadius: '6px',
                        border: '1px solid #083A85',
                        display: 'flex',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flexShrink: 0, width: '40px', height: '40px', backgroundColor: '#083A85', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-award-fill" style={{ color: '#fff', fontSize: '18px' }}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#000' }}>
                            {qual.title}
                          </h4>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: '#083A85' }}>
                            {qual.year}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#083A85', marginBottom: '4px' }}>
                          {qual.issuer}
                        </p>
                        <p style={{ fontSize: '13px', color: '#083A85', lineHeight: '1.5' }}>
                          {qual.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  Professional Training
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))'
                    : 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: isMobile ? 'clamp(8px, 2vw, 10px)' : '10px'
                }}>
                  {photographerData.portfolio.training.map((training, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#ffffffff',
                        borderRadius: '6px',
                        border: '1px solid #083A85',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <i className="bi bi-check-circle-fill" style={{ color: '#083A85', fontSize: '14px', flexShrink: 0 }}></i>
                      <span style={{ fontSize: '14px', color: '#083A85', fontWeight: '500' }}>
                        {training}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Projects - Modern Card Grid */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#083A85',
                    borderRadius: '2px',
                  }}></div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000', margin: 0 }}>
                    Featured Projects
                  </h3>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))'
                    : 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: isMobile ? 'clamp(16px, 4vw, 20px)' : '20px'
                }}>
                  {photographerData.portfolio.projects.map((project) => (
                    <div
                      key={project.id}
                      style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        backgroundColor: '#fff',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(8, 58, 133, 0.2)';
                        e.currentTarget.style.borderColor = '#083A85';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div style={{ position: 'relative', overflow: 'hidden' }}>
                        <img
                          src={project.image}
                          alt={project.title}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                          }}
                          loading="lazy"
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: '#083A85',
                          color: '#fff',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '700',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        }}>
                          {project.year}
                        </div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#fff' }}>
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#000',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <i className="bi bi-image" style={{ color: '#083A85', fontSize: '16px' }}></i>
                          {project.title}
                        </h4>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          lineHeight: '1.6',
                          margin: 0,
                        }}>
                          {project.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Reviews Summary with Write Review Button - Enhanced */}
              <div style={{
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: '2px solid #e5e7eb',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '20px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '16px',
                    border: '2px solid #dbeafe',
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      minWidth: '100px',
                    }}>
                      <span style={{
                        fontSize: '48px',
                        fontWeight: '700',
                        color: '#083A85',
                        lineHeight: 1,
                      }}>
                        {photographerData.rating.toFixed(1)}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        margin: '8px 0',
                      }}>
                        {renderStars(photographerData.rating)}
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '500',
                        margin: 0,
                      }}>
                        {photographerData.reviews.length} {t('reviews.reviewsCount')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    style={{
                      padding: '14px 28px',
                      backgroundColor: '#083A85',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 4px 12px rgba(8, 58, 133, 0.25)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#062d6b';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(8, 58, 133, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#083A85';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 58, 133, 0.25)';
                    }}
                  >
                    <i className="bi bi-pencil-square" style={{ fontSize: '16px' }}></i>
                    {t('reviews.writeReview')}
                  </button>
                </div>
              </div>

              {/* Individual Reviews - Enhanced Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {photographerData.reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#083A85';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(8, 58, 133, 0.15)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Reviewer Info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      marginBottom: '14px',
                    }}>
                      <img
                        src={review.avatar}
                        alt={review.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid #f0f9ff',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        }}
                        loading="lazy"
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#000',
                          marginBottom: '4px',
                        }}>
                          {review.name}
                        </h4>
                        <p style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: 0,
                        }}>
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 12px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '20px',
                      }}>
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.7',
                      margin: 0,
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '10px',
                    }}>
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'working-experience' && (
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#000', marginBottom: '18px' }}>
                {t('workingExperience.title')}
              </h3>

              {/* Timeline */}
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                {/* Timeline Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    backgroundColor: '#e5e7eb',
                  }}
                ></div>

                {/* Experience Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {photographerData.experience.map((exp, index) => (
                    <div key={exp.id} style={{ position: 'relative' }}>
                      {/* Timeline Dot */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-20px',
                          top: '6px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: index === 0 ? '#083A85' : '#9ca3af',
                          border: '2px solid #fff',
                          boxShadow: '0 0 0 2px #e5e7eb',
                        }}
                      ></div>

                      {/* Experience Card */}
                      <div
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        {/* Position & Company */}
                        <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#000', marginBottom: '4px' }}>
                          {exp.position}
                        </h4>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#083A85', marginBottom: '6px' }}>
                          {exp.company}
                        </p>

                        {/* Location & Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="bi bi-geo-alt" style={{ color: '#6b7280', fontSize: '14px' }}></i>
                            <span style={{ fontSize: '15px', color: '#6b7280' }}>
                              {exp.location}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="bi bi-calendar3" style={{ color: '#6b7280', fontSize: '10px' }}></i>
                            <span style={{ fontSize: '15px', color: '#6b7280' }}>
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Review Modal */}
    <ReviewModal
      isOpen={isReviewModalOpen}
      onClose={() => setIsReviewModalOpen(false)}
      onSubmit={handleReviewSubmit}
      photographerName={photographerData.name}
    />

    {/* Image Viewer Modal */}
    {imageViewerOpen && (
      <div
        className="image-viewer-modal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}
        onClick={closeImageViewer}
      >
        {/* Close Button */}
        <button
          onClick={closeImageViewer}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            zIndex: 10001,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
          aria-label="Close image viewer"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Image Type Label */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '30px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10001,
          }}
        >
          <i className={currentImageType === 'profile' ? 'bi bi-person-circle' : 'bi bi-image'} style={{ fontSize: '18px' }}></i>
          {currentImageType === 'profile' ? 'Profile Photo' : 'Cover Photo'}
        </div>

        {/* Image Container - Full Size */}
        <div
          style={{
            position: 'relative',
            width: currentImageType === 'profile' ? 'auto' : '95vw',
            height: currentImageType === 'profile' ? 'auto' : '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={currentImageType === 'profile' ? photographerData.profileImage : photographerData.backgroundImage}
            alt={currentImageType === 'profile' ? `${photographerData.name} profile` : `${photographerData.name} cover`}
            style={{
              width: currentImageType === 'profile' ? '80vh' : '100%',
              height: currentImageType === 'profile' ? '80vh' : '100%',
              objectFit: currentImageType === 'profile' ? 'cover' : 'contain',
              borderRadius: currentImageType === 'profile' ? '50%' : '0',
              boxShadow: currentImageType === 'profile' ? '0 20px 60px rgba(0, 0, 0, 0.8)' : 'none',
              border: currentImageType === 'profile' ? '6px solid rgba(255, 255, 255, 0.2)' : 'none',
              animation: 'slideInFromLeft 0.4s ease',
            }}
          />
        </div>

        {/* Instructions */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <i className="bi bi-info-circle"></i>
          <span>Press ESC or click outside to close</span>
        </div>
      </div>
    )}

    {/* CSS Animations */}
    <style jsx>{`
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.05);
          opacity: 0.9;
        }
      }

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

      @keyframes slideInFromLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes shimmer {
        0% {
          background-position: -1000px 0;
        }
        100% {
          background-position: 1000px 0;
        }
      }

      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 10px;
      }

      ::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      ::-webkit-scrollbar-thumb {
        background: #083A85;
        border-radius: 5px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #062d6b;
      }

      /* Responsive improvements */
      @media (max-width: 768px) {
        .profile-stats {
          flex-direction: column;
          align-items: flex-start !important;
        }
      }

      @media (max-width: 480px) {
        [style*="gridTemplateColumns"]:not([style*="repeat(2"]) {
          grid-template-columns: 1fr !important;
        }
      }

      /* Focus styles for accessibility */
      button:focus-visible,
      a:focus-visible {
        outline: 3px solid #083A85;
        outline-offset: 2px;
      }

      /* Selection styling */
      ::selection {
        background-color: #083A85;
        color: white;
      }

      /* Profile hover effect */
      .profile-hover-overlay:hover {
        background-color: rgba(0, 0, 0, 0.5) !important;
      }

      .profile-hover-overlay:hover .view-icon {
        opacity: 1 !important;
      }

      /* Prevent body scroll when modal is open */
      body:has(.image-viewer-modal) {
        overflow: hidden;
      }
    `}</style>
    </>
  );
}

// Main page component with Suspense boundary
export default function ViewProfilePage(): React.JSX.Element {
  const t = useTranslations('viewProfile');

  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#083A85'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            <i className="bi bi-hourglass-split"></i>
          </div>
          <p style={{
            fontSize: '18px',
            fontWeight: '600'
          }}>{t('loadingProfile')}</p>
        </div>
      </div>
    }>
      <ViewProfileContent />
    </Suspense>
  );
}