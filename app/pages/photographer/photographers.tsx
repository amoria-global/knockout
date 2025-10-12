'use client';

import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import Footer from '../../components/footer';

const Photographers: React.FC = () => {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [bookmarkedPhotographers, setBookmarkedPhotographers] = useState<number[]>([]);

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
      name: 'Sanchez Goalkeeper',
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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f9fafb 0%, #f3f4f6 50%, #e5e7eb 100%)' }}>
      <style>{`
        .profile-image-left {
          position: absolute;
          top: 60px;
          left: 16px;
          transform: translateY(-50%);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: 4px solid white;
          object-fit: cover;
          background-color: #f3f4f6;
        }
        .card-content-left-align {
          text-align: left;
          padding-top: 8px;
          padding-left: 100px;
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
            backgroundColor: 'rgba(8, 58, 133, 0.9)',
            backdropFilter: 'blur(1px)'
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
            Find Your Perfect Photographer
          </h1>
          <p style={{
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '1.5rem',
            maxWidth: '42rem',
            margin: '0 auto 1.5rem',
            fontFamily: "'Pragati Narrow', sans-serif"
          }}>
            Browse through our network of verified professional photographers
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ maxWidth: '48rem', margin: '0 auto 1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search photographers by name, style, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 3rem 1rem 1.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: '#cacacaff',
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
            maxWidth: '60rem',
            margin: '0 auto'
          }}>
            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">All Categories</option>
                <option value="wedding">Wedding</option>
                <option value="portrait">Portrait</option>
                <option value="event">Event</option>
                <option value="commercial">Commercial</option>
                <option value="fashion">Fashion</option>
                <option value="product">Product</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">All Locations</option>
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
                  padding: '0.875rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">All Prices</option>
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
                  padding: '0.875rem 1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111827',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                <option value="all">All Ratings</option>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Section Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(8, 58, 133, 0.1)',
            border: '1px solid rgba(8, 58, 133, 0.08)'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 'bold',
              color: '#083A85',
              marginBottom: '0.5rem',
              fontFamily: "'Pragati Narrow', sans-serif"
            }}>
              Featured Photographers
            </h2>
            <p style={{
              color: '#6B7280',
              fontSize: '1rem',
              fontFamily: "'Pragati Narrow', sans-serif"
            }}>
              Connect with our top-rated professional photographers
            </p>
          </div>

          {/* Photographer Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2.5rem 1.5rem'
          }}>
            {featuredPhotographers.map((photographer) => {
              const isBookmarked = bookmarkedPhotographers.includes(photographer.id);
              return (
              <div
                key={photographer.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #e5e7eb',
                  position: 'relative',
                  paddingTop: '60px',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
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
                {/* Banner Header with Image */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  backgroundImage: `url(${photographer.bannerImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(13, 27, 42, 0.3)',
                    borderTopLeftRadius: '16px',
                    borderTopRightRadius: '16px'
                  }}></div>
                </div>

                {/* Profile Image */}
                <img
                  src={photographer.image}
                  alt={photographer.name}
                  className="profile-image-left"
                />

                {/* Card Content */}
                <div className="card-content-left-align">
                  {/* Profile Information */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.1rem'
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        {photographer.name}
                        {photographer.verified && (
                          <i className="bi bi-patch-check-fill" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                        )}
                      </h3>
                       <p style={{ 
                        color: '#6b7280', 
                        fontSize: '0.875rem'
                      }}>
                        {photographer.specialty}
                      </p>
                    </div>
                     <button 
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        padding: '0',
                        color: isBookmarked ? '#3b82f6' : '#6b7280',
                        fontSize: '1.1rem',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      onClick={() => toggleBookmark(photographer.id)}
                    >
                      <i className={isBookmarked ? "bi bi-bookmark-fill" : "bi bi-bookmark"}></i>
                    </button>
                  </div>
                 
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <i className="bi bi-geo-alt-fill" style={{ fontSize: '0.8rem' }}></i>
                    <span>{photographer.location}</span>
                  </div>

                  {/* Service Categories */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem'
                  }}>
                    {photographer.categories.slice(0, 3).map((cat, i) => (
                      <span key={i} style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        border: '1px solid #e5e7eb'
                      }}>
                        {cat}
                      </span>
                    ))}
                    {photographer.categories.length > 3 && (
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        border: '1px solid #e5e7eb',
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
                    padding: '0.5rem 0',
                    margin: '0.5rem 0',
                    borderTop: '1px solid #e5e7eb',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.1rem'
                      }}>
                        <i className="bi bi-star-fill" style={{ color: '#000000', fontSize: '0.8rem' }}></i>
                        {photographer.rating}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '500' }}>
                        Rating
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.1rem'
                      }}>
                        <i className="bi bi-people-fill" style={{ fontSize: '0.8rem' }}></i>
                        {photographer.completedJobs}+
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '500' }}>
                        Events
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'center',
                        marginBottom: '0.1rem'
                      }}>
                        <i className="bi bi-clock" style={{ fontSize: '0.8rem' }}></i>
                        {photographer.accuracy}%
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '500' }}>
                        Accuracy
                      </p>
                    </div>
                  </div>

                  {/* Get In Touch Button */}
                  <button
                    style={{
                        width: '100%',
                        padding: '0.6rem',
                        backgroundColor: '#000000',
                        color: 'white',
                        border: '2px solid #3b82f6',
                        borderRadius: '9999px',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        marginTop: '0.5rem',
                    }}
                    onClick={() => window.location.href = `/user/view-profile`}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1f2937';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#000000';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    >
                    Get In Touch
                </button>

                </div>
              </div>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Photographers;

