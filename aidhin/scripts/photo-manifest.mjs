/* Writes src/photos/manifest.json: every gallery photo's pixel dimensions.
 *
 * WHY THIS EXISTS
 * The galleries are masonry — uniform column width, height set by each
 * photo's own aspect ratio. The browser can't know a photo's shape until
 * the file arrives, so without this the columns reshuffle as images
 * stream in. Feeding the dimensions to the <img> up front means every
 * slot is the right height from the first paint, and nothing moves.
 *
 * Fully automatic. The Vite plugin in scripts/vite-photo-manifest.mjs
 * calls writeManifest() when the server starts and again whenever a
 * photo file is added or removed, so a photo dropped into
 * src/photos/<gallery>/ appears WITHOUT restarting the dev server.
 * `npm run photos` runs it by hand if you ever want that.
 *
 * Deliberately dependency-free — dimensions live in the first few bytes
 * of each file, so an image library would be a lot of weight for a
 * header read.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const photosDir = join(here, '..', 'src', 'photos')

/* Add a folder name here and it becomes a gallery. */
const GALLERIES = ['portraits', 'travel']
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

/* ── PNG ────────────────────────────────────────────────────────────
   Fixed layout: 8-byte signature, then the IHDR chunk whose first two
   fields are width and height. */
function pngSize(buf) {
    if (buf.length < 24) return null
    if (buf.readUInt32BE(0) !== 0x89504e47) return null
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/* ── WebP ───────────────────────────────────────────────────────────
   RIFF container; which chunk comes first tells us the variant, and
   each stores its size differently. */
function webpSize(buf) {
    if (buf.length < 30) return null
    if (buf.toString('ascii', 0, 4) !== 'RIFF') return null
    if (buf.toString('ascii', 8, 12) !== 'WEBP') return null

    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8X') {
        return {
            width: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
            height: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
        }
    }
    if (chunk === 'VP8 ') {
        return {
            width: buf.readUInt16LE(26) & 0x3fff,
            height: buf.readUInt16LE(28) & 0x3fff,
        }
    }
    if (chunk === 'VP8L') {
        const bits = buf.readUInt32LE(21)
        return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1,
        }
    }
    return null
}

/* ── EXIF orientation ───────────────────────────────────────────────
   Cameras often store a portrait frame as landscape pixels plus an
   orientation flag saying "rotate this on display". Browsers honour
   that flag, so a raw header read would hand us a landscape shape for
   a photo the page renders portrait — every such slot would be the
   wrong height. Values 5-8 are the quarter-turns, and for those the
   displayed width and height are swapped.

   `payload` points at the start of an APP1 segment's data. */
function exifOrientation(buf, payload, end) {
    if (payload + 8 > end) return 1
    if (buf.toString('ascii', payload, payload + 4) !== 'Exif') return 1

    const tiff = payload + 6
    if (tiff + 8 > end) return 1

    const little = buf.toString('ascii', tiff, tiff + 2) === 'II'
    const u16 = (o) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o))
    const u32 = (o) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o))

    if (u16(tiff + 2) !== 42) return 1

    const ifd0 = tiff + u32(tiff + 4)
    if (ifd0 + 2 > end) return 1

    const entries = u16(ifd0)
    for (let i = 0; i < entries; i++) {
        const entry = ifd0 + 2 + i * 12
        if (entry + 12 > end) break
        if (u16(entry) === 0x0112) return u16(entry + 8)
    }
    return 1
}

/* ── JPEG ───────────────────────────────────────────────────────────
   A chain of marker segments. The dimensions live in whichever SOF
   (Start Of Frame) marker the file uses, and the orientation flag in an
   APP1 segment — which may come before or after it, so we walk to the
   image data and use whatever we found. */
function jpegSize(buf) {
    if (buf.length < 4) return null
    if (buf[0] !== 0xff || buf[1] !== 0xd8) return null

    let offset = 2
    let size = null
    let orientation = 1

    while (offset < buf.length - 1) {
        if (buf[offset] !== 0xff) { offset++; continue }

        const marker = buf[offset + 1]

        /* Padding, and standalone markers that carry no length field. */
        if (marker === 0xff) { offset++; continue }
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue }

        /* Start of scan / end of image: past all the metadata. */
        if (marker === 0xda || marker === 0xd9) break

        if (offset + 4 > buf.length) break
        const length = buf.readUInt16BE(offset + 2)
        if (length < 2) break

        /* C0-CF are SOF variants except C4 (Huffman table), C8 (JPEG
           extension) and CC (arithmetic coding), which aren't frames. */
        const isFrame =
            marker >= 0xc0 && marker <= 0xcf &&
            marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc

        if (isFrame && !size && offset + 9 <= buf.length) {
            size = {
                height: buf.readUInt16BE(offset + 5),
                width: buf.readUInt16BE(offset + 7),
            }
        }

        if (marker === 0xe1) {
            orientation = exifOrientation(buf, offset + 4, offset + 2 + length)
        }

        offset += 2 + length
    }

    if (!size) return null
    return orientation >= 5 && orientation <= 8
        ? { width: size.height, height: size.width }
        : size
}

function readSize(file) {
    const buf = readFileSync(file)
    const ext = extname(file).toLowerCase()
    if (ext === '.png') return pngSize(buf)
    if (ext === '.webp') return webpSize(buf)
    return jpegSize(buf)
}

/* image2 must follow image1, not image19 — a plain string sort would put
   image10 before image2. Intl's numeric collation compares digit runs as
   numbers, which is also what a human renaming files expects. */
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/* Builds the manifest and writes it ONLY if the result actually differs
   from what's on disk. That matters in dev: writing an identical file
   would still touch it, and Vite would push a pointless hot update to
   the browser every time a watcher event turned out to be a no-op.

   Returns what happened so the plugin can stay quiet unless something
   really changed. */
export function writeManifest({ log = true } = {}) {
    const manifest = {}
    const counts = {}
    const failures = []
    let total = 0

    for (const gallery of GALLERIES) {
        const dir = join(photosDir, gallery)
        if (!existsSync(dir)) {
            manifest[gallery] = []
            counts[gallery] = 0
            continue
        }

        const files = readdirSync(dir)
            .filter((f) => EXTENSIONS.has(extname(f).toLowerCase()))
            .sort(collator.compare)

        const entries = []
        for (const file of files) {
            let size = null
            try {
                size = readSize(join(dir, file))
            } catch (err) {
                failures.push(`${gallery}/${file}: ${err.message}`)
                continue
            }
            if (!size || !size.width || !size.height) {
                failures.push(`${gallery}/${file}: could not read dimensions`)
                continue
            }
            entries.push({ file, width: size.width, height: size.height })
        }

        manifest[gallery] = entries
        counts[gallery] = entries.length
        total += entries.length
    }

    if (!existsSync(photosDir)) mkdirSync(photosDir, { recursive: true })

    const target = join(photosDir, 'manifest.json')
    const next = JSON.stringify(manifest, null, 2) + '\n'
    const previous = existsSync(target) ? readFileSync(target, 'utf8') : null
    const changed = previous !== next
    if (changed) writeFileSync(target, next)

    if (log) {
        for (const gallery of GALLERIES) {
            const n = counts[gallery] ?? 0
            console.log(`  ${gallery}: ${n} photo${n === 1 ? '' : 's'}`)
        }
        console.log(
            `photo-manifest: ${total} photo${total === 1 ? '' : 's'} written to src/photos/manifest.json`,
        )
    }

    /* A file we can't measure would silently vanish from the gallery, so
       say so loudly - but never fail the build over one bad file. */
    if (failures.length) {
        console.warn(`photo-manifest: ${failures.length} file(s) skipped:`)
        for (const f of failures) console.warn(`  ! ${f}`)
    }

    return { changed, total, counts, failures }
}

/* Only self-run when invoked as a script (`npm run photos`). Importing
   this from the Vite plugin must not trigger a write as a side effect. */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    writeManifest()
}
