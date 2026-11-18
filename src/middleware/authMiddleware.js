import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export function readToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

async function userFromToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
  const user = await User.findById(payload.id);
  if (!user) throw new AppError("Invalid or expired token", 401);
  return user;
}

export async function protect(req, _res, next) {
  try {
    const token = readToken(req);
    if (!token) throw new AppError("Please log in to continue", 401);
    req.user = await userFromToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = readToken(req);
    req.user = token ? await userFromToken(token) : null;
    next();
  } catch {
    req.user = null;
    next();
  }
}
