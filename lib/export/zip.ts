// ─────────────────────────────────────────────────────────────────────────────
// A ZIP WRITER, BECAUSE THE EXPORT FORMATS *ARE* ZIP FILES.
//
// QTI 2.2 packages and OneRoster 1.2 CSV bundles are both delivered as a single
// `.zip`, and a "link to five CSVs" or "link to a folder of XML" is not a package:
// an LMS import dialogue takes one file, and a ministry's data team will not
// reconstruct the layout by hand. So exporting interoperable content needs a ZIP
// writer, and this project installs no dependencies for it.
//
// WHY STORE (method 0) AND NOT DEFLATE. Compression is a build-time concern here,
// and pulling in `node:zlib` would make the module unavailable to any runtime that
// is not Node — including the bundle the static build produces, which is the
// deployment this product exists for. The files involved are XML and CSV of a few
// hundred kilobytes; an uncompressed archive is larger but every unzipper on every
// platform reads it, and correctness beats a size win we cannot measure here.
//
// DETERMINISM IS A REQUIREMENT, not a nicety. Every timestamp in a ZIP is a DOS
// date/time field, so archiving "now" would make two exports of identical content
// differ byte-for-byte — which defeats the only cheap check a reviewer has
// (`sha256` the export, rebuild, compare) and makes a cached export look stale.
// The timestamp is therefore a FIXED constant: 2020-01-01 00:00:00.
//
// WHAT IS DELIBERATELY ABSENT: directory entries. Every path in these packages is
// implied by the file names themselves (`items/x.xml`), which is what every
// unzipper does with an archive that has no explicit directory records.
// ─────────────────────────────────────────────────────────────────────────────

/** One file to place in the archive. `path` is the archive-internal name. */
export interface ZipEntry {
  path: string;
  data: string | Uint8Array;
}

/** The DOS time-of-day field for 00:00:00, and the matching date field for
 *  2020-01-01 — both FIXED so a rebuild is byte-identical. Neither is a claim
 *  about when the file was made: see the header. */
const FIXED_DOS_TIME = 0; // 00:00:00
const FIXED_DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1; // 2020-01-01

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL = 0x06054b50;

/** ZIP's CRC-32 (polynomial 0xEDB88320), built once. */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();

function bytesOf(data: string | Uint8Array): Uint8Array {
  return typeof data === "string" ? encoder.encode(data) : data;
}

/**
 * Build a store-only ZIP from `files`, in the order given.
 *
 * The order is the CALLER's, deliberately: a caller that lists `imsmanifest.xml`
 * first gets an archive a human can inspect in a hex viewer in the order it was
 * written, and two runs over one array produce the same bytes.
 */
export function zipStore(files: readonly ZipEntry[]): Uint8Array {
  const prepared = files.map((f) => {
    const name = encoder.encode(f.path);
    const body = bytesOf(f.data);
    return { name, body, crc: crc32(body) };
  });

  const localSize = prepared.reduce((n, f) => n + 30 + f.name.length + f.body.length, 0);
  const centralSize = prepared.reduce((n, f) => n + 46 + f.name.length, 0);
  const total = localSize + centralSize + 22;

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let at = 0;

  // Each entry's local header offset, needed by the central directory.
  const offsets: number[] = [];

  for (const file of prepared) {
    offsets.push(at);
    view.setUint32(at, LOCAL_HEADER, true);
    at += 4;
    view.setUint16(at, 20, true); // version needed to extract (2.0 = store + folders)
    at += 2;
    // Bit 11 = names are UTF-8, which matters the moment a concept title or a
    // learner handle carries a non-ASCII character.
    view.setUint16(at, 0x0800, true);
    at += 2;
    view.setUint16(at, 0, true); // method: store
    at += 2;
    view.setUint16(at, FIXED_DOS_TIME, true);
    at += 2;
    view.setUint16(at, FIXED_DOS_DATE, true);
    at += 2;
    view.setUint32(at, file.crc, true);
    at += 4;
    view.setUint32(at, file.body.length, true); // compressed size == uncompressed
    at += 4;
    view.setUint32(at, file.body.length, true);
    at += 4;
    view.setUint16(at, file.name.length, true);
    at += 2;
    view.setUint16(at, 0, true); // extra field length
    at += 2;
    out.set(file.name, at);
    at += file.name.length;
    out.set(file.body, at);
    at += file.body.length;
  }

  const centralStart = at;

  for (let i = 0; i < prepared.length; i++) {
    const file = prepared[i];
    view.setUint32(at, CENTRAL_HEADER, true);
    at += 4;
    view.setUint16(at, 20, true); // version made by
    at += 2;
    view.setUint16(at, 20, true); // version needed
    at += 2;
    view.setUint16(at, 0x0800, true);
    at += 2;
    view.setUint16(at, 0, true); // method
    at += 2;
    view.setUint16(at, FIXED_DOS_TIME, true);
    at += 2;
    view.setUint16(at, FIXED_DOS_DATE, true);
    at += 2;
    view.setUint32(at, file.crc, true);
    at += 4;
    view.setUint32(at, file.body.length, true);
    at += 4;
    view.setUint32(at, file.body.length, true);
    at += 4;
    view.setUint16(at, file.name.length, true);
    at += 2;
    view.setUint16(at, 0, true); // extra
    at += 2;
    view.setUint16(at, 0, true); // comment
    at += 2;
    view.setUint16(at, 0, true); // disk number start
    at += 2;
    view.setUint16(at, 0, true); // internal attributes
    at += 2;
    view.setUint32(at, 0, true); // external attributes
    at += 4;
    view.setUint32(at, offsets[i], true);
    at += 4;
    out.set(file.name, at);
    at += file.name.length;
  }

  // End of central directory. A single-disk archive with no comment.
  view.setUint32(at, END_OF_CENTRAL, true);
  at += 4;
  view.setUint16(at, 0, true); // this disk
  at += 2;
  view.setUint16(at, 0, true); // disk with the central directory
  at += 2;
  view.setUint16(at, prepared.length, true); // entries on this disk
  at += 2;
  view.setUint16(at, prepared.length, true); // entries total
  at += 2;
  view.setUint32(at, centralSize, true);
  at += 4;
  view.setUint32(at, centralStart, true);
  at += 4;
  view.setUint16(at, 0, true); // comment length
  at += 2;

  // The arithmetic above is the format's, so a mismatch is a bug in this file
  // rather than in a caller. Throwing names it instead of shipping a truncated
  // archive an importer would reject with no explanation.
  if (at !== total) throw new Error(`zipStore: wrote ${at} bytes, expected ${total}`);
  return out;
}
