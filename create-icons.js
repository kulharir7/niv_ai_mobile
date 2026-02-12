const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');

const sizes = {
  'assets/icon.png': 1024,
  'assets/adaptive-icon.png': 1024,
  'assets/splash.png': 1284,
  'assets/notification-icon.png': 96,
};

for (const [file, size] of Object.entries(sizes)) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  
  // Purple circle
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#8b5cf6';
  ctx.fill();
  
  // "N" letter
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.35}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy + size * 0.02);
  
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(file, buf);
  console.log(`Created ${file} (${size}x${size}, ${buf.length} bytes)`);
}
