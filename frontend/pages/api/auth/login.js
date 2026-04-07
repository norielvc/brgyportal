import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    // 1. Search for the user globally by email
    console.log(`Login attempt for email: ${email}`);
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError || !user) {
      console.log("Supabase fetch error or user not found:", fetchError);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password (User not found)",
      });
    }

    console.log("User found, checking status:", user.status);
    // 2. Check if account is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is not active. Please contact administrator.",
      });
    }

    // 3. Check password using bcrypt
    console.log("Verifying password with bcrypt...");
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password (Password mismatch)",
      });
    }

    // 4. Update last login
    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1,
      })
      .eq("id", user.id);

    // 5. Generate token (Same secret used across all services)
    if (!process.env.JWT_SECRET) {
      console.error(
        "CRITICAL: JWT_SECRET is missing from environment variables!",
      );
      return res
        .status(500)
        .json({ success: false, message: "Server configuration error (JWT)" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    // 6. Prepare user response
    const userResponse = {
      id: user.id,
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      tenant_id: user.tenant_id,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
        expiresIn: process.env.JWT_EXPIRE || "7d",
      },
    });
  } catch (error) {
    console.error("API Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
