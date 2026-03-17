/**
 * Public API Exports
 * All public endpoints that don't require authentication
 */

// Categories
export {
  getCategories,
  getCategoryById,
} from './get-categories/route';
export type {
  PhotographerCategory,
  GetCategoriesResponse,
} from './get-categories/route';

// Cities
export {
  getCities,
  getCityById,
  getCitiesByCountry,
} from './get-cities/route';
export type {
  City,
  GetCitiesRequest,
  GetCitiesResponse,
} from './get-cities/route';

// Currencies
export {
  getCurrencies,
} from './get-currencies/route';
export type {
  Currency,
  GetCurrenciesResponse,
} from './get-currencies/route';

// Photographers
export {
  getPhotographers,
  getPhotographerById,
  formatTimeValue,
  getSpecialtyName,
  getReviewerName,
  getReviewText,
  getProjectImage,
} from './get-photographers/route';
export type {
  Photographer,
  PhotographerPackage,
  PhotographerPackageFeature,
  ProfessionalSkill,
  PaginatedPhotographers,
  GetPhotographersRequest,
  Review,
  Availability,
  Project,
  Equipment,
  Education,
  Certification,
  Training,
  WorkExperience,
} from './get-photographers/route';

// Events
export {
  getPublicEvents,
  getPublicEventById,
} from './get-events/route';
export type {
  PublicEvent,
  PaginatedEvents,
  GetPublicEventsRequest,
  EventCategory,
} from './get-events/route';

// Contact Us
export {
  contactUs,
} from './contact-us/route';
export type {
  ContactUsRequest,
  ContactUsResponse,
} from './contact-us/route';

// Public Donations
export {
  createPublicDonation,
} from './donations/route';
export type {
  PublicDonationRequest,
  PublicDonationResponse,
} from './donations/route';

// Newsletter
export {
  newsletterSubscribe,
  newsletterUnsubscribe,
} from './newsletter/route';
export type {
  NewsletterSubscribeRequest,
  NewsletterSubscribeResponse,
  NewsletterUnsubscribeResponse,
} from './newsletter/route';

// FAQs
export {
  getFAQs,
} from './get-faqs/route';
export type {
  FAQ,
  GetFAQsResponse,
} from './get-faqs/route';

// Booked Dates
export {
  getBookedDates,
} from './get-booked-dates/route';
export type {
  BookedDate,
  GetBookedDatesRequest,
} from './get-booked-dates/route';

// Event Types
export {
  getEventTypes,
} from './get-event-types/route';
export type {
  EventType,
  GetEventTypesResponse,
} from './get-event-types/route';

// Donation Tiers
export {
  getDonationTiers,
} from './get-donation-tiers/route';

// Live Currency Rates
export {
  getCurrencyRates,
} from './get-currency-rates/route';
export type {
  CurrencyRate,
  CurrencyRatesResponse,
} from './get-currency-rates/route';
export type {
  DonationTier,
  ExchangeRate,
  DonationTiersResponse,
} from './get-donation-tiers/route';
