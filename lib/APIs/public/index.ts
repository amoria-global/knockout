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
} from './get-photographers/route';
export type {
  Photographer,
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
} from './get-photographers/route';

// Events
export {
  getPublicEvents,
} from './get-events/route';
export type {
  PublicEvent,
  PaginatedEvents,
  GetPublicEventsRequest,
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

// Event Types
export {
  getEventTypes,
} from './get-event-types/route';
export type {
  EventType,
  GetEventTypesResponse,
} from './get-event-types/route';
