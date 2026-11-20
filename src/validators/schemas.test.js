import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, propertyBodySchema, registerSchema, searchQuerySchema } from "./schemas.js";

const validProperty = {
  title: "Independent floor with a separate entrance",
  description: "A furnished floor with a private washroom and a clear note about shared areas.",
  propertyType: "complete_floor",
  furnishing: "furnished",
  rent: 18000,
  city: "Bengaluru",
  locality: "Indiranagar",
  location: { type: "Point", coordinates: [77.64, 12.97] },
  shareExactLocation: false,
  privacy: {
    kitchen: "private",
    washroom: "private",
    entrance: "private",
    additionalDetails: "The floor has its own entrance.",
  },
  amenities: { wifi: true },
  photos: [{ url: "/uploads/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg", publicId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg", provider: "local" }],
};

test("registration rejects a weak password and a bad email", () => {
  const result = registerSchema.safeParse({
    body: { name: "Asha", email: "not-an-email", password: "password", role: "tenant" },
  });
  assert.equal(result.success, false);
});

test("registration accepts a tenant with no phone number", () => {
  const result = registerSchema.safeParse({
    body: { name: "Asha Menon", email: "asha@example.com", password: "Password123", role: "tenant" },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.phone, "");
});

test("login requires a valid email", () => {
  const result = loginSchema.safeParse({ body: { email: "asha@example.com", password: "Password123" } });
  assert.equal(result.success, true);
});

test("property payload requires a photo and a map point", () => {
  const missingPhoto = propertyBodySchema.safeParse({ body: { ...validProperty, photos: [] } });
  assert.equal(missingPhoto.success, false);
  const valid = propertyBodySchema.safeParse({ body: validProperty });
  assert.equal(valid.success, true);
  assert.equal(valid.data.body.amenities.wifi, true);
});

test("search requires both coordinates together", () => {
  const result = searchQuerySchema.safeParse({ query: { lat: "12.97", propertyType: "apartment" } });
  assert.equal(result.success, false);
  const ok = searchQuerySchema.safeParse({
    query: { lat: "12.97", lng: "77.64", radius: "10", furnishing: "", page: "1" },
  });
  assert.equal(ok.success, true);
  assert.equal(ok.data.query.radius, 10);
  assert.equal(ok.data.query.furnishing, undefined);
});

import { passwordSchema, searchQuerySchema as _search } from "./schemas.js";

test("search accepts rent range and amenity filters", () => {
  const ok = _search.safeParse({ query: { minRent: "5000", maxRent: "20000", amenities: "wifi,parking" } });
  assert.equal(ok.success, true);
  assert.deepEqual(ok.data.query.amenities, ["wifi", "parking"]);
  assert.equal(ok.data.query.minRent, 5000);
});

test("search rejects inverted rent range and unknown amenities", () => {
  assert.equal(_search.safeParse({ query: { minRent: "30000", maxRent: "1000" } }).success, false);
  assert.equal(_search.safeParse({ query: { amenities: "jacuzzi" } }).success, false);
});

test("password change must differ and be strong", () => {
  assert.equal(passwordSchema.safeParse({ body: { currentPassword: "Password123", newPassword: "Password123" } }).success, false);
  assert.equal(passwordSchema.safeParse({ body: { currentPassword: "Password123", newPassword: "short1" } }).success, false);
  assert.equal(passwordSchema.safeParse({ body: { currentPassword: "Password123", newPassword: "NewPassword456" } }).success, true);
});