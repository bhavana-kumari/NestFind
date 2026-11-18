import Favorite from "../models/Favorite.js";
import Property from "../models/Property.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { presentProperty } from "../utils/presentProperty.js";

function assertId(id) {
  if (!/^[a-f\d]{24}$/i.test(id || "")) throw new AppError("Invalid id", 400);
}

export const addFavorite = asyncHandler(async (req, res) => {
  assertId(req.params.propertyId);
  const property = await Property.findById(req.params.propertyId).populate("owner", "name role createdAt");
  if (!property) throw new AppError("Property not found", 404);

  const existing = await Favorite.findOne({ user: req.user._id, property: property._id });
  if (!existing) {
    try {
      await Favorite.create({ user: req.user._id, property: property._id });
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }

  res.status(existing ? 200 : 201).json({
    success: true,
    data: { property: { ...presentProperty(property, req.user), isFavorite: true } },
  });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  assertId(req.params.propertyId);
  const result = await Favorite.deleteOne({ user: req.user._id, property: req.params.propertyId });
  if (!result.deletedCount) throw new AppError("Saved home not found", 404);
  res.json({ success: true, message: "Removed from saved homes" });
});

export const listFavorites = asyncHandler(async (req, res) => {
  const favorites = await Favorite.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate({
      path: "property",
      populate: { path: "owner", select: "name role createdAt" },
    });

  const properties = favorites
    .filter((favorite) => favorite.property)
    .map((favorite) => ({ ...presentProperty(favorite.property, req.user), isFavorite: true }));

  res.json({
    success: true,
    data: { properties, total: properties.length },
  });
});
