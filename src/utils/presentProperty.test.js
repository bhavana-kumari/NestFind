import test from "node:test";
import assert from "node:assert/strict";
import { presentProperty } from "./presentProperty.js";

const property = {
  _id: "507f1f77bcf86cd799439011",
  title: "Quiet floor in Indiranagar",
  location: { type: "Point", coordinates: [77.6408123, 12.9784123] },
  shareExactLocation: false,
  distanceMeters: 842,
  owner: {
    _id: "507f1f77bcf86cd799439012",
    name: "Asha",
    role: "owner",
    email: "asha@example.com",
    phone: "9999999999",
    password: "hashed",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

test("public property responses hide precise coordinates and owner contact details", () => {
  const presented = presentProperty(property, null);
  assert.deepEqual(presented.location.coordinates, [77.641, 12.978]);
  assert.equal(presented.locationApproximate, true);
  assert.equal(presented.distanceKm, 0.8);
  assert.equal(presented.owner.email, undefined);
  assert.equal(presented.owner.phone, undefined);
  assert.equal(presented.owner.password, undefined);
  assert.equal(presented.owner.name, "Asha");
});

test("owners receive the exact pin for their own listing", () => {
  const presented = presentProperty(property, { _id: property.owner._id, role: "owner" });
  assert.deepEqual(presented.location.coordinates, [77.6408123, 12.9784123]);
  assert.equal(presented.locationApproximate, false);
});

test("an owner can choose to share the exact pin publicly", () => {
  const presented = presentProperty({ ...property, shareExactLocation: true }, null);
  assert.deepEqual(presented.location.coordinates, [77.6408123, 12.9784123]);
  assert.equal(presented.locationApproximate, false);
});
