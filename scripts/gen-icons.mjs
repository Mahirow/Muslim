// ============================================================
//  gen-icons.mjs — generates Noor PWA icons as real PNGs
//  Pure Node (zlib only) — no dependencies. Run: node scripts/gen-icons.mjs
//  Design: emerald rounded-square, gold crescent + star (matches favicon)
// ============================================================
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');
mkdirSync(OUT, { recursive: true });

/* ---------------- minimal PNG encoder ---------------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = rgba(x, y);
      const o = y * stride + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------- drawing helpers ---------------- */
const lerp = (a, b, t) => a + (b - a) * t;
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function inStar(x, y, cx, cy, outer, inner) {
  // 5-point star as 10-vertex polygon (point up), ray-cast test
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// rounded-square test
function inRounded(x, y, pad, rad) {
  if (x < pad || x > 1 - pad || y < pad || y > 1 - pad) return false;
  const cx = Math.min(Math.max(x, pad + rad), 1 - pad - rad);
  const cy = Math.min(Math.max(y, pad + rad), 1 - pad - rad);
  return (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad;
}

function makeDraw({ maskable }) {
  return (px, py) => {
    const x = px / 512;
    const y = py / 512;
    // art scale for maskable safe zone (content within central ~70%)
    const s = maskable ? 0.74 : 0.92;
    const ox = (1 - s) / 2;
    const ax = ox + x * s;
    const ay = ox + y * s;

    // background rounded square (maskable keeps full bleed square)
    const inBg = maskable ? true : inRounded(ax, ay, 0.02, 0.2);
    if (!inBg) return [0, 0, 0, 0];

    const gradTop = [5, 91, 63]; // #065f46
    const gradBot = [2, 44, 34]; // #022c22
    let r = lerp(gradTop[0], gradBot[0], y);
    let g = lerp(gradTop[1], gradBot[1], y);
    let b = lerp(gradTop[2], gradBot[2], y);

    // gold crescent (outer circle minus offset circle) + star
    const gold = [251, 191, 36];   // #fbbf24
    const gold2 = [217, 119, 6];   // #d97706
    const starC = [254, 230, 138]; // #fde68a

    const inCrescent = inCircle(ax, ay, 0.42, 0.5, 0.3) && !inCircle(ax, ay, 0.56, 0.5, 0.26);
    const inStr = inStar(ax, ay, 0.74, 0.34, 0.12, 0.055);

    if (inCrescent || inStr) {
      const tt = Math.min(1, Math.max(0, (y - 0.15) / 0.7));
      r = inStr ? starC[0] : lerp(gold[0], gold2[0], tt);
      g = inStr ? starC[1] : lerp(gold[1], gold2[1], tt);
      b = inStr ? starC[2] : lerp(gold[2], gold2[2], tt);
    }
    return [r | 0, g | 0, b | 0, 255];
  };
}

const files = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-maskable-512.png', 512, { maskable: true }],
];
for (const [name, size, opts] of files) {
  const png = encodePNG(size, makeDraw(opts));
  writeFileSync(join(OUT, name), png);
  console.log(`✓ ${name} (${(png.length / 1024).toFixed(1)} kB)`);
}

/* ---------------- OG social share banner (1200x630) ---------------- */
function makeBanner(px, py) {
  const W = 1200;
  const H = 630;
  const x = px / W;
  const y = py / H;

  // Emerald gradient with gold glow top-right + mint glow bottom-left
  let r = lerp(9, 2, y);
  let g = lerp(91, 44, y);
  let b = lerp(63, 34, y);

  const goldGlow = inCircle(px, py, W * 0.82, H * 0.12, W * 0.34);
  if (goldGlow) {
    const d = Math.hypot(px - W * 0.82, py - H * 0.12) / (W * 0.34);
    r += 60 * (1 - d);
    g += 44 * (1 - d);
    b += 8 * (1 - d);
  }
  const mintGlow = inCircle(px, py, W * 0.1, H * 0.95, W * 0.3);
  if (mintGlow) {
    const d = Math.hypot(px - W * 0.1, py - H * 0.95) / (W * 0.3);
    r += 10 * (1 - d);
    g += 60 * (1 - d);
    b += 50 * (1 - d);
  }
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);

  // subtle bottom gold accent bar
  if (y > 0.93) {
    const tt = (y - 0.93) / 0.07;
    return [lerp(217, 251, tt) | 0, lerp(119, 191, tt) | 0, lerp(6, 36, tt) | 0, 255];
  }

  // large gold crescent + star, right-of-center
  const gold = [251, 191, 36];
  const gold2 = [217, 119, 6];
  const starC = [254, 230, 138];
  const inCrescent = inCircle(px, py, W * 0.66, H * 0.46, W * 0.135) && !inCircle(px, py, W * 0.74, H * 0.46, W * 0.115);
  const inStr = inStar(px, py, W * 0.86, H * 0.34, W * 0.055, W * 0.025);
  if (inCrescent || inStr) {
    const tt = Math.min(1, Math.max(0, (y - 0.2) / 0.6));
    r = inStr ? starC[0] : lerp(gold[0], gold2[0], tt);
    g = inStr ? starC[1] : lerp(gold[1], gold2[1], tt);
    b = inStr ? starC[2] : lerp(gold[2], gold2[2], tt);
    return [r | 0, g | 0, b | 0, 255];
  }

  // faint geometric ornament: thin centered rings near the bottom-left
  const ringCx = W * 0.22;
  const ringCy = H * 0.62;
  for (const rr of [W * 0.07, W * 0.09, W * 0.11]) {
    const d = Math.abs(Math.hypot(px - ringCx, py - ringCy) - rr);
    if (d < 1.6) return [251, 191, 36, 38];
  }

  return [r | 0, g | 0, b | 0, 255];
}

const ogPng = encodePNG(1200, makeBanner);
writeFileSync(join(OUT, 'og-cover.png'), ogPng);
console.log(`✓ og-cover.png (${(ogPng.length / 1024).toFixed(1)} kB)`);
console.log('Icons written to public/icons/');
