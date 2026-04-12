import { authenticateToken } from "../../src/lib/api-auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await authenticateToken(req, res);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
        hint: "Please log in first"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
      },
      message: user.tenant_id 
        ? `✅ You are authenticated as ${user.email} with tenant: ${user.tenant_id}`
        : `⚠️ You are authenticated but have NO tenant_id assigned!`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
