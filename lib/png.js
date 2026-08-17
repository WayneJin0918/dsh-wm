/**
 * Minimal 8-bit RGB PNG encode/decode using node:zlib.
 * Generated fixtures use filter 0; decode also handles filters 1–4.
 */
import { deflateSync, inflateSync } from 'node:zlib'

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c >>> 0
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  body.copy(out, 4)
  out.writeUInt32BE(crc32(body), 8 + data.length)
  return out
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

function unfilter(width, height, bpp, raw) {
  const stride = width * bpp
  const out = Buffer.alloc(stride * height)
  let src = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[src++]
    const row = y * stride
    const prev = y === 0 ? null : (y - 1) * stride
    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? out[row + x - bpp] : 0
      const up = prev === null ? 0 : out[prev + x]
      const upLeft = prev === null || x < bpp ? 0 : out[prev + x - bpp]
      const val = raw[src++]
      let recon
      if (filter === 0) recon = val
      else if (filter === 1) recon = val + left
      else if (filter === 2) recon = val + up
      else if (filter === 3) recon = val + ((left + up) >> 1)
      else if (filter === 4) recon = val + paeth(left, up, upLeft)
      else throw new Error(`png: unsupported filter ${filter}`)
      out[row + x] = recon & 0xff
    }
  }
  return out
}

/**
 * @param {Buffer} buf
 * @returns {{ width: number, height: number, rgb: Buffer }}
 */
export function decodePng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('png: missing signature')
  }
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idats = []
  while (offset + 12 <= buf.length) {
    const length = buf.readUInt32BE(offset)
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buf.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idats.push(data)
    } else if (type === 'IEND') {
      break
    }
  }
  if (!width || !height) throw new Error('png: missing IHDR')
  if (bitDepth !== 8) throw new Error(`png: only 8-bit supported, got ${bitDepth}`)
  const inflated = inflateSync(Buffer.concat(idats))
  let bpp
  if (colorType === 2) bpp = 3
  else if (colorType === 6) bpp = 4
  else if (colorType === 0) bpp = 1
  else throw new Error(`png: unsupported color type ${colorType}`)
  const raw = unfilter(width, height, bpp, inflated)
  if (bpp === 3) return { width, height, rgb: raw }
  const rgb = Buffer.alloc(width * height * 3)
  if (bpp === 1) {
    for (let i = 0, j = 0; i < raw.length; i++, j += 3) {
      rgb[j] = rgb[j + 1] = rgb[j + 2] = raw[i]
    }
  } else {
    for (let i = 0, j = 0; i < raw.length; i += 4, j += 3) {
      rgb[j] = raw[i]
      rgb[j + 1] = raw[i + 1]
      rgb[j + 2] = raw[i + 2]
    }
  }
  return { width, height, rgb }
}

/**
 * @param {Buffer|Uint8Array} rgb
 * @param {number} width
 * @param {number} height
 * @returns {Buffer}
 */
export function encodePng(rgb, width, height) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(rgb).copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
