import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const crcTable = createCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writePngChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateIconPng(size, isMaskable = false) {
  const width = size;
  const height = size;
  // Raw scanlines: each scanline has 1 filter byte (0) + width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isMaskable ? 0 : width * 0.22;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      // Rounded rect check
      let inShape = true;
      if (!isMaskable) {
        const dx = Math.abs(x - cx) - (cx - cornerRadius);
        const dy = Math.abs(y - cy) - (cy - cornerRadius);
        if (dx > 0 && dy > 0) {
          inShape = (dx * dx + dy * dy) <= (cornerRadius * cornerRadius);
        }
      }

      if (!inShape) {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0; // Transparent
        continue;
      }

      // Background gradient (deep space navy #0a0d14 to #161f33)
      const gradT = (x + y) / (width + height);
      let r = Math.round(10 + gradT * 12);
      let g = Math.round(13 + gradT * 18);
      let b = Math.round(20 + gradT * 31);
      let a = 255;

      // Distance from center
      const distFromCenter = Math.hypot(x - cx, y - cy);

      // Subtle glow ring
      if (Math.abs(distFromCenter - width * 0.38) < width * 0.015) {
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 80);
        b = Math.min(255, b + 120);
      }

      // Stylized music note glyph in center
      // Left note head: ellipse around (cx - width*0.12, cy + height*0.12)
      const lx = x - (cx - width * 0.12);
      const ly = y - (cy + height * 0.12);
      const rx = x - (cx + width * 0.12);
      const ry = y - (cy + height * 0.05);

      const inLeftHead = (lx * lx) / Math.pow(width * 0.09, 2) + (ly * ly) / Math.pow(height * 0.07, 2) <= 1;
      const inRightHead = (rx * rx) / Math.pow(width * 0.09, 2) + (ry * ry) / Math.pow(height * 0.07, 2) <= 1;

      // Stems
      const inLeftStem = (x >= cx - width * 0.05 && x <= cx - width * 0.02) && (y >= cy - height * 0.22 && y <= cy + height * 0.12);
      const inRightStem = (x >= cx + width * 0.19 && x <= cx + width * 0.22) && (y >= cy - height * 0.28 && y <= cy + height * 0.05);

      // Top Beam
      const beamY = (cy - height * 0.22) + (x - (cx - width * 0.05)) * -0.25;
      const inBeam = (x >= cx - width * 0.05 && x <= cx + width * 0.22) && (y >= beamY - height * 0.07 && y <= beamY);

      if (inLeftHead || inRightHead || inLeftStem || inRightStem || inBeam) {
        // Cyan-to-purple gradient on note
        const noteGrad = (x / width);
        r = Math.round(6 * (1 - noteGrad) + 168 * noteGrad);
        g = Math.round(182 * (1 - noteGrad) + 85 * noteGrad);
        b = Math.round(212 * (1 - noteGrad) + 247 * noteGrad);
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = writePngChunk('IHDR', ihdr);
  const idatChunk = writePngChunk('IDAT', compressed);
  const iendChunk = writePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve('public/icons');
fs.writeFileSync(path.join(outDir, 'icon-192.png'), generateIconPng(192, false));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), generateIconPng(512, false));
fs.writeFileSync(path.join(outDir, 'icon-maskable-192.png'), generateIconPng(192, true));
fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), generateIconPng(512, true));
console.log('Successfully generated crisp PNG icons for PWA!');
