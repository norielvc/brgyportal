import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const supabase = getSupabase();
    
    // Find the user in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
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
