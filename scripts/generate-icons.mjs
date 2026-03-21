// Generate PWA icons from SVG
// Run: node scripts/generate-icons.mjs

import { writeFileSync } from 'fs';

function createPngPlaceholder(size) {
  // Create a minimal valid PNG with the lightning bolt theme
  // For production, use sharp or canvas to render the SVG
  // For now, we'll create a simple colored PNG

  // PNG header + IHDR + minimal IDAT + IEND
  const width = size;
  const height = size;

  // Create canvas-like SVG as data URI for now
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="${Math.round(width * 0.2)}" fill="#0a0f1a"/>
    <text x="${width/2}" y="${height * 0.72}" text-anchor="middle" font-size="${Math.round(width * 0.55)}" fill="#facc15">&#9889;</text>
  </svg>`;

  return svg;
}

// Write SVG icons (browsers accept SVG for PWA icons too)
writeFileSync('public/icon-192.svg', createPngPlaceholder(192));
writeFileSync('public/icon-512.svg', createPngPlaceholder(512));

console.log('Icons generated (SVG format)');
console.log('For PNG icons, use: npx sharp-cli -i public/favicon.svg -o public/icon-192.png resize 192 192');
