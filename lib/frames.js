import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { decodePng } from './png.js'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.ppm', '.pgm'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v'])

export function isImagePath(path) {
  return IMAGE_EXT.has(extname(path).toLowerCase())
}

export function isVideoPath(path) {
  return VIDEO_EXT.has(extname(path).toLowerCase())
}

function naturalSort(paths) {
  return [...paths].sort((a, b) =>
    basename(a).localeCompare(basename(b), undefined, { numeric: true, sensitivity: 'base' }),
  )
}

export function listImages(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  return naturalSort(
    entries
      .filter((name) => isImagePath(name))
      .map((name) => join(dir, name))
      .filter((path) => {
        try {
          return statSync(path).isFile()
        } catch {
          return false
        }
      }),
  )
}

function decodePpm(buf) {
  if (buf[0] !== 0x50 || (buf[1] !== 0x36 && buf[1] !== 0x35)) {
    throw new Error('not a P5/P6 PPM/PGM')
  }
  let i = 2
  const tokens = []
  while (tokens.length < 3 && i < buf.length) {
    if (buf[i] === 0x23) {
      while (i < buf.length && buf[i] !== 0x0a) i++
      continue
    }
    if (buf[i] <= 32) {
      i++
      continue
    }
    let j = i
    while (j < buf.length && buf[j] > 32) j++
    tokens.push(buf.toString('ascii', i, j))
    i = j
  }
  while (i < buf.length && buf[i] <= 32) i++
  const width = Number(tokens[0])
  const height = Number(tokens[1])
  const binary = buf.subarray(i)
  if (buf[1] === 0x35) {
    const rgb = new Uint8Array(width * height * 3)
    for (let p = 0; p < width * height; p++) {
      const v = binary[p]
      rgb[p * 3] = v
      rgb[p * 3 + 1] = v
      rgb[p * 3 + 2] = v
    }
    return { rgb, width, height }
  }
  return { rgb: new Uint8Array(binary.subarray(0, width * height * 3)), width, height }
}

function hasFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  return r.status === 0
}

function ffmpegToPng(src) {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-wm-'))
  const dest = join(dir, 'frame.png')
  const r = spawnSync('ffmpeg', ['-y', '-i', src, '-frames:v', '1', dest], {
    encoding: 'utf8',
  })
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${src}: ${r.stderr || r.stdout}`)
  return decodePng(readFileSync(dest))
}

export function decodeImage(path) {
  const ext = extname(path).toLowerCase()
  const buf = readFileSync(path)
  if (ext === '.png') return decodePng(buf)
  if (ext === '.ppm' || ext === '.pgm') return decodePpm(buf)
  if (ext === '.jpg' || ext === '.jpeg') {
    if (!hasFfmpeg()) {
      throw new Error(`JPEG ${path} needs ffmpeg on PATH (day-1 native decode is PNG/PPM)`)
    }
    return ffmpegToPng(path)
  }
  throw new Error(`unsupported image: ${path}`)
}

export function extractVideoFrames(videoPath, maxFrames = 32) {
  if (!hasFfmpeg()) {
    throw new Error(`video ${videoPath} needs ffmpeg on PATH; pass a frame directory instead`)
  }
  const dir = mkdtempSync(join(tmpdir(), 'dsh-wm-vid-'))
  const dest = join(dir, 'f%04d.png')
  const r = spawnSync(
    'ffmpeg',
    ['-y', '-i', videoPath, '-vf', `select='not(mod(n\\,1))'`, '-vsync', 'vfr', dest],
    { encoding: 'utf8' },
  )
  if (r.status !== 0) throw new Error(`ffmpeg extract failed: ${r.stderr || r.stdout}`)
  const frames = listImages(dir)
  if (frames.length <= maxFrames) return frames
  const step = (frames.length - 1) / (maxFrames - 1)
  return Array.from({ length: maxFrames }, (_, i) => frames[Math.round(i * step)])
}

/**
 * Resolve a pred/gt path (directory, image, or video) to an ordered frame list.
 */
export function resolveFrames(path, maxFrames = 64) {
  const st = statSync(path)
  if (st.isDirectory()) {
    const frames = listImages(path)
    if (!frames.length) throw new Error(`no frames in ${path}`)
    if (frames.length <= maxFrames) return frames
    const step = (frames.length - 1) / (maxFrames - 1)
    return Array.from({ length: maxFrames }, (_, i) => frames[Math.round(i * step)])
  }
  if (isVideoPath(path)) return extractVideoFrames(path, maxFrames)
  if (isImagePath(path)) return [path]
  throw new Error(`not a frame dir, image, or video: ${path}`)
}

export function countFrames(path) {
  try {
    const st = statSync(path)
    if (st.isDirectory()) return listImages(path).length
    if (isVideoPath(path) || isImagePath(path)) return 1
  } catch {
    return 0
  }
  return 0
}
