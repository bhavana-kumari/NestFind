function roundCoord(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function publicOwner(owner) {
  if (!owner || typeof owner !== "object") return owner || null;
  return {
    _id: owner._id,
    name: owner.name,
    role: owner.role,
    createdAt: owner.createdAt,
  };
}

export function presentProperty(property, viewer, extras = {}) {
  const source = typeof property.toObject === "function" ? property.toObject() : { ...property };
  const ownerId = source.owner?._id || source.owner;
  const isOwner = Boolean(viewer && ownerId && String(ownerId) === String(viewer._id));
  const coords = source.location?.coordinates;
  const shareExact = Boolean(source.shareExactLocation);
  let locationApproximate = false;

  if (!isOwner && !shareExact && Array.isArray(coords) && coords.length === 2) {
    locationApproximate = true;
    source.location = {
      type: "Point",
      coordinates: [roundCoord(coords[0]), roundCoord(coords[1])],
    };
  }

  const distanceMeters = extras.distanceMeters ?? source.distanceMeters;
  if (distanceMeters != null && !Number.isNaN(Number(distanceMeters))) {
    source.distanceKm = Math.round((Number(distanceMeters) / 1000) * 10) / 10;
  }

  source.locationApproximate = locationApproximate;
  source.owner = publicOwner(source.owner);
  delete source.password;
  delete source.distanceMeters;
  delete source.__v;
  return source;
}
