'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AmoriaKNavbar from '../../../components/navbar';
import { useTranslations } from 'next-intl';

// Event data matching the events.tsx page
const eventsData = [
  {
    id: 1,
    title: 'APR BBC Vs Espoir BCC',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80',
    category: 'Sports',
    date: '2025-08-15',
    time: '08:00 AM - 11:50 PM',
    location: 'BK Arena - KN 4 Ave, Kigali',
    status: 'UPCOMING',
    price: '15,000 RWF',
    attendees: 450,
    description: 'Experience the thrill of basketball at its finest! Watch APR BBC take on Espoir BCC in this highly anticipated match. Both teams are known for their exceptional skills and competitive spirit. Join us for an evening of electrifying basketball action, complete with halftime entertainment and amazing fan experiences. Don\'t miss this championship clash that promises to be one of the most exciting games of the season!',
    organizer: 'Rwanda Basketball Federation',
    tags: ['Basketball', 'Championship', 'Live Sports'],
  },
  {
    id: 2,
    title: 'Joseph & Solange Wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
    category: 'Wedding',
    date: '2025-07-20',
    time: '10:00 AM - 06:00 PM',
    location: 'Kigali Serena Hotel - KN 3 Ave, Kigali',
    status: 'LIVE',
    price: '50,000 RWF',
    attendees: 200,
    description: 'Join us in celebrating the union of Joseph and Solange as they embark on their journey of love and commitment. This elegant wedding ceremony will be held at the prestigious Kigali Serena Hotel, featuring a beautiful ceremony followed by a grand reception. Witness the exchange of vows in a romantic setting, enjoy exquisite cuisine, and dance the night away with live music and entertainment. This is a celebration of love, family, and new beginnings.',
    organizer: 'Joseph & Solange',
    tags: ['Wedding', 'Celebration', 'Love'],
  },
  {
    id: 3,
    title: '2021 Graduation Ceremony',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
    category: 'Academic',
    date: '2025-09-10',
    time: '09:00 AM - 02:00 PM',
    location: 'University of Rwanda - KK 737 St, Kigali',
    status: 'UPCOMING',
    price: 'Free',
    attendees: 1500,
    description: 'Celebrate academic excellence as we honor the graduating class of 2021. This momentous occasion marks the culmination of years of hard work, dedication, and perseverance. The ceremony will feature inspiring speeches from distinguished guests, the presentation of degrees across various faculties, and special awards for outstanding achievements. Family and friends are invited to witness this proud moment in the lives of our graduates.',
    organizer: 'University of Rwanda',
    tags: ['Graduation', 'Academic', 'Ceremony'],
  },
  {
    id: 4,
    title: 'Zuba Sisterhood',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80',
    category: 'Gathering',
    date: '2025-08-05',
    time: '03:00 PM - 07:00 PM',
    location: 'Inema Arts Center - KG 518 St, Kigali',
    status: 'LIVE',
    price: '10,000 RWF',
    attendees: 80,
    description: 'An empowering gathering celebrating sisterhood, unity, and women\'s strength. Join us for an afternoon of inspiration, networking, and meaningful connections. This event features panel discussions on women\'s empowerment, entrepreneurship workshops, artistic performances, and opportunities to build lasting friendships. Share stories, gain insights, and be part of a supportive community of amazing women. Together, we rise!',
    organizer: 'Zuba Foundation',
    tags: ['Women', 'Empowerment', 'Networking'],
  },
  {
    id: 5,
    title: 'The Toxxyk Experience',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80',
    category: 'Concert',
    date: '2025-07-20',
    time: '08:00 AM - 11:50 PM',
    location: 'Heza Beach Resort - RBV 187 Ave, Gisenyi',
    status: 'UPCOMING',
    price: '25,000 RWF',
    attendees: 500,
    description: 'Get ready for an unforgettable musical journey with The Toxxyk Experience! This high-energy concert brings together the hottest local and international artists for a day of non-stop entertainment. Enjoy breathtaking performances against the stunning backdrop of Lake Kivu, with multiple stages featuring various music genres. Dance, sing along, and create lasting memories at this premier music festival. Limited tickets available!',
    organizer: 'Toxxyk Entertainment',
    tags: ['Concert', 'Music', 'Festival'],
  },
  {
    id: 6,
    title: 'New Jersey Fashion Week',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80',
    category: 'Fashion',
    date: '2025-10-15',
    time: '06:00 PM - 11:00 PM',
    location: 'Kigali Convention Centre - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '30,000 RWF',
    attendees: 350,
    description: 'Witness the pinnacle of African fashion innovation at New Jersey Fashion Week! This prestigious event showcases the latest collections from renowned and emerging designers. Experience breathtaking runway shows featuring cutting-edge designs, traditional meets contemporary fusion, and sustainable fashion innovations. Network with fashion industry leaders, influencers, and style enthusiasts. This is where creativity meets runway excellence!',
    organizer: 'New Jersey Fashion',
    tags: ['Fashion', 'Runway', 'Design'],
  },
  {
    id: 7,
    title: 'Rebecca Holy Service',
    image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=1200&q=80',
    category: 'Religious',
    date: '2025-07-25',
    time: '10:00 AM - 01:00 PM',
    location: 'Christian Life Assembly - KG 7 Ave, Kigali',
    status: 'UPCOMING',
    price: 'Free',
    attendees: 800,
    description: 'Join us for a powerful spiritual experience at Rebecca Holy Service. This special worship service features inspiring messages, uplifting praise and worship, prayer sessions, and testimonies of faith. Experience the presence of God in a welcoming and vibrant atmosphere. Whether you\'re seeking spiritual renewal, guidance, or simply want to worship with fellow believers, this service offers a transformative experience for all. All are welcome!',
    organizer: 'Christian Life Assembly',
    tags: ['Religious', 'Worship', 'Spiritual'],
  },
  {
    id: 8,
    title: 'Kwita Izina - Gorilla Naming',
    image: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=1200&q=80',
    category: 'Cultural',
    date: '2025-09-05',
    time: '08:00 AM - 05:00 PM',
    location: 'Volcanoes National Park, Musanze',
    status: 'UPCOMING',
    price: '100,000 RWF',
    attendees: 250,
    description: 'Participate in Rwanda\'s most iconic cultural celebration - Kwita Izina! This annual gorilla naming ceremony honors Rwanda\'s commitment to conservation and celebrates new baby gorillas born throughout the year. Experience traditional Rwandan performances, witness the official naming ceremony, enjoy cultural exhibitions, and learn about conservation efforts. This prestigious event attracts global dignitaries and conservation enthusiasts from around the world. Be part of this unique cultural heritage!',
    organizer: 'Rwanda Development Board',
    tags: ['Cultural', 'Conservation', 'Gorillas'],
  },
  {
    id: 9,
    title: 'Pervision Experience',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    category: 'Corporate',
    date: '2025-11-20',
    time: '02:00 PM - 06:00 PM',
    location: 'Radisson Blu Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '40,000 RWF',
    attendees: 150,
    description: 'Transform your business vision at the Pervision Experience! This exclusive corporate summit brings together industry leaders, entrepreneurs, and innovators for an afternoon of strategic insights and networking. Featuring keynote speeches on future business trends, panel discussions on digital transformation, interactive workshops, and valuable networking opportunities. Gain actionable strategies to propel your business forward and connect with like-minded professionals.',
    organizer: 'Pervision Group',
    tags: ['Corporate', 'Business', 'Networking'],
  },
  {
    id: 10,
    title: 'Iwacu Music Festival',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
    category: 'Concert',
    date: '2025-12-10',
    time: '05:00 PM - 11:30 PM',
    location: 'Amahoro Stadium - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '20,000 RWF',
    attendees: 2000,
    description: 'Experience the biggest music festival in Rwanda - Iwacu Music Festival! This mega event features over 20 local and international artists across multiple stages. Enjoy diverse music genres from Afrobeats to traditional Rwandan music, hip-hop, reggae, and more. With food vendors, art installations, and interactive experiences, this festival is the ultimate celebration of African music and culture. Bring your friends and get ready to dance!',
    organizer: 'Iwacu Entertainment',
    tags: ['Music Festival', 'Concert', 'Entertainment'],
  },
  {
    id: 11,
    title: 'Tech Startup Summit',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
    category: 'Conference',
    date: '2025-08-30',
    time: '09:00 AM - 05:00 PM',
    location: 'Norrsken House - KG 17 Ave, Kigali',
    status: 'LIVE',
    price: '35,000 RWF',
    attendees: 300,
    description: 'Join industry leaders and entrepreneurs at the Tech Startup Summit! This premier conference brings together innovators, investors, and tech enthusiasts to explore the latest trends in technology and entrepreneurship. Network with fellow founders, attend insightful workshops, and discover investment opportunities.',
    organizer: 'Norrsken Foundation',
    tags: ['Technology', 'Startup', 'Innovation'],
  },
  {
    id: 12,
    title: 'Rwanda Film Festival',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80',
    category: 'Entertainment',
    date: '2025-07-18',
    time: '06:00 PM - 10:00 PM',
    location: 'Century Cinema - UTC, Kigali',
    status: 'LIVE',
    price: '12,000 RWF',
    attendees: 180,
    description: 'Celebrate African cinema at the Rwanda Film Festival! Watch award-winning films from across the continent, meet talented filmmakers, and participate in Q&A sessions. This festival showcases the best of African storytelling through the lens of cinema.',
    organizer: 'Rwanda Film Commission',
    tags: ['Film', 'Entertainment', 'Cinema'],
  },
  {
    id: 13,
    title: 'Jazz & Wine Evening',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&q=80',
    category: 'Concert',
    date: '2025-08-22',
    time: '07:00 PM - 11:00 PM',
    location: 'Heaven Restaurant - KN 6 Ave, Kigali',
    status: 'UPCOMING',
    price: '25,000 RWF',
    attendees: 120,
    description: 'Unwind with smooth jazz and fine wine at Heaven Restaurant! Enjoy live performances from talented jazz musicians while savoring gourmet cuisine and premium wines. This intimate evening promises relaxation and sophistication.',
    organizer: 'Heaven Restaurant',
    tags: ['Jazz', 'Wine', 'Music'],
  },
  {
    id: 14,
    title: 'Startup Pitch Competition',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80',
    category: 'Conference',
    date: '2025-09-15',
    time: '10:00 AM - 05:00 PM',
    location: 'Impact Hub - KG 9 Ave, Kigali',
    status: 'LIVE',
    price: '20,000 RWF',
    attendees: 200,
    description: 'Watch entrepreneurs pitch their innovative ideas to leading investors! This exciting competition brings together the brightest minds in the startup ecosystem. Network with investors, mentors, and fellow entrepreneurs while witnessing groundbreaking business ideas come to life.',
    organizer: 'Impact Hub Kigali',
    tags: ['Startup', 'Pitch', 'Investment'],
  },
  {
    id: 15,
    title: 'Annual Charity Gala',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80',
    category: 'Corporate',
    date: '2025-10-05',
    time: '06:00 PM - 11:00 PM',
    location: 'Kigali Marriott Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '75,000 RWF',
    attendees: 300,
    description: 'Join us for an elegant evening of giving back! The Annual Charity Gala raises funds for local communities through an evening of fine dining, entertainment, and silent auctions. Make a difference while enjoying world-class hospitality.',
    organizer: 'Charity Foundation Rwanda',
    tags: ['Charity', 'Gala', 'Fundraising'],
  },
  {
    id: 16,
    title: 'Traditional Dance Festival',
    image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1200&q=80',
    category: 'Cultural',
    date: '2025-08-18',
    time: '03:00 PM - 08:00 PM',
    location: 'Kigali Cultural Village - KG 14 Ave, Kigali',
    status: 'LIVE',
    price: '8,000 RWF',
    attendees: 400,
    description: 'Immerse yourself in Rwanda\'s rich cultural heritage! Experience traditional dance performances, learn about ancient customs, and participate in interactive cultural activities. This festival celebrates the vibrant traditions that make Rwanda unique.',
    organizer: 'Ministry of Culture',
    tags: ['Culture', 'Dance', 'Heritage'],
  },
  {
    id: 17,
    title: 'E-Commerce Summit 2025',
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&q=80',
    category: 'Conference',
    date: '2025-11-08',
    time: '08:00 AM - 06:00 PM',
    location: 'Radisson Blu Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '45,000 RWF',
    attendees: 250,
    description: 'Discover the future of online business at the E-Commerce Summit 2025! Learn from industry experts about digital marketing, logistics, payment solutions, and scaling your online business. Perfect for entrepreneurs and business owners.',
    organizer: 'E-Commerce Association Rwanda',
    tags: ['E-Commerce', 'Digital', 'Business'],
  },
  {
    id: 18,
    title: 'Photography Exhibition',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=80',
    category: 'Entertainment',
    date: '2025-09-20',
    time: '10:00 AM - 08:00 PM',
    location: 'Ivuka Arts Center - KG 563 St, Kigali',
    status: 'UPCOMING',
    price: '5,000 RWF',
    attendees: 150,
    description: 'View stunning photography from talented Rwandan artists! This exhibition showcases diverse perspectives on life, culture, and nature through the art of photography. Meet the artists and purchase prints.',
    organizer: 'Ivuka Arts',
    tags: ['Photography', 'Art', 'Exhibition'],
  },
  {
    id: 19,
    title: 'Youth Leadership Forum',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80',
    category: 'Conference',
    date: '2025-10-12',
    time: '09:00 AM - 04:00 PM',
    location: 'Kigali Convention Centre - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: 'Free',
    attendees: 500,
    description: 'Empower the next generation of leaders! The Youth Leadership Forum brings together young people to discuss leadership, career development, and social impact. Attend workshops, hear inspiring speakers, and network with peers.',
    organizer: 'Youth Ministry Rwanda',
    tags: ['Youth', 'Leadership', 'Development'],
  },
  {
    id: 20,
    title: 'International Food Fair',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
    category: 'Entertainment',
    date: '2025-08-28',
    time: '12:00 PM - 09:00 PM',
    location: 'Kigali Heights - KN 4 Ave, Kigali',
    status: 'UPCOMING',
    price: '15,000 RWF',
    attendees: 600,
    description: 'Taste the world at the International Food Fair! Sample cuisines from across the globe, watch cooking demonstrations, and enjoy live entertainment. A perfect event for food lovers and families.',
    organizer: 'Kigali Food Association',
    tags: ['Food', 'International', 'Festival'],
  },
  {
    id: 21,
    title: 'Marathon for Peace',
    image: 'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1532444458054-01a7dd3e9fca?w=1200&q=80',
    category: 'Sports',
    date: '2025-09-25',
    time: '06:00 AM - 12:00 PM',
    location: 'Kigali City Centre - KN 3 Ave, Kigali',
    status: 'LIVE',
    price: '10,000 RWF',
    attendees: 1000,
    description: 'Run for peace and unity! Join thousands of runners in this annual marathon that promotes peace, health, and community. Multiple race categories available for all fitness levels. Register now and be part of this inspiring movement.',
    organizer: 'Rwanda Athletics Federation',
    tags: ['Marathon', 'Sports', 'Peace'],
  },
  {
    id: 22,
    title: 'Classical Music Night',
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&q=80',
    category: 'Concert',
    date: '2025-11-15',
    time: '07:30 PM - 10:30 PM',
    location: 'Kigali Serena Hotel - KN 3 Ave, Kigali',
    status: 'UPCOMING',
    price: '30,000 RWF',
    attendees: 180,
    description: 'Experience the elegance of classical music! Renowned musicians perform timeless masterpieces in an intimate setting. Perfect for classical music enthusiasts and those seeking a sophisticated evening.',
    organizer: 'Kigali Symphony Orchestra',
    tags: ['Classical', 'Music', 'Concert'],
  },
  {
    id: 23,
    title: 'Digital Marketing Bootcamp',
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=1200&q=80',
    category: 'Conference',
    date: '2025-10-20',
    time: '09:00 AM - 05:00 PM',
    location: 'Norrsken House - KG 17 Ave, Kigali',
    status: 'LIVE',
    price: '50,000 RWF',
    attendees: 100,
    description: 'Master digital marketing skills! This intensive bootcamp covers social media marketing, SEO, content creation, analytics, and more. Learn from industry experts and transform your digital marketing strategy.',
    organizer: 'Digital Marketing Academy',
    tags: ['Marketing', 'Digital', 'Training'],
  },
  {
    id: 24,
    title: 'Comedy & Brunch Special',
    image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=500&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1200&q=80',
    category: 'Entertainment',
    date: '2025-08-10',
    time: '11:00 AM - 03:00 PM',
    location: 'The Hut - KG 623 St, Kigali',
    status: 'UPCOMING',
    price: '18,000 RWF',
    attendees: 90,
    description: 'Laugh your way through brunch! Enjoy delicious food while top comedians keep you entertained with hilarious performances. A perfect Sunday activity for friends and family.',
    organizer: 'Comedy Club Kigali',
    tags: ['Comedy', 'Brunch', 'Entertainment'],
  },
];

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ViewEventContent(): React.JSX.Element {
  const t = useTranslations('events.viewEvent');
  const tStatus = useTranslations('events.status');
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'thumbnail' | 'banner' | null>(null);

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

  const openImageViewer = (type: 'thumbnail' | 'banner') => {
    setCurrentImageType(type);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setCurrentImageType(null);
  };

  // Get event data based on ID or default to first one
  const selectedEvent = eventsData.find(e => e.id === Number(eventId)) || eventsData[0];

  return (
    <>
      <AmoriaKNavbar />
      <div className="min-h-screen bg-white" style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in' }}>
        {/* Header Section - Banner Image */}
        <div
          style={{
            position: 'relative',
            margin: '0 24px',
            marginTop: '20px',
          }}
        >
          {/* Banner Container with Border */}
          <div
            style={{
              position: 'relative',
              height: '400px',
              backgroundImage: `url(${selectedEvent.bannerImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '17px',
              border: '3px solid #bab8b8',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => openImageViewer('banner')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.01)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
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
                top: '20px',
                left: '20px',
                zIndex: 10,
                width: '40px',
                height: '40px',
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
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Go back"
            >
              <i className="bi bi-chevron-left" style={{ fontSize: '20px', fontWeight: 'bold' }}></i>
            </button>

            {/* Status Badge - Live or Upcoming */}
            {selectedEvent.status === 'LIVE' ? (
              <div
                className="live-badge"
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'rgba(3, 145, 48, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #10b981',
                  borderRadius: '25px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                <i className="bi bi-camera-video-fill live-badge-icon" style={{ fontSize: '16px' }}></i>
                {tStatus('live')}
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: 'rgba(8, 58, 133, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid #3b82f6',
                  borderRadius: '25px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                }}
              >
                <i className="bi bi-broadcast" style={{ fontSize: '16px' }}></i>
                {tStatus('upcoming')}
              </div>
            )}

            {/* View Full Size Indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
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

            {/* Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(13, 27, 42, 0.3)',
                borderRadius: '17px',
              }}
            ></div>
          </div>
        </div>

        {/* Event Details Section */}
        <div
          style={{
            backgroundColor: '#fff',
            position: 'relative',
            zIndex: 5,
            margin: '0 24px',
            marginTop: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            borderRadius: '17px',
            border: '3px solid #bab8b8',
            padding: '32px',
          }}
        >
          {/* Event Title and Category */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span
                style={{
                  padding: '6px 16px',
                  backgroundColor: '#f0f9ff',
                  color: '#083A85',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  border: '2px solid #dbeafe',
                }}
              >
                {selectedEvent.category}
              </span>
            </div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px',
                lineHeight: '1.2',
              }}
            >
              {selectedEvent.title}
            </h1>
          </div>

          {/* Event Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '32px',
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#083A85',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-calendar-event" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('eventDate')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-clock-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('eventTime')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.time}
                </p>
              </div>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#f97316',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-geo-alt-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('location')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.location}
                </p>
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-tag-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('entryFee')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.price}
                </p>
              </div>
            </div>

            {/* Attendees */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-people-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('expectedAttendees')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.attendees.toLocaleString()} {t('people')}
                </p>
              </div>
            </div>

            {/* Organizer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#06b6d4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-person-badge-fill" style={{ color: '#fff', fontSize: '20px' }}></i>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  {t('organizedBy')}
                </p>
                <p style={{ fontSize: '15px', color: '#111827', fontWeight: '700', margin: 0 }}>
                  {selectedEvent.organizer}
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  backgroundColor: '#083A85',
                  borderRadius: '2px',
                }}
              ></div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {t('aboutThisEvent')}
              </h2>
            </div>
            <p
              style={{
                fontSize: '16px',
                color: '#4b5563',
                lineHeight: '1.8',
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                borderLeft: '4px solid #083A85',
                margin: 0,
              }}
            >
              {selectedEvent.description}
            </p>
          </div>

          {/* Tags Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  backgroundColor: '#083A85',
                  borderRadius: '2px',
                }}
              ></div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {t('eventTags')}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selectedEvent.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#f0f9ff',
                    border: '2px solid #dbeafe',
                    borderRadius: '25px',
                    fontSize: '14px',
                    color: '#083A85',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.3s ease',
                    cursor: 'default',
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
                  <i className="bi bi-hash" style={{ fontSize: '14px' }}></i>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Button */}
          {selectedEvent.status === 'LIVE' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '24px',
                borderTop: '2px solid #e5e7eb',
              }}
            >
              <button
                className="live-stream-button"
                onClick={() => (window.location.href = `/user/events/join-package?id=${selectedEvent.id}`)}
                style={{
                  padding: '16px 40px',
                  backgroundColor: '#039130',
                  color: '#fff',
                  border: '2px solid #10b981',
                  borderRadius: '100px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 15px rgba(3, 145, 48, 0.3)',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#027a28';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#039130';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <i className="bi bi-camera-video-fill live-badge-icon" style={{ fontSize: '15px' }}></i>
                {t('joinLiveStream')}
              </button>
            </div>
          )}
        </div>
      </div>

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
            <i className="bi bi-image" style={{ fontSize: '18px' }}></i>
            {t('eventBanner')}
          </div>

          {/* Image Container */}
          <div
            style={{
              position: 'relative',
              width: '95vw',
              height: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedEvent.bannerImage}
              alt={selectedEvent.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
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
            <span>{t('closeInstructions')}</span>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
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

        @keyframes sound-wave-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 15px rgba(16, 185, 129, 0.7);
          }
          80% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0),
                        0 0 0 16px rgba(16, 185, 129, 0),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 0 0 rgba(16, 185, 129, 0),
                        0 0 10px rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes button-glow-pulse {
          0% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.3),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 6px 20px rgba(3, 145, 48, 0.5),
                        0 0 0 10px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0);
          }
          80% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.4),
                        0 0 0 10px rgba(16, 185, 129, 0),
                        0 0 0 20px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 4px 15px rgba(3, 145, 48, 0.3),
                        0 0 0 0 rgba(16, 185, 129, 0.7),
                        0 0 0 0 rgba(16, 185, 129, 0.5);
          }
        }

        @keyframes border-twinkle {
          0%, 100% {
            border-color: #10b981;
            filter: brightness(1);
          }
          50% {
            border-color: #34d399;
            filter: brightness(1.3);
          }
        }

        .live-badge {
          animation: sound-wave-pulse 0.9s ease-out infinite;
        }

        .live-stream-button {
          animation: button-glow-pulse 1.2s ease-in-out infinite,
                     border-twinkle 1.2s ease-in-out infinite;
        }

        .live-badge-icon {
          animation: icon-pulse 1s ease-in-out infinite;
          display: inline-block;
        }

        @keyframes icon-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.8;
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
      `}</style>
    </>
  );
}

// Loading component
function LoadingFallback() {
  const t = useTranslations('events.viewEvent');
  return (
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
        }}>{t('loadingEventDetails')}</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ViewEventPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ViewEventContent />
    </Suspense>
  );
}
