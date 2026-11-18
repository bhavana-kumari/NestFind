import jwt from "jsonwebtoken";
import { AppError } from "./AppError.js";

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  return jwt.sign({ id: user._id.toString(), role: user.role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function cookieOptions() {
  const sameSite = process.env.COOKIE_SAMESITE || "lax";
  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function setAuthCookie(res, token) {
  res.cookie("token", token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie("token", cookieOptions());
}
