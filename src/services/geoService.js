import { AppError } from "../utils/AppError.js";

const cache = new Map();
const CACHE_MS = 5 * 60 * 1000;

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
  return value;
}

function provider() {
  return (process.env.GEOCODING_PROVIDER || "nominatim").toLowerCase();
}

function baseUrl() {
  return process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";
}

function pickCity(address = {}) {
  return address.city || address.town || address.village || address.municipality || address.state || "";
}

function pickLocality(address = {}) {
  return address.suburb || address.neighbourhood || address.quarter || address.city_district || address.hamlet || "";
}

function toPlace(item) {
  return {
    id: String(item.place_id),
    label: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    city: pickCity(item.address),
    locality: pickLocality(item.address),
  };
}

async function nominatim(pathname, params) {
  const url = new URL(pathname, baseUrl());
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": process.env.GEOCODING_USER_AGENT || "NestFind/1.0 (local development)",
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AppError("Location search is unavailable right now. Pick a point on the map instead.", 502);
  }

  if (response.status === 429) {
    throw new AppError("Location search is busy. Wait a moment or pick a point on the map.", 429);
  }
  if (!response.ok) {
    throw new AppError("Location search failed. Pick a point on the map instead.", 502);
  }
  return response.json();
}

export async function searchLocations(query) {
  const key = `s:${query.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  if (provider() !== "nominatim") {
    throw new AppError(`Geocoding provider "${provider()}" is not supported. Use nominatim or add an adapter.`, 500);
  }

  const results = await nominatim("/search", {
    format: "jsonv2",
    q: query,
    addressdetails: "1",
    limit: "5",
  });

  const places = (Array.isArray(results) ? results : []).map(toPlace).filter((place) => {
    return Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
  });
  return cacheSet(key, places);
}

export async function reverseLocation(latitude, longitude) {
  const key = `r:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  if (provider() !== "nominatim") {
    throw new AppError(`Geocoding provider "${provider()}" is not supported.`, 500);
  }

  const result = await nominatim("/reverse", {
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
  });

  if (result?.error) {
    throw new AppError("No place name was found for that point.", 404);
  }

  return cacheSet(key, toPlace(result));
}
