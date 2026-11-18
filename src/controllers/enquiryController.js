import Enquiry from "../models/Enquiry.js";
import Property from "../models/Property.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function presentEnquiry(enquiry) {
  const source = enquiry.toObject ? enquiry.toObject() : enquiry;
  delete source.__v;
  return source;
}

export const createEnquiry = asyncHandler(async (req, res) => {
  const { propertyId, message } = req.validated.body;
  const property = await Property.findById(propertyId);
  if (!property) throw new AppError("Property not found", 404);
  if (property.availabilityStatus !== "available") {
    throw new AppError("This home is not accepting enquiries right now", 400);
  }
  if (String(property.owner) === String(req.user._id)) {
    throw new AppError("You cannot enquire on your own listing", 400);
  }

  const existing = await Enquiry.findOne({
    tenant: req.user._id,
    property: property._id,
    $or: [{ status: "pending" }, { createdAt: { $gte: new Date(Date.now() - DAY_MS) } }],
  });
  if (existing) {
    throw new AppError(
      "You already contacted this home recently. Wait until the enquiry is closed, or try again after 24 hours.",
      409
    );
  }

  const enquiry = await Enquiry.create({
    tenant: req.user._id,
    property: property._id,
    owner: property.owner,
    message,
    status: "pending",
  });

  res.status(201).json({ success: true, data: { enquiry: presentEnquiry(enquiry) } });
});

export const myEnquiries = asyncHandler(async (req, res) => {
  const [enquiries, total, pending] = await Promise.all([
    Enquiry.find({ tenant: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("property", "title city locality rent photos availabilityStatus"),
    Enquiry.countDocuments({ tenant: req.user._id }),
    Enquiry.countDocuments({ tenant: req.user._id, status: "pending" }),
  ]);
  res.json({
    success: true,
    data: { enquiries: enquiries.map(presentEnquiry), total, pending },
  });
});

export const receivedEnquiries = asyncHandler(async (req, res) => {
  const [enquiries, total, pending] = await Promise.all([
    Enquiry.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("property", "title city locality rent photos availabilityStatus")
      .populate("tenant", "name email phone"),
    Enquiry.countDocuments({ owner: req.user._id }),
    Enquiry.countDocuments({ owner: req.user._id, status: "pending" }),
  ]);
  res.json({
    success: true,
    data: { enquiries: enquiries.map(presentEnquiry), total, pending },
  });
});

export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.validated.params.id);
  if (!enquiry) throw new AppError("Enquiry not found", 404);

  const isOwner = String(enquiry.owner) === String(req.user._id);
  const isTenant = String(enquiry.tenant) === String(req.user._id);
  if (!isOwner && !isTenant) throw new AppError("You do not have access to this enquiry", 403);

  const { status } = req.validated.body;
  if (isTenant && !isOwner && status !== "closed") {
    throw new AppError("You can only close your own enquiry", 403);
  }

  enquiry.status = status;
  await enquiry.save();
  res.json({ success: true, data: { enquiry: presentEnquiry(enquiry) } });
});
