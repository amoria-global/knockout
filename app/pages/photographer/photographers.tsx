'use client';

import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import { useTranslations } from 'next-intl';

const Photographers: React.FC = () => {
  const t = useTranslations('photographers');
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [bookmarkedPhotographers, setBookmarkedPhotographers] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Mock photographer data
  const featuredPhotographers = [
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
      accuracy: 98,
      responseTime: '2h'
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
      accuracy: 96,
      responseTime: '1h'
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
      accuracy: 95,
      responseTime: '3h'
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
      accuracy: 99,
      responseTime: '1h'
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
      accuracy: 97,
      responseTime: '2h'
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
      accuracy: 98,
      responseTime: '1h'
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
      accuracy: 94,
      responseTime: '2h'
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
      accuracy: 97,
      responseTime: '3h'
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
      accuracy: 98,
      responseTime: '1h'
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
      accuracy: 96,
      responseTime: '2h'
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
      accuracy: 99,
      responseTime: '1h'
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
      accuracy: 95,
      responseTime: '2h'
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
      accuracy: 97,
      responseTime: '2h'
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
      accuracy: 98,
      responseTime: '1h'
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
      accuracy: 96,
      responseTime: '3h'
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
      accuracy: 97,
      responseTime: '2h'
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
      accuracy: 99,
      responseTime: '1h'
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
      accuracy: 97,
      responseTime: '2h'
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
      accuracy: 95,
      responseTime: '3h'
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
      accuracy: 98,
      responseTime: '1h'
    }
  ];

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm);
  };

  const toggleBookmark = (photographerId: number) => {
    setBookmarkedPhotographers(prev =>
      prev.includes(photographerId)
        ? prev.filter(id => id !== photographerId)
        : [...prev, photographerId]
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(featuredPhotographers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPhotographers = featuredPhotographers.slice(indexOfFirstItem, indexOfLastItem);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <style>{`
        .profile-image-container {
          position: absolute;
          top: 105px;
          left: 20px;
          width: 70px;
          height: 70px;
          z-index: 10;
        }
        .verification-badge {
          position: absolute;
          bottom: 0px;
          right: 0px;
          background: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          z-index: 5;
        }
        .card-content-left-align {
          text-align: left;
          padding-top: 38px;
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: 8px;
        }
      `}</style>
      
      <AmoriaKNavbar />

      {/* Hero Section with Search and Filters */}
      <div style={{
        position: 'relative',
        paddingTop: '2.5rem',
        paddingBottom: '2.5rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        overflow: 'hidden',
        marginLeft: '0',
        marginRight: '0',
        marginTop: '0rem'
      }}>
        {/* Background Image with Blur Overlay */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src="https://i.pinimg.com/736x/1b/97/8d/1b978dbaab62a500d6915617c0cc43bb.jpg"
            alt="Photography Background"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'llinear-gradient(135deg, #ec4899 0%, #f97316 50%, #8b5cf6 100%)',
            backdropFilter: 'blur(20px)'
          }}></div>
        </div>

        <div style={{
          position: 'relative',
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem',
            fontFamily: "'Pragati Narrow', sans-serif"
          }}>
            {t('title')}
          </h1>
          <p style={{
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '1.5rem',
            maxWidth: '42rem',
            margin: '0 auto 1.5rem',
            fontFamily: "'Pragati Narrow', sans-serif"
          }}>
            {t('subtitle')}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: '43rem', margin: '0 auto 1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 3rem 0.8rem 1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: '#d4d4d4',
                  color: '#000000'
                }}
              />
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                <i className="bi bi-search"></i>
              </button>
            </div>
          </form>

          {/* Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            maxWidth: '70rem',
            margin: '0 auto'
          }}>
            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.275rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allCategories')}</option>
                <option value="wedding">{t('categories.weddings')}</option>
                <option value="portrait">{t('categories.portraits')}</option>
                <option value="event">{t('categories.events')}</option>
                <option value="commercial">{t('categories.commercial')}</option>
                <option value="fashion">{t('categories.fashion')}</option>
                <option value="product">{t('categories.product')}</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.275rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allLocations')}</option>
                <option value="kigali">Kigali</option>
                <option value="musanze">Musanze</option>
                <option value="huye">Huye</option>
                <option value="rubavu">Rubavu</option>
                <option value="nyanza">Nyanza</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.275rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allPrices')}</option>
                <option value="budget">Budget (Under 50k RWF)</option>
                <option value="moderate">Moderate (50k-150k RWF)</option>
                <option value="premium">Premium (150k-300k RWF)</option>
                <option value="luxury">Luxury (300k+ RWF)</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.275rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">{t('allRatings')}</option>
                <option value="5">⭐ 5 Stars</option>
                <option value="4">⭐ 4+ Stars</option>
                <option value="3">⭐ 3+ Stars</option>
                <option value="2">⭐ 2+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow" style={{ marginTop: '-2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 1rem 4rem 1rem' }}>
          {/* Photographer Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2.5rem 1.5rem'
          }}>
            {currentPhotographers.map((photographer) => {
              const isBookmarked = bookmarkedPhotographers.includes(photographer.id);
              return (
              <div
                key={photographer.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  border: '3px solid #bab8b8',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Banner Header with Image - 40% of card */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  backgroundImage: `url(${photographer.bannerImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderTopLeftRadius: '17px',
                  borderTopRightRadius: '17px',
                  borderBottomRightRadius: '17px',
                  borderBottomLeftRadius: '17px',
                  flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(13, 27, 42, 0.3)',
                    borderTopLeftRadius: '17px',
                    borderBottomRightRadius: '17px',
                    borderBottomLeftRadius: '17px',
                    borderTopRightRadius: '17px'
                  }}></div>
                </div>

                {/* Profile Image Container with Verification Badge */}
                <div className="profile-image-container">
                  <img
                    src={photographer.image}
                    alt={photographer.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '2px solid white',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block'
                    }}
                  />
                  {photographer.verified && (
                    <div className="verification-badge">
                      <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="card-content-left-align">
                  {/* Bookmark Button - Top Right */}
                  <div style={{
                    position: 'absolute',
                    top: '150px',
                    right: '16px',
                    zIndex: 10
                  }}>
                    <button
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #9e9d9d',
                        cursor: 'pointer',
                        padding: '0',
                        color: isBookmarked ? '#3b82f6' : '#6b7280',
                        fontSize: '1.05rem',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onClick={() => toggleBookmark(photographer.id)}
                    >
                      <i className={isBookmarked ? "bi bi-bookmark-fill" : "bi bi-bookmark"}></i>
                    </button>
                  </div>

                  {/* Profile Information */}
                  <div style={{
                    marginBottom: '0.1rem',
                    marginTop: '0px'
                  }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '0.03rem'
                    }}>
                      {photographer.name}
                    </h3>
                    <p style={{
                      color: '#40444d',
                      fontSize: '0.85rem',
                      marginBottom: '0.15rem'
                    }}>
                      {photographer.specialty}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#40444d',
                    fontSize: '0.78rem',
                    marginBottom: '0.3rem'
                  }}>
                    <i className="bi bi-geo-alt-fill" style={{ fontSize: '0.8rem' }}></i>
                    <span>{photographer.location}</span>
                  </div>

                  {/* Service Categories */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '0.3rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.4rem'
                  }}>
                    {photographer.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} style={{
                        backgroundColor: '#f9fafb',
                        color: '#40444d',
                        padding: '0.25rem 0.7rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        border: '0.001px solid #adadad'
                      }}>
                        {cat}
                      </span>
                    ))}
                    {photographer.categories.length > 3 && (
                      <span style={{
                        backgroundColor: '#f9fafb',
                        color: '#6b7280',
                        padding: '0.25rem 0.7rem',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        border: '1px solid #bab8b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        +{photographer.categories.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Performance & Stats */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.3rem 0.2rem',
                    margin: '0.3rem 0 0.35rem 0',
                    borderTop: '1px solid #bab8b8',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.15rem'
                      }}>
                        <i className="bi bi-star-fill" style={{ color: '#000000', fontSize: '0.77rem' }}></i>
                        {photographer.rating}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#40444d', fontWeight: '500' }}>
                        {t('rating')}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.15rem'
                      }}>
                        <i className="bi bi-people-fill" style={{ fontSize: '0.77rem' }}></i>
                        {photographer.completedJobs}+
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#40444d', fontWeight: '500' }}>
                        {t('completedJobs')}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.15rem'
                      }}>
                        <i className="bi bi-clock" style={{ fontSize: '0.77rem' }}></i>
                        {photographer.accuracy}%
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#40444d', fontWeight: '500' }}>
                        {t('accuracy')}
                      </p>
                    </div>
                  </div>

                  {/* Get In Touch Button */}
                  <button
                    style={{
                        width: '100%',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '100px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                        marginTop: '0',
                        letterSpacing: '0.01em'
                    }}
                    onClick={() => window.location.href = `/user/photographers/view-profile?id=${photographer.id}`}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2d2d2d';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.12)';
                    }}
                    >
                    {t('getInTouch')}
                </button>

                </div>
              </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '3rem',
              flexWrap: 'wrap'
            }}>
              {/* Previous Button */}
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #bab8b8',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : '#ffffff',
                  color: currentPage === 1 ? '#9ca3af' : '#111827',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#083A85';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#bab8b8';
                  }
                }}
              >
                <i className="bi bi-chevron-left"></i>
                Previous
              </button>

              {/* Page Numbers */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: currentPage === pageNum ? '2px solid #083A85' : '1px solid #bab8b8',
                      backgroundColor: currentPage === pageNum ? '#083A85' : '#ffffff',
                      color: currentPage === pageNum ? '#ffffff' : '#111827',
                      cursor: 'pointer',
                      fontWeight: currentPage === pageNum ? '600' : '500',
                      fontSize: '0.9rem',
                      minWidth: '2.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#083A85';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#bab8b8';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #bab8b8',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#ffffff',
                  color: currentPage === totalPages ? '#9ca3af' : '#111827',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#083A85';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#bab8b8';
                  }
                }}
              >
                Next
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Photographers;

