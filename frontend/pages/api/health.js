export default function handler(req, res) {
  // Simple check for ping to keep the Next.js API server warm
  res
    .status(200)
    .json({ status: "ok", timestamp: new Date(), service: "nextjs-api" });
}
