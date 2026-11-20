import Favorite from "../models/Favorite.js";
import Property from "../models/Property.js";
import { normalizeAmenities } from "../config/constants.js";
import { AppError } from "../utils/AppError.js";
import { presentProperty } from "../utils/presentProperty.js";
import { assertPhotos } from "../utils/photos.js";
import { deleteImage } from "./uploadService.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function attachFavorites(properties, viewer) {
  if (!viewer || viewer.role !== "tenant" || properties.length === 0) {
    return properties.map((property) => ({ ...property, isFavorite: false }));
  }
  const ids = properties.map((property) => property._id);
  const favorites = await Favorite.find({ user: viewer._id, property: { $in: ids } }).select("property");
  const saved = new Set(favorites.map((favorite) => String(favorite.property)));
  return properties.map((property) => ({
    ...property,
    isFavorite: saved.has(String(property._id)),
  }));
}

function applyableBody(body) {
  return {
    title: body.title,
    description: body.description,
    propertyType: body.propertyType,
    furnishing: body.furnishing,
    rent: body.rent,
    city: body.city,
    locality: body.locality,
    location: {
      type: "Point",
      coordinates: body.location.coordinates,
    },
    shareExactLocation: Boolean(body.shareExactLocation),
    privacy: {
      kitchen: body.privacy.kitchen,
      washroom: body.privacy.washroom,
      entrance: body.privacy.entrance,
      additionalDetails: body.privacy.additionalDetails || "",
    },
    amenities: normalizeAmenities(body.amenities),
    photos: body.photos,
    sample: false,
  };
}

export async function searchProperties(query, viewer) {
  const page = query.page || 1;
  const limit = query.limit || 12;
  const skip = (page - 1) * limit;
  const hasGeo = query.lat !== undefined && query.lng !== undefined;
  const sortKey = query.sort || (hasGeo ? "distance" : "newest");
  const match = { availabilityStatus: "available" };

  if (query.propertyType) match.propertyType = query.propertyType;
  if (query.furnishing) match.furnishing = query.furnishing;
  if (query.minRent !== undefined || query.maxRent !== undefined) {
    match.rent = {};
    if (query.minRent !== undefined) match.rent.$gte = query.minRent;
    if (query.maxRent !== undefined) match.rent.$lte = query.maxRent;
  }
  for (const key of query.amenities || []) match[`amenities.${key}`] = true;

  if (hasGeo) {
    const radiusKm = query.radius || 10;
    const geoNear = {
      near: { type: "Point", coordinates: [query.lng, query.lat] },
      distanceField: "distanceMeters",
      maxDistance: radiusKm * 1000,
      spherical: true,
      query: match,
    };
    const pipeline = [{ $geoNear: geoNear }];
    if (sortKey === "rent_asc") pipeline.push({ $sort: { rent: 1 } });
    else if (sortKey === "rent_desc") pipeline.push({ $sort: { rent: -1 } });
    else if (sortKey === "newest") pipeline.push({ $sort: { createdAt: -1 } });

    const [countRows, rows] = await Promise.all([
      Property.aggregate([{ $geoNear: geoNear }, { $count: "total" }]),
      Property.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
          },
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        { $project: { "owner.password": 0, "owner.email": 0, "owner.phone": 0 } },
      ]),
    ]);

    const total = countRows[0]?.total || 0;
    const presented = rows.map((row) => presentProperty(row, viewer));
    return {
      properties: await attachFavorites(presented, viewer),
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
      radiusKm,
    };
  }

  if (query.location) {
    const safe = escapeRegex(query.location);
    match.$or = [{ city: new RegExp(safe, "i") }, { locality: new RegExp(safe, "i") }];
  }

  const sort =
    sortKey === "rent_asc" ? { rent: 1 } : sortKey === "rent_desc" ? { rent: -1 } : { createdAt: -1 };

  const [total, docs] = await Promise.all([
    Property.countDocuments(match),
    Property.find(match)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("owner", "name role createdAt"),
  ]);

  const presented = docs.map((doc) => presentProperty(doc, viewer));
  return {
    properties: await attachFavorites(presented, viewer),
    page,
    limit,
    total,
    totalPages: total ? Math.ceil(total / limit) : 0,
  };
}

export async function getPropertyById(id, viewer) {
  const property = await Property.findById(id).populate("owner", "name role createdAt");
  if (!property) throw new AppError("Property not found", 404);
  const [presented] = await attachFavorites([presentProperty(property, viewer)], viewer);
  return presented;
}

export async function createProperty(ownerId, body) {
  assertPhotos(body.photos);
  const property = await Property.create({
    ...applyableBody(body),
    owner: ownerId,
    availabilityStatus: "available",
  });
  await property.populate("owner", "name role createdAt");
  return presentProperty(property, { _id: ownerId, role: "owner" });
}

async function ownedProperty(id, ownerId) {
  const property = await Property.findById(id);
  if (!property) throw new AppError("Property not found", 404);
  if (String(property.owner) !== String(ownerId)) {
    throw new AppError("You can only manage your own listings", 403);
  }
  return property;
}

export async function updateProperty(id, ownerId, body) {
  const property = await ownedProperty(id, ownerId);
  assertPhotos(body.photos, property.photos);
  const previous = property.photos.map((photo) => ({ ...photo.toObject() }));
  Object.assign(property, applyableBody(body));
  property.sample = false;
  await property.save();

  const nextIds = new Set(body.photos.map((photo) => photo.publicId));
  await Promise.all(previous.filter((photo) => !nextIds.has(photo.publicId)).map((photo) => deleteImage(photo)));

  await property.populate("owner", "name role createdAt");
  return presentProperty(property, { _id: ownerId, role: "owner" });
}

export async function deleteProperty(id, ownerId) {
  const property = await ownedProperty(id, ownerId);
  const photos = property.photos.map((photo) => ({ ...photo.toObject() }));
  await property.deleteOne();
  await Promise.all(photos.map((photo) => deleteImage(photo)));
}

export async function updatePropertyStatus(id, ownerId, availabilityStatus) {
  const property = await ownedProperty(id, ownerId);
  property.availabilityStatus = availabilityStatus;
  await property.save();
  await property.populate("owner", "name role createdAt");
  return presentProperty(property, { _id: ownerId, role: "owner" });
}

export async function listOwnerProperties(ownerId) {
  const owner = { _id: ownerId, role: "owner" };
  const [properties, total, available] = await Promise.all([
    Property.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(100).populate("owner", "name role createdAt"),
    Property.countDocuments({ owner: ownerId }),
    Property.countDocuments({ owner: ownerId, availabilityStatus: "available" }),
  ]);
  return {
    properties: properties.map((property) => presentProperty(property, owner)),
    total,
    available,
    unavailable: total - available,
  };
}