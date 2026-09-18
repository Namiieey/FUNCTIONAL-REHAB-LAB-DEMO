import fs from 'fs';
import zlib from 'zlib';

function createSolidPng(width, height, r, g, b) {
  // Simple uncompressed or deflated raw RGBA PNG writer
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = calcCrc(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(2, 9); // Truecolor (RGB)
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  // Scanlines with filter 0
  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter none
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Draw border or center accent
      const isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      const isCenter = Math.abs(x - width / 2) < width * 0.25 && Math.abs(y - height / 2) < height * 0.25;
      if (isCenter) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 85;
        rawData[pxOffset + 2] = 0; // Fluorescent Orange
      } else if (isBorder) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 85;
        rawData[pxOffset + 2] = 0;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, chunk('IHDR', ihdr), idat, iend]);
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calcCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

const p192 = createSolidPng(192, 192, 10, 10, 10);
const p512 = createSolidPng(512, 512, 10, 10, 10);
const p180 = createSolidPng(180, 180, 10, 10, 10);

fs.writeFileSync('./public/pwa-192x192.png', p192);
fs.writeFileSync('./public/pwa-512x512.png', p512);
fs.writeFileSync('./public/pwa-maskable-512x512.png', p512);
fs.writeFileSync('./public/apple-touch-icon.png', p180);
fs.writeFileSync('./public/favicon.ico', p192);
console.log('PNG Icons successfully generated in ./public/');
