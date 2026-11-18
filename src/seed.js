import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Property from "./models/Property.js";
import User from "./models/User.js";
import Enquiry from "./models/Enquiry.js";
import Favorite from "./models/Favorite.js";

dotenv.config();

const OWNER_EMAIL = "owner@nestfind.local";
const TENANT_EMAIL = "tenant@nestfind.local";
const PASSWORD = "Password123";

const photos = {
  living: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
  bedroom: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80",
  kitchen: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
  window: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
  studio: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
  sofa: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80",
};

function photo(id, url) {
  return { url, publicId: id, provider: "external" };
}

const listings = [
  {
    title: "Furnished floor near Indiranagar",
    description:
      "Development sample. This is not a real listing. A furnished complete floor with a private washroom and a separate entrance, included so local search and maps can be tried.",
    propertyType: "complete_floor",
    furnishing: "furnished",
    rent: 22000,
    city: "Bengaluru",
    locality: "Indiranagar",
    location: { type: "Point", coordinates: [77.6408, 12.9784] },
    privacy: {
      kitchen: "private",
      washroom: "private",
      entrance: "private",
      additionalDetails: "Sample note: the floor is described as independent of the owner's rooms.",
    },
    amenities: { wifi: true, parking: true, waterSupply: true, balcony: true, washingMachine: true },
    photos: [photo("sample-indiranagar-1", photos.living), photo("sample-indiranagar-2", photos.bedroom)],
  },
  {
    title: "Unfurnished apartment in Bandra West",
    description:
      "Development sample. This is not a real listing. An unfurnished apartment for trying city and furnishing filters. The kitchen in this sample is shared.",
    propertyType: "apartment",
    furnishing: "unfurnished",
    rent: 28000,
    city: "Mumbai",
    locality: "Bandra West",
    location: { type: "Point", coordinates: [72.8296, 19.0596] },
    privacy: {
      kitchen: "shared",
      washroom: "private",
      entrance: "shared",
      additionalDetails: "Sample note: the entrance is shared with the building.",
    },
    amenities: { lift: true, waterSupply: true, nearbyMarket: true, publicTransport: true },
    photos: [photo("sample-bandra-1", photos.studio), photo("sample-bandra-2", photos.window)],
  },
  {
    title: "Independent house in Defence Colony",
    description:
      "Development sample. This is not a real listing. An independent house with parking and a private kitchen, placed at a neighbourhood centre for map testing.",
    propertyType: "independent_house",
    furnishing: "furnished",
    rent: 45000,
    city: "New Delhi",
    locality: "Defence Colony",
    location: { type: "Point", coordinates: [77.2294, 28.5726] },
    privacy: {
      kitchen: "private",
      washroom: "private",
      entrance: "private",
      additionalDetails: "",
    },
    amenities: { wifi: true, parking: true, petAllowed: true, airConditioning: true, nearbyPark: true, electricityBackup: true },
    photos: [photo("sample-delhi-1", photos.sofa), photo("sample-delhi-2", photos.kitchen)],
  },
  {
    title: "Compact apartment in Jubilee Hills",
    description:
      "Development sample. This is not a real listing. A furnished apartment used to demonstrate radius search around Hyderabad.",
    propertyType: "apartment",
    furnishing: "furnished",
    rent: 18000,
    city: "Hyderabad",
    locality: "Jubilee Hills",
    location: { type: "Point", coordinates: [78.407, 17.4316] },
    shareExactLocation: true,
    privacy: {
      kitchen: "private",
      washroom: "private",
      entrance: "shared",
      additionalDetails: "Sample note: this listing is marked to show an exact pin.",
    },
    amenities: { wifi: true, lift: true, airConditioning: true, nearbyHospital: true },
    photos: [photo("sample-hyderabad-1", photos.bedroom), photo("sample-hyderabad-2", photos.living)],
  },
];

async function resetUser(email) {
  const user = await User.findOne({ email });
  if (!user) return;
  const properties = await Property.find({ owner: user._id }).select("_id");
  const ids = properties.map((property) => property._id);
  await Promise.all([
    Enquiry.deleteMany({ $or: [{ tenant: user._id }, { owner: user._id }, { property: { $in: ids } }] }),
    Favorite.deleteMany({ $or: [{ user: user._id }, { property: { $in: ids } }] }),
    Property.deleteMany({ owner: user._id }),
  ]);
  await User.deleteOne({ _id: user._id });
}

async function seed() {
  await connectDB();
  await Promise.all([resetUser(OWNER_EMAIL), resetUser(TENANT_EMAIL)]);

  const owner = await User.create({
    name: "Sample Owner",
    email: OWNER_EMAIL,
    phone: "9876543210",
    password: PASSWORD,
    role: "owner",
  });
  await User.create({
    name: "Sample Tenant",
    email: TENANT_EMAIL,
    phone: "",
    password: PASSWORD,
    role: "tenant",
  });

  await Property.create(
    listings.map((listing) => ({
      ...listing,
      shareExactLocation: Boolean(listing.shareExactLocation),
      owner: owner._id,
      availabilityStatus: "available",
      sample: true,
    }))
  );

  console.log("");
  console.log("Sample data created. These listings are fictional and labelled in the app.");
  console.log(`Owner  ${OWNER_EMAIL}  /  ${PASSWORD}`);
  console.log(`Tenant ${TENANT_EMAIL}  /  ${PASSWORD}`);
  console.log("Pins use neighbourhood centres, not street addresses.");
  console.log("");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
