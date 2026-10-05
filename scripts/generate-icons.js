/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function makeIconSvg(size, bgColor = '#6843EC', text = 'TT') {
  const fontSize = Math.round(size * 0.38);
  const subSize = Math.round(size * 0.12);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6843EC"/>
      <stop offset="100%" stop-color="#1E90FF"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg)"/>
  <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-weight="900"
    font-size="${fontSize}" fill="white" letter-spacing="-0.02em">${text}</text>
  <text x="50%" y="68%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-weight="600"
    font-size="${subSize}" fill="rgba(255,255,255,0.75)" letter-spacing="0.08em">DIGITAL</text>
</svg>`;
}

function makeShortcutSvg(size, emoji, bgColor = '#6843EC') {
  const iconSize = Math.round(size * 0.5);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6843EC"/>
      <stop offset="100%" stop-color="#1E90FF"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg)"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
    font-size="${iconSize}">${emoji}</text>
</svg>`;
}

async function generate() {
  const tasks = [
    { name: 'icon-192.png', svg: makeIconSvg(192), size: 192 },
    { name: 'icon-512.png', svg: makeIconSvg(512), size: 512 },
    { name: 'dashboard-96.png', svg: makeShortcutSvg(96, '📊'), size: 96 },
    { name: 'reclamations-96.png', svg: makeShortcutSvg(96, '📋'), size: 96 },
    { name: 'factures-96.png', svg: makeShortcutSvg(96, '📄'), size: 96 },
  ];

  for (const t of tasks) {
    const outPath = path.join(iconsDir, t.name);
    await sharp(Buffer.from(t.svg)).resize(t.size, t.size).png().toFile(outPath);
    console.log(`✓ ${t.name} (${t.size}x${t.size})`);
  }
  console.log('All icons generated!');
}

generate().catch(err => { console.error(err); process.exit(1); });
