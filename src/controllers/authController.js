import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../utils/tokens.js";

function sendUser(res, user, status = 200) {
  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(status).json({ success: true, data: { user } });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.validated.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError("An account with this email already exists", 409);

  const user = await User.create({
    name,
    email,
    phone: phone || "",
    password,
    role,
  });
  sendUser(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }
  sendUser(res, user);
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
