export const PROPERTY_TYPES = ["independent_house", "apartment", "complete_floor"];
export const FURNISHING = ["furnished", "unfurnished"];
export const AVAILABILITY = ["available", "unavailable"];
export const ROLES = ["tenant", "owner"];
export const ENQUIRY_STATUSES = ["pending", "responded", "closed"];

export const KITCHEN_OPTIONS = ["private", "shared", "not_available"];
export const WASHROOM_OPTIONS = ["private", "shared", "not_available"];
export const ENTRANCE_OPTIONS = ["private", "shared", "not_specified"];

export const AMENITY_KEYS = [
  "wifi",
  "parking",
  "petAllowed",
  "nearbyPark",
  "nearbyMarket",
  "nearbyHospital",
  "nearbySchool",
  "publicTransport",
  "waterSupply",
  "electricityBackup",
  "balcony",
  "lift",
  "washingMachine",
  "airConditioning",
];

export const NEARBY_AMENITY_KEYS = [
  "nearbyPark",
  "nearbyMarket",
  "nearbyHospital",
  "nearbySchool",
  "publicTransport",
];

export function emptyAmenities() {
  return Object.fromEntries(AMENITY_KEYS.map((key) => [key, false]));
}

export function normalizeAmenities(input = {}) {
  const amenities = emptyAmenities();
  for (const key of AMENITY_KEYS) {
    amenities[key] = Boolean(input?.[key]);
  }
  return amenities;
}
