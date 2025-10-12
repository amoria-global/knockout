'use client';
import React, { useState } from 'react';
import AmoriaKNavbar from '../../components/navbar';
import Footer from '../../components/footer';
import ReviewModal from '../../components/ReviewModal';

export default function ViewProfilePage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState('overview');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Sample data for the photographer needed for rendering
  const photographerData = {
    name: 'Cole Palmer',
    location: 'Kigali - Rwanda, Gasabo',
    eventsCompleted: 202,
    rating: 3.5,
    profileImage: 'https://i.pinimg.com/1200x/85/c5/96/85c596eec98acf0645c5c231f3f8b870.jpg', 
    backgroundImage: 'https://i.pinimg.com/736x/03/4d/03/034d030d31682594a7d9c59d37ca5c76.jpg', 
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
      <div className="min-h-screen bg-white">
        {/* Header Section with Background Image */}
      <div
        style={{
          position: 'relative',
          height: '190px',
          backgroundImage: `url(${photographerData.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
          }}
        ></div>
      </div>

      {/* Profile Section - White Background */}
      <div
        style={{
          backgroundColor: '#fff',
          position: 'relative',
          zIndex: 5,
          paddingBottom: '20px',
        }}
      >
        {/* Profile Picture, Name, Rating, and Action Buttons */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          {/* Left Side: Profile Picture with Location/Events Info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            {/* Profile Picture with Verification Badge */}
            <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={photographerData.profileImage}
                  alt={photographerData.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
              {/* Verification Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#00BFFF',
                  border: '2.5px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="bi bi-check-lg" style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}></i>
              </div>
            </div>

            {/* Name, Rating, Location, and Events */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Name and Rating */}
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginBottom: '4px' }}>
                  {photographerData.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderStars(photographerData.rating)}
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '2px', fontWeight: '500' }}>
                    {photographerData.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Location and Events Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="bi bi-geo-alt-fill" style={{ color: '#6b7280', fontSize: '11px' }}></i>
                  <span style={{ color: '#4b5563', fontSize: '11px', fontWeight: '400' }}>
                    {photographerData.location}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="bi bi-calendar-check" style={{ color: '#6b7280', fontSize: '11px' }}></i>
                  <span style={{ color: '#4b5563', fontSize: '11px', fontWeight: '400' }}>
                    {photographerData.eventsCompleted} Events Completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => (window.location.href = '/user/book-now')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#083A85',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}
            >
              BOOK NOW
           </button>
            <button
               onClick={() => (window.location.href = '/user/chat')}
              style={{
                padding: '10px 18px',
                backgroundColor: '#083A85',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}
            >
              START A CHAT
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#e5e7eb',
            padding: '0',
            gap: '0',
            margin: '0 24px',
          }}
        >
          {['Overview', 'Portfolio', 'Reviews', 'Working Experience'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
              style={{
                flex: 1,
                padding: '14px 10px',
                border: 'none',
                backgroundColor: activeTab === tab.toLowerCase().replace(' ', '-') ? '#fff' : 'transparent',
                fontSize: '12px',
                fontWeight: '600',
                color: activeTab === tab.toLowerCase().replace(' ', '-') ? '#000' : '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderBottom: activeTab === tab.toLowerCase().replace(' ', '-') ? '2.5px solid #083A85' : 'none',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area with Gray Background */}
      <div style={{ backgroundColor: '#e5e7eb', padding: '24px', minHeight: '400px' }}>
        <div style={{ padding: '28px 24px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {activeTab === 'overview' && (
            <div>
              {/* About Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '10px' }}>
                  About
                </h3>
                <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
                  {photographerData.about}
                </p>
              </div>

              {/* Specialties Section */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '10px' }}>
                  Specialties
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {photographerData.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#374151',
                        fontWeight: '500',
                      }}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Equipments Section */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '10px' }}>
                  Equipments
                </h3>
                {photographerData.equipments.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {photographerData.equipments.map((equipment, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#374151',
                          fontWeight: '500',
                        }}
                      >
                        {equipment}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>No equipment listed</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              {/* Professional Beliefs */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '10px' }}>
                  Professional Philosophy
                </h3>
                <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.7', fontStyle: 'italic', padding: '14px', backgroundColor: '#f0f9ff', borderLeft: '3px solid #083A85', borderRadius: '4px' }}>
                  "{photographerData.portfolio.beliefs}"
                </p>
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  Professional Skills
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {photographerData.portfolio.skills.map((skill, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#374151' }}>
                          {skill.name}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#083A85' }}>
                          {skill.level}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${skill.level}%`,
                            height: '100%',
                            backgroundColor: '#083A85',
                            borderRadius: '10px',
                            transition: 'width 0.3s ease',
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  Education
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
                        <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#000' }}>
                          {edu.degree}
                        </h4>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#083A85', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '4px' }}>
                          {edu.year}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                        {edu.institution}
                      </p>
                      <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.5' }}>
                        {edu.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualifications & Certifications */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  Qualifications & Certifications
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
                          <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#000' }}>
                            {qual.title}
                          </h4>
                          <span style={{ fontSize: '10px', fontWeight: '600', color: '#083A85' }}>
                            {qual.year}
                          </span>
                        </div>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: '#083A85', marginBottom: '4px' }}>
                          {qual.issuer}
                        </p>
                        <p style={{ fontSize: '10px', color: '#083A85', lineHeight: '1.5' }}>
                          {qual.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  Professional Training
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
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
                      <span style={{ fontSize: '11px', color: '#083A85', fontWeight: '500' }}>
                        {training}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 
               */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '14px' }}>
                  Featured Projects
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {photographerData.portfolio.projects.map((project) => (
                    <div
                      key={project.id}
                      style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      <img
                        src={project.image}
                        alt={project.title}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'cover',
                        }}
                      />
                      <div style={{ padding: '12px', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#000' }}>
                            {project.title}
                          </h4>
                          <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>
                            {project.year}
                          </span>
                        </div>
                        <p style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.5' }}>
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
              {/* Reviews Summary with Write Review Button */}
              <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px', fontWeight: '700', color: '#000' }}>
                      {photographerData.rating.toFixed(1)}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                        {renderStars(photographerData.rating)}
                      </div>
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>
                        Based on {photographerData.reviews.length} reviews
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#083A85',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#062d6b';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#083A85';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="bi bi-pencil-square" style={{ fontSize: '14px' }}></i>
                    Write a Review
                  </button>
                </div>
              </div>

              {/* Individual Reviews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {photographerData.reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {/* Reviewer Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <img
                        src={review.avatar}
                        alt={review.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#000', marginBottom: '2px' }}>
                          {review.name}
                        </h4>
                        <p style={{ fontSize: '10px', color: '#6b7280' }}>
                          {new Date(review.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {renderStars(review.rating)}
                      </div>
                    </div>

                    {/* Review Comment */}
                    <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'working-experience' && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#000', marginBottom: '18px' }}>
                Professional Experience
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
                          width: '14px',
                          height: '14px',
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
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#000', marginBottom: '4px' }}>
                          {exp.position}
                        </h4>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#083A85', marginBottom: '6px' }}>
                          {exp.company}
                        </p>

                        {/* Location & Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="bi bi-geo-alt" style={{ color: '#6b7280', fontSize: '10px' }}></i>
                            <span style={{ fontSize: '10px', color: '#6b7280' }}>
                              {exp.location}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="bi bi-calendar3" style={{ color: '#6b7280', fontSize: '10px' }}></i>
                            <span style={{ fontSize: '10px', color: '#6b7280' }}>
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.6' }}>
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
    <Footer />

    {/* Review Modal */}
    <ReviewModal
      isOpen={isReviewModalOpen}
      onClose={() => setIsReviewModalOpen(false)}
      onSubmit={handleReviewSubmit}
      photographerName={photographerData.name}
    />
    </>
  );
}
