import jwt from "jsonwebtoken";
import { supabase } from "../../lib/supabase";
import { getJwtSecret } from "../../lib/jwtSecret";

const AUTH_USER_CACHE_TTL_MS = 60 * 1000;
const AUTH_USER_CACHE = new Map();

/**
 * Middleware-like helper for Next.js API routes to authenticate JWT tokens
 */
export const authenticateToken = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      });
      return null;
    }

    // Verify the token using the SAME secret as backend
    // Note: On Vercel, you MUST add JWT_SECRET to your Environment Variables
    const jwtSecret = getJwtSecret();
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: "Server configuration error (JWT)",
      });
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret);

    // Short in-memory cache per warm server instance to avoid a `users`
    // lookup on every API request (big Supabase Disk IO saver).
    const cacheKey = String(decoded.userId || "");
    const cached = AUTH_USER_CACHE.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.user;
    }

    // Find the user in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role, tenant_id, status")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
      return null;
    }

    if (user.status !== "active") {
      res.status(401).json({
        success: false,
        message: "Account is not active",
      });
      return null;
    }

    // Clean user object
    const sessionUser = {
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    };

    AUTH_USER_CACHE.set(cacheKey, {
      user: sessionUser,
      expires: Date.now() + AUTH_USER_CACHE_TTL_MS,
    });
    if (AUTH_USER_CACHE.size > 500) {
      const firstKey = AUTH_USER_CACHE.keys().next().value;
      AUTH_USER_CACHE.delete(firstKey);
    }

    return sessionUser;
  } catch (error) {
    console.error("API Auth Error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
    return null;
  }
};
