import mongoose from "mongoose";
import { AMENITY_KEYS, emptyAmenities } from "../config/constants.js";

const amenityShape = Object.fromEntries(AMENITY_KEYS.map((key) => [key, { type: Boolean, default: false }]));

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    provider: { type: String, enum: ["local", "cloudinary", "external"], required: true },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 4000 },
    propertyType: {
      type: String,
      enum: ["independent_house", "apartment", "complete_floor"],
      required: true,
    },
    furnishing: { type: String, enum: ["furnished", "unfurnished"], required: true },
    rent: { type: Number, required: true, min: 1, max: 10000000 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    locality: { type: String, required: true, trim: true, maxlength: 80 },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) =>
            Array.isArray(value) &&
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90,
          message: "Location must be [longitude, latitude]",
        },
      },
    },
    shareExactLocation: { type: Boolean, default: false },
    privacy: {
      kitchen: { type: String, enum: ["private", "shared", "not_available"], required: true },
      washroom: { type: String, enum: ["private", "shared", "not_available"], required: true },
      entrance: { type: String, enum: ["private", "shared", "not_specified"], required: true },
      additionalDetails: { type: String, trim: true, maxlength: 1000, default: "" },
    },
    amenities: { type: amenityShape, default: emptyAmenities },
    photos: { type: [photoSchema], validate: [(value) => value.length >= 1 && value.length <= 8, "Add between 1 and 8 photos"] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    availabilityStatus: { type: String, enum: ["available", "unavailable"], default: "available" },
    sample: { type: Boolean, default: false },
  },
  { timestamps: true }
);

propertySchema.index({ location: "2dsphere" });
propertySchema.index({ city: 1, locality: 1 });
propertySchema.index({ owner: 1, createdAt: -1 });
propertySchema.index({ availabilityStatus: 1, createdAt: -1 });

export default mongoose.model("Property", propertySchema);
