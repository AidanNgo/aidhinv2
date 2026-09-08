/* Vite plugin: keeps src/photos/manifest.json in step with the photo
 * folders, so photos can be added while the dev server is running.
 *
 * WHY THIS EXISTS
 * galleries.js builds each gallery by walking the MANIFEST and looking up
 * a bundled URL for each entry. A photo with no manifest entry therefore
 * doesn't render at all — it isn't merely missing its dimensions, it's
 * invisible. Regenerating the manifest on a pre-hook alone meant every
 * new photo needed a server restart before it appeared.
 *
 * With this, dropping files into src/photos/<gallery>/ is enough:
 * the manifest is rewritten, Vite sees that file change and hot-updates
 * galleries.js, and the new photos appear.
 */
import { extname, sep } from 'node:path'
import { writeManifest } from './photo-manifest.mjs'

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

/* Long enough to swallow a batch, short enough to feel immediate.
   Dragging 50 photos into the folder fires 50 separate watcher events,
   and rebuilding the manifest once per file would parse every header
   fifty times over. */
const DEBOUNCE_MS = 150

export default function photoManifest() {
    return {
        name: 'photo-manifest',

        /* Covers `vite` and `vite build` alike, so the manifest is never
           stale at startup — which is why package.json no longer needs
           predev/prebuild hooks. */
        buildStart() {
            writeManifest()
        },

        configureServer(server) {
            let timer = null

            const onPhotoChange = (file) => {
                /* Normalised through path.sep so this works on Windows
                   and POSIX alike. */
                const path = file.split(sep).join('/')
                if (!path.includes('/src/photos/')) return

                /* Extension check is also what keeps manifest.json itself
                   from matching. Without that the plugin would rewrite the
                   file, see its own write, and rebuild forever. */
                if (!EXTENSIONS.has(extname(path).toLowerCase())) return

                clearTimeout(timer)
                timer = setTimeout(() => {
                    const { changed, total } = writeManifest({ log: false })

                    /* writeManifest only touches the file when the result
                       genuinely differs, so `changed` being false means
                       there is nothing to tell anyone about. */
                    if (!changed) return

                    server.config.logger.info(
                        `photo-manifest: ${total} photo${total === 1 ? '' : 's'}`,
                        { timestamp: true },
                    )
                }, DEBOUNCE_MS)
            }

            /* 'add' and 'unlink' are the two that matter: a photo that is
               merely re-saved keeps its dimensions, and the manifest holds
               nothing else about it. */
            server.watcher.on('add', onPhotoChange)
            server.watcher.on('unlink', onPhotoChange)
        },
    }
}
