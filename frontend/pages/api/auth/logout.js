export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  // Next.js API routes are stateless. Logout is handled client-side by removing the token.
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}
