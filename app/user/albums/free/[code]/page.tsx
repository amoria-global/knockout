'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/navbar';
import FreeAlbumEmailForm from '@/app/components/FreeAlbumEmailForm';
import FreeAlbumOTPForm from '@/app/components/FreeAlbumOTPForm';
import { requestFreeAlbumAccess } from '@/lib/APIs/public/request-free-access/route';
import { verifyFreeAlbumAccess } from '@/lib/APIs/public/verify-free-access/route';
import { getFreeAlbum, type FreeAlbumData } from '@/lib/APIs/public/get-free-album/route';

type ViewState = 'email' | 'otp' | 'album';

const FreeAlbumAccessPage = () => {
  const params = useParams();
  const router = useRouter();
  const accessCode = params.code as string;

  // View state
  const [currentView, setCurrentView] = useState<ViewState>('email');
  const [email, setEmail] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [otpExpiry, setOtpExpiry] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [albumData, setAlbumData] = useState<FreeAlbumData | null>(null);

  // Loading & Error states
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingOTP, setIsLoadingOTP] = useState(false);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [albumError, setAlbumError] = useState('');

  // Photo viewer
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!accessCode) {
      router.push('/user/find-my-photos');
    }
  }, [accessCode, router]);

  const handleEmailSubmit = async (enteredEmail: string) => {
    setIsLoadingEmail(true);
    setEmailError('');

    try {
      const response = await requestFreeAlbumAccess(accessCode, enteredEmail);

      if (response.success && response.data) {
        setEmail(enteredEmail);
        setCustomerId(response.data.customerId);
        setOtpExpiry(response.data.otpExpiry);
        setCurrentView('otp');
      } else {
        setEmailError(response.error || 'Failed to send verification code. Please try again.');
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'An error occurred. Please try again.');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleOTPSubmit = async (otp: string) => {
    setIsLoadingOTP(true);
    setOtpError('');

    try {
      const response = await verifyFreeAlbumAccess(accessCode, email, otp);

      if (response.success && response.data) {
        setAlbumId(response.data.albumId);

        // No need to store token - session cookie is set automatically by backend
        // Browser will send cookie with subsequent requests

        // Load album data (no token needed)
        await loadAlbumData(response.data.albumId);
        setCurrentView('album');
      } else {
        setOtpError(response.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoadingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    return handleEmailSubmit(email);
  };

  const loadAlbumData = async (albumIdToLoad: string) => {
    setIsLoadingAlbum(true);
    setAlbumError('');

    try {
      // No token needed - browser sends session cookie automatically
      const response = await getFreeAlbum(albumIdToLoad);

      if (response.success && response.data) {
        setAlbumData(response.data);
      } else {
        setAlbumError(response.error || 'Failed to load album. Please try again.');
      }
    } catch (error) {
      setAlbumError(error instanceof Error ? error.message : 'An error occurred while loading the album.');
    } finally {
      setIsLoadingAlbum(false);
    }
  };

  const handlePhotoDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDownload = () => {
    if (!albumData) return;
    albumData.photos.forEach((photo, index) => {
      setTimeout(() => {
        handlePhotoDownload(photo.url, `photo-${index + 1}.jpg`);
      }, index * 500); // Stagger downloads to avoid browser blocking
    });
  };

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null || !albumData) return;

    if (direction === 'prev') {
      setSelectedPhotoIndex((prev) =>
        prev === null || prev === 0 ? albumData.photos.length - 1 : prev - 1
      );
    } else {
      setSelectedPhotoIndex((prev) =>
        prev === null || prev === albumData.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Email View */}
        {currentView === 'email' && (
          <div className="max-w-2xl mx-auto mt-12">
            <FreeAlbumEmailForm
              accessCode={accessCode}
              onSubmit={handleEmailSubmit}
              isLoading={isLoadingEmail}
              error={emailError}
            />
          </div>
        )}

        {/* OTP View */}
        {currentView === 'otp' && (
          <div className="max-w-2xl mx-auto mt-12">
            <FreeAlbumOTPForm
              email={email}
              accessCode={accessCode}
              onSubmit={handleOTPSubmit}
              onResend={handleResendOTP}
              isLoading={isLoadingOTP}
              error={otpError}
              otpExpiry={otpExpiry}
            />
          </div>
        )}

        {/* Album View */}
        {currentView === 'album' && (
          <div className="max-w-7xl mx-auto">
            {isLoadingAlbum ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <svg
                    className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-gray-600">Loading your photos...</p>
                </div>
              </div>
            ) : albumError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="text-red-700 text-center">{albumError}</p>
              </div>
            ) : albumData ? (
              <>
                {/* Album Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{albumData.title}</h1>
                      {albumData.description && (
                        <p className="text-gray-600 mb-3">{albumData.description}</p>
                      )}
                      {albumData.photographerName && (
                        <p className="text-sm text-gray-500">
                          By <span className="font-medium">{albumData.photographerName}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {albumData.photoCount} photo{albumData.photoCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={handleBulkDownload}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Download All Photos
                    </button>
                  </div>

                  {albumData.expiresAt && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⏰ This album expires on{' '}
                        {new Date(albumData.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albumData.photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition"
                      onClick={() => openPhotoViewer(index)}
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.caption || `Photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhotoIndex !== null && albumData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closePhotoViewer}
        >
          <button
            onClick={closePhotoViewer}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigatePhoto('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigatePhoto('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={albumData.photos[selectedPhotoIndex].url}
              alt={albumData.photos[selectedPhotoIndex].caption || `Photo ${selectedPhotoIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <button
                onClick={() =>
                  handlePhotoDownload(
                    albumData.photos[selectedPhotoIndex].url,
                    `photo-${selectedPhotoIndex + 1}.jpg`
                  )
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Download Photo
              </button>
              <p className="text-white text-sm mt-2">
                Photo {selectedPhotoIndex + 1} of {albumData.photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeAlbumAccessPage;
