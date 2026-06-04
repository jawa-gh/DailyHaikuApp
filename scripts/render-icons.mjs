// Renders the SVG masters in assets/icons/ to the PNG paths referenced
// from app.json. Run with: node scripts/render-icons.mjs
//
// Outputs:
//   assets/images/notification-icon.png  — 96×96 Android small notification
//                                          icon (white silhouette, transparent
//                                          background; tinted at runtime via
//                                          the expo-notifications plugin
//                                          `color` field)

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ICONS_DIR = 'assets/icons';
const OUT_DIR = 'assets/images';

const targets = [
  { svg: 'notification-icon.svg', png: 'notification-icon.png', size: 96 },
];

for (const t of targets) {
  const svgPath = path.join(ICONS_DIR, t.svg);
  const pngPath = path.join(OUT_DIR, t.png);
  const svg = await fs.readFile(svgPath);
  await sharp(svg).resize(t.size, t.size).png().toFile(pngPath);
  console.log(`✓ ${pngPath} (${t.size}×${t.size})`);
}
