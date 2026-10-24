// ─────────────────────────────────────────────────────────────────────────────
// THE APP ICONS, RENDERED FROM THE MARK THE SITE ALREADY DRAWS.
//
// WHY THIS IS A GENERATOR AND NOT FOUR PNGs SOMEONE EXPORTED. An installable web
// app is the one part of this product that renders its identity OUTSIDE the
// page: the home screen, the task switcher, the splash screen. Those surfaces
// take a bitmap, so the brand has to exist as pixels as well as as an SVG — and
// the moment a bitmap exists beside an artwork, the two drift. The failure is
// invisible in every test that only reads the DOM: the site keeps drawing its
// mark while every phone shows the icon from three designs ago.
//
// So the pixels are DERIVED. The geometry below is the mark in `docs/index.html`
// (the favicon and `.brand-mark` in the header): a rounded square, a triangle
// outlined in white, and a dot inside its base. Change that artwork and the
// icons are one command from agreeing again — and `scripts/static-smoke.mjs`
// fails if the shipped PNGs stop matching what this file would render, so the
// disagreement is caught rather than inherited.
//
// NO IMAGE DEPENDENCY, AND THAT IS DELIBERATE. The repository has no image
// library and does not want one for four files: a build-time `sharp` (or an
// `rsvg`/`cairo` on the host) would add a native dependency to a project whose
// whole deployment story is "npm ci, then node". PNG needs a CRC32 and a zlib
// stream, both of which Node has, so the encoding here is ~40 lines and the
// rasteriser is signed-distance tests with supersampling. There is no font, no
// text, no gradient and no filter — nothing an encoder cannot express.
//
//   node scripts/generate-app-icons.mjs            # write public/icons/*.png
//   node scripts/generate-app-icons.mjs --check    # exit 1 if any is stale
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT_DIR = path.join("public", "icons");
const CHECK = process.argv.includes("--check");

// ── The artwork, in the 32-unit space the site's SVG uses ───────────────────
const BLUE = [0x24, 0x54, 0xd4]; // --brand, the header mark's fill
const WHITE = [0xff, 0xff, 0xff];
const CORNER = 7; // rx of the rounded square, in 32-unit space
const TRIANGLE = [
  [16, 6.5],
  [25, 24],
  [7, 24],
];
const STROKE = 2.4; // the outline's width, in 32-unit space
const DOT = { x: 16, y: 19.5, r: 2.1 };

/**
 * The sizes that matter, each with the reason it exists.
 *
 * `any` is drawn as the mark ON a rounded square with transparent corners — the
 * shape a launcher shows as-is on a platform that does not mask.
 *
 * `maskable` is FULL BLEED: the artwork is inset so that everything survives a
 * circular crop. A launcher that masks `any` artwork instead cuts the triangle's
 * corners off, which is exactly the bug `purpose: "maskable"` exists to prevent.
 *
 * `apple-touch-icon` is opaque and square: iOS composites it over black if it
 * has an alpha channel and applies its own squircle mask, so a transparent
 * corner would render as a black corner.
 */
const ICONS = [
  { file: "icon-192.png", size: 192, shape: "rounded", inset: 1, purpose: "any" },
  { file: "icon-512.png", size: 512, shape: "rounded", inset: 1, purpose: "any" },
  { file: "icon-maskable-512.png", size: 512, shape: "square", inset: 0.86, purpose: "maskable" },
  { file: "apple-touch-icon.png", size: 180, shape: "square", inset: 0.86, purpose: "apple" },
];

// ── Geometry ───────────────────────────────────────────────────────────────

function inRoundedSquare(u, v, radius) {
  const half = 16 - radius; // the straight part's half-extent
  const dx = Math.max(0, Math.abs(u - 16) - half);
  const dy = Math.max(0, Math.abs(v - 16) - half);
  return dx * dx + dy * dy <= radius * radius;
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

/** Is this artwork point on the white mark (the outlined triangle, or the dot)? */
function onMark(u, v) {
  for (let i = 0; i < TRIANGLE.length; i += 1) {
    const [ax, ay] = TRIANGLE[i];
    const [bx, by] = TRIANGLE[(i + 1) % TRIANGLE.length];
    // The path is closed with round joins, so the joints are simply the union
    // of three rounded capsules — no separate join handling is needed.
    if (segmentDistance(u, v, ax, ay, bx, by) <= STROKE / 2) return true;
  }
  return Math.hypot(u - DOT.x, v - DOT.y) <= DOT.r;
}

/**
 * Rasterise one icon to RGBA.
 *
 * COVERAGE, NOT CENTRE SAMPLING. Each pixel asks S×S points inside itself, so the
 * triangle's diagonal and the rounded corners are anti-aliased. Centre sampling
 * would leave those edges visibly stepped at 192 px, which is the size a phone
 * actually shows.
 */
function rasterise({ size, shape, inset }) {
  const S = 4;
  const rgba = Buffer.alloc(size * size * 4);
  const scale = 1 / inset; // inset < 1 shrinks the artwork inside the canvas
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let covered = 0;
      let marked = 0;
      for (let sy = 0; sy < S; sy += 1) {
        for (let sx = 0; sx < S; sx += 1) {
          const px = ((x + (sx + 0.5) / S) / size) * 32;
          const py = ((y + (sy + 0.5) / S) / size) * 32;
          // Scale about the centre so an inset icon keeps its composition.
          const u = (px - 16) * scale + 16;
          const v = (py - 16) * scale + 16;
          const inside = shape === "rounded" ? inRoundedSquare(px, py, CORNER) : true;
          if (!inside) continue;
          covered += 1;
          if (onMark(u, v)) marked += 1;
        }
      }
      const total = S * S;
      const i = (y * size + x) * 4;
      if (covered === 0) continue; // transparent outside a rounded square
      const alpha = covered / total;
      const whiteShare = marked / covered;
      for (let c = 0; c < 3; c += 1) {
        rgba[i + c] = Math.round(WHITE[c] * whiteShare + BLUE[c] * (1 - whiteShare));
      }
      rgba[i + 3] = Math.round(255 * alpha);
    }
  }
  return rgba;
}

// ── PNG encoding ───────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace
  // One filter byte (0 = none) per scanline. Filtering exists to help the
  // compressor on photographs; on flat geometry it costs clarity for nothing.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Run ────────────────────────────────────────────────────────────────────

if (!CHECK) fs.mkdirSync(OUT_DIR, { recursive: true });

let stale = 0;
const written = [];
for (const icon of ICONS) {
  const png = encodePng(icon.size, rasterise(icon));
  const file = path.join(OUT_DIR, icon.file);
  const previous = fs.existsSync(file) ? fs.readFileSync(file) : null;
  if (!previous || !previous.equals(png)) {
    stale += 1;
    if (CHECK) {
      console.error(`  ✗ ${file} is stale — run \`node scripts/generate-app-icons.mjs\``);
    } else {
      fs.writeFileSync(file, png);
      written.push(`${icon.file} ${icon.size}×${icon.size} (${icon.purpose})`);
    }
  }
}

if (CHECK) {
  if (stale) {
    console.error(`\n${stale} icon(s) do not match the mark the site draws.`);
    process.exit(1);
  }
  console.log(`  ✓ ${ICONS.length} app icons match the mark the site draws`);
} else if (written.length) {
  for (const line of written) console.log(`  → public/icons/${line}`);
  console.log(`app icons: ${written.length} written, ${ICONS.length - written.length} already current`);
} else {
  console.log(`app icons: all ${ICONS.length} already current`);
}
