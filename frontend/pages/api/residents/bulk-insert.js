import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4.5mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  try {
    const user = await authenticateToken(req, res);
    if (!user) return;
    
    if (!["admin", "superadmin", "captain", "secretary"].includes(user.role))
      return res.status(403).json({ success: false, message: "Access denied" });

    const tenantId = user.tenant_id || req.headers["x-tenant-id"];
    
    if (!tenantId) {
      return res.status(400).json({ 
        success: false, 
        message: "Tenant ID is required" 
      });
    }
    
    const { residents } = req.body;

    if (!Array.isArray(residents) || residents.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "residents array is required" });

    const insertData = residents.map((r) => ({
      ...r,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    }));
    
    console.log(`Inserting ${insertData.length} residents for tenant: ${tenantId}`);
    
    const { data, error } = await supabase
      .from("residents")
      .insert(insertData)
      .select();
      
    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    console.log(`Successfully inserted ${data.length} residents`);
    return res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${data.length} residents`,
      data, 
      inserted: data.length 
    });
  } catch (error) {
    console.error("Bulk insert error:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error" 
    });
  }
}
