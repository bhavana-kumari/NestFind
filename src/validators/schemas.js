import { z } from "zod";
import {
  AMENITY_KEYS,
  ENQUIRY_STATUSES,
  ENTRANCE_OPTIONS,
  FURNISHING,
  KITCHEN_OPTIONS,
  PROPERTY_TYPES,
  ROLES,
  WASHROOM_OPTIONS,
} from "../config/constants.js";

const emptyToUndefined = (value) => (value === "" || value === null || value === undefined ? undefined : value);

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().email("Enter a valid email address").max(160),
    phone: z.string().trim().max(20).optional().default(""),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/[0-9]/, "Password must include a number"),
    role: z.enum(ROLES, { errorMap: () => ({ message: "Choose tenant or owner" }) }),
  }).superRefine((value, ctx) => {
    if (value.phone && !/^[0-9+\-\s()]{7,20}$/.test(value.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number" });
    }
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const profileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
      phone: z
        .string()
        .trim()
        .max(20)
        .optional()
        .or(z.literal(""))
        .transform((value) => value || ""),
    })
    .superRefine((value, ctx) => {
      if (value.phone && !/^[0-9+\-\s()]{7,20}$/.test(value.phone)) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number" });
      }
    }),
});

export const passwordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters")
        .regex(/[A-Za-z]/, "Password must include a letter")
        .regex(/[0-9]/, "Password must include a number"),
    })
    .superRefine((value, ctx) => {
      if (value.currentPassword === value.newPassword) {
        ctx.addIssue({ code: "custom", path: ["newPassword"], message: "New password must be different" });
      }
    }),
});

const amenitySchema = z
  .object(Object.fromEntries(AMENITY_KEYS.map((key) => [key, z.boolean().optional()])))
  .partial();

export const propertyBodySchema = z.object({
  body: z.object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
    description: z.string().trim().min(20, "Description must be at least 20 characters").max(4000),
    propertyType: z.enum(PROPERTY_TYPES, { errorMap: () => ({ message: "Choose a property type" }) }),
    furnishing: z.enum(FURNISHING, { errorMap: () => ({ message: "Choose furnished or unfurnished" }) }),
    rent: z.coerce.number().positive("Monthly rent must be greater than 0").max(10000000),
    city: z.string().trim().min(2, "City is required").max(80),
    locality: z.string().trim().min(2, "Locality is required").max(80),
    location: z.object({
      type: z.literal("Point").default("Point"),
      coordinates: z.tuple([
        z.coerce.number().min(-180).max(180),
        z.coerce.number().min(-90).max(90),
      ]),
    }),
    shareExactLocation: z.boolean().optional().default(false),
    privacy: z.object({
      kitchen: z.enum(KITCHEN_OPTIONS, { errorMap: () => ({ message: "Select a kitchen arrangement" }) }),
      washroom: z.enum(WASHROOM_OPTIONS, { errorMap: () => ({ message: "Select a washroom arrangement" }) }),
      entrance: z.enum(ENTRANCE_OPTIONS, { errorMap: () => ({ message: "Select an entrance arrangement" }) }),
      additionalDetails: z.string().trim().max(1000).optional().default(""),
    }),
    amenities: amenitySchema.optional().default({}),
    photos: z
      .array(
        z.object({
          url: z.string().min(1),
          publicId: z.string().min(1).max(160),
          provider: z.enum(["local", "cloudinary", "external"]),
        })
      )
      .min(1, "Add at least one photo")
      .max(8, "You can add up to 8 photos"),
  }),
});

export const propertyStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    availabilityStatus: z.enum(["available", "unavailable"]),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: objectId }),
});

export const searchQuerySchema = z
  .object({
    query: z.object({
      location: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
      lat: z.preprocess(emptyToUndefined, z.coerce.number().min(-90).max(90).optional()),
      lng: z.preprocess(emptyToUndefined, z.coerce.number().min(-180).max(180).optional()),
      radius: z.preprocess(emptyToUndefined, z.coerce.number().min(1).max(50).optional()),
      propertyType: z.preprocess(emptyToUndefined, z.enum(PROPERTY_TYPES).optional()),
      furnishing: z.preprocess(emptyToUndefined, z.enum(FURNISHING).optional()),
      page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).optional()),
      limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(24).optional()),
      sort: z.preprocess(emptyToUndefined, z.enum(["newest", "rent_asc", "rent_desc", "distance"]).optional()),
      minRent: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
      maxRent: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
      amenities: z.preprocess(
        emptyToUndefined,
        z
          .string()
          .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
          .pipe(z.array(z.enum(AMENITY_KEYS, { errorMap: () => ({ message: "Unknown amenity filter" }) })).max(AMENITY_KEYS.length))
          .optional()
      ),
    }),
  })
  .superRefine((value, ctx) => {
    const { minRent, maxRent } = value.query;
    if (minRent !== undefined && maxRent !== undefined && minRent > maxRent) {
      ctx.addIssue({ code: "custom", path: ["query", "minRent"], message: "Minimum rent cannot exceed maximum rent" });
    }
    const hasLat = value.query.lat !== undefined;
    const hasLng = value.query.lng !== undefined;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: "custom",
        path: ["query", "lat"],
        message: "Both latitude and longitude are required for a map search",
      });
    }
  });

export const enquirySchema = z.object({
  body: z.object({
    propertyId: objectId,
    message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000),
  }),
});

export const enquiryStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    status: z.enum(ENQUIRY_STATUSES),
  }),
});

export const geoSearchSchema = z.object({
  query: z.object({
    q: z.string().trim().min(2, "Enter at least 2 characters").max(120),
  }),
});

export const geoReverseSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  }),
});

export const phoneRefine = (phone) => !phone || /^[0-9+\-\s()]{7,20}$/.test(phone);