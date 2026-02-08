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
