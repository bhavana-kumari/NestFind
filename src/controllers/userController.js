import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { setAuthCookie, signToken } from "../utils/tokens.js";

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

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.validated.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 400);
  }
  user.password = newPassword;
  await user.save();
  setAuthCookie(res, signToken(user));
  res.json({ success: true, message: "Password updated" });
});