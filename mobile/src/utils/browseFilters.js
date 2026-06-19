export const PRICE_MIN = 0;
export const PRICE_MAX = 10000;

export const VEHICLE_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'minibus', label: 'Minibus' },
];

export const TRANSMISSIONS = [
  { value: 'all', label: 'Any' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
];

export const AC_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'yes', label: 'Yes' },
];

export const DRIVER_OPTIONS = [
  { value: 'all', label: 'Any' },
  { value: 'yes', label: 'Yes' },
];

export const DEFAULT_BROWSE_FILTERS = {
  type: 'all',
  transmission: 'all',
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  city: 'all',
  ac: 'all',
  driver: 'all',
};

export function getCityOptions(vehicles = []) {
  const cities = new Set();
  vehicles.forEach((vehicle) => {
    const city = String(vehicle.city || '').trim();
    if (city) cities.add(city);
  });
  return Array.from(cities).sort((a, b) => a.localeCompare(b));
}

function matchesPrice(price, min, max) {
  const value = Number(price);
  if (Number.isNaN(value)) return false;
  return value >= min && value <= max;
}

export function filterVehicles(vehicles, search, filters) {
  const query = search.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
    if (query) {
      const haystack = `${vehicle.make} ${vehicle.model} ${vehicle.city || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.type !== 'all' && vehicle.type !== filters.type) return false;
    if (filters.transmission !== 'all' && vehicle.transmission !== filters.transmission) return false;
    if (!matchesPrice(vehicle.price_per_day, filters.priceMin, filters.priceMax)) return false;
    if (filters.city !== 'all' && (vehicle.city || '') !== filters.city) return false;
    if (filters.ac === 'yes' && !vehicle.ac) return false;
    if (filters.driver === 'yes' && !vehicle.has_driver) return false;

    return true;
  });
}

export function countActiveFilters(filters) {
  let count = 0;
  if (filters.type !== 'all') count += 1;
  if (filters.transmission !== 'all') count += 1;
  if (filters.city !== 'all') count += 1;
  if (filters.ac !== 'all') count += 1;
  if (filters.driver !== 'all') count += 1;
  if (filters.priceMin !== PRICE_MIN || filters.priceMax !== PRICE_MAX) count += 1;
  return count;
}
