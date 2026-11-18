import { asyncHandler } from "../utils/asyncHandler.js";
import { reverseLocation, searchLocations } from "../services/geoService.js";

export const searchGeo = asyncHandler(async (req, res) => {
  const places = await searchLocations(req.validated.query.q);
  res.json({ success: true, data: { places } });
});

export const reverseGeo = asyncHandler(async (req, res) => {
  const place = await reverseLocation(req.validated.query.lat, req.validated.query.lng);
  res.json({ success: true, data: { place } });
});
