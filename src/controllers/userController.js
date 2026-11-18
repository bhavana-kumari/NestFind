import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.validated.body;
  req.user.name = name;
  req.user.phone = phone || "";
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});
