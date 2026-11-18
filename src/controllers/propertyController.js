import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createProperty,
  deleteProperty,
  getPropertyById,
  listOwnerProperties,
  searchProperties,
  updateProperty,
  updatePropertyStatus,
} from "../services/propertyService.js";

export const listProperties = asyncHandler(async (req, res) => {
  const data = await searchProperties(req.validated.query, req.user);
  res.json({ success: true, data });
});

export const getProperty = asyncHandler(async (req, res) => {
  const property = await getPropertyById(req.validated.params.id, req.user);
  res.json({ success: true, data: { property } });
});

export const addProperty = asyncHandler(async (req, res) => {
  const property = await createProperty(req.user._id, req.validated.body);
  res.status(201).json({ success: true, data: { property } });
});

export const editProperty = asyncHandler(async (req, res) => {
  const property = await updateProperty(req.validated.params.id, req.user._id, req.validated.body);
  res.json({ success: true, data: { property } });
});

export const removeProperty = asyncHandler(async (req, res) => {
  await deleteProperty(req.validated.params.id, req.user._id);
  res.json({ success: true, message: "Listing deleted" });
});

export const myListings = asyncHandler(async (req, res) => {
  const data = await listOwnerProperties(req.user._id);
  res.json({ success: true, data });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const property = await updatePropertyStatus(
    req.validated.params.id,
    req.user._id,
    req.validated.body.availabilityStatus
  );
  res.json({ success: true, data: { property } });
});
