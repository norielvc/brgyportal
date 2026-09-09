const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function generateIcons() {
  const iconsDir = path.join(__dirname, "public", "icons");
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Source logo candidates
  const sourceCandidates = [
    path.join(__dirname, "public", "lgu-hub-logo.png"),
    path.join(__dirname, "public", "calumpit.png"),
    path.join(__dirname, "public", "images", "bdlogo.png"),
    path.join(__dirname, "public", "images", "calumpit.png"),
    path.join(__dirname, "public", "logo.png"),
  ];

  let sourcePath = sourceCandidates.find((p) => fs.existsSync(p));
  console.log("Using source image for PWA icons:", sourcePath);

  const iconSizes = [
    { name: "icon-72x72.png", size: 72 },
    { name: "icon-96x96.png", size: 96 },
    { name: "icon-128x128.png", size: 128 },
    { name: "icon-144x144.png", size: 144 },
    { name: "icon-152x152.png", size: 152 },
    { name: "icon-192x192.png", size: 192 },
    { name: "icon-384x384.png", size: 384 },
    { name: "icon-512x512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "favicon-16x16.png", size: 16 },
  ];

  for (const icon of iconSizes) {
    const destPath = path.join(iconsDir, icon.name);
    // Create standard icon on circular/rounded navy background if needed, or resized transparent
    await sharp(sourcePath)
      .resize(icon.size, icon.size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(destPath);
    console.log(`Generated: ${icon.name}`);
  }

  // Generate Maskable Icons (padding with solid brand background #03254c)
  const maskableSizes = [
    { name: "icon-maskable-192x192.png", size: 192 },
    { name: "icon-maskable-512x512.png", size: 512 },
  ];

  for (const maskable of maskableSizes) {
    const destPath = path.join(iconsDir, maskable.name);
    const innerSize = Math.round(maskable.size * 0.75); // 75% inner safe area
    const innerBuffer = await sharp(sourcePath)
      .resize(innerSize, innerSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: maskable.size,
        height: maskable.size,
        channels: 4,
        background: { r: 3, g: 37, b: 76, alpha: 1 }, // #03254c
      },
    })
      .composite([
        {
          input: innerBuffer,
          gravity: "center",
        },
      ])
      .png()
      .toFile(destPath);
    console.log(`Generated Maskable: ${maskable.name}`);
  }

  console.log("All PWA icons successfully generated in public/icons/");
}

generateIcons().catch(console.error);
