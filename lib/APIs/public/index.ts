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
