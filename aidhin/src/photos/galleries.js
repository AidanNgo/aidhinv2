/* Turns the photo folders into ready-to-render gallery arrays.
 *
 * Two halves have to meet here:
 *
 *   - Vite's import.meta.glob finds the actual files and hands back the
 *     hashed, bundled URL for each. It can't tell us their shape.
 *   - manifest.json (written by scripts/photo-manifest.mjs, which runs
 *     automatically before dev and build) has each photo's pixel size,
 *     already in display order. It doesn't know the bundled URLs.
 *
 * Joining them on the filename gives entries with both, so the gallery
 * can reserve the right height before a photo has loaded.
 *
 * TO ADD PHOTOS: drop files into src/photos/portraits/ or /travel/.
 * That's the whole procedure - the Vite plugin in
 * scripts/vite-photo-manifest.mjs rebuilds the manifest on the spot and
 * the page updates itself. No restart, and nothing here needs editing.
 *
 * Note the manifest leads: this walks IT and looks up a URL per entry,
 * so a photo missing from the manifest doesn't render at all.
 *
 * TO REORDER: rename the files. They're sorted numerically, so image2
 * comes after image1 rather than after image19, and renaming to 01_, 02_
 * (or any numbering) works the way you'd expect.
 */
import manifest from './manifest.json'

/* Vite reads these calls at build time rather than running them, so BOTH
   arguments have to be written out literally here — a shared options
   object or a variable folder name fails with "Expected the second
   argument to be an object literal". That's why the two galleries are
   spelled out in full instead of being generated in a loop.

   eager gives the URLs synchronously at first render; they're only
   strings, so nothing heavy is pulled into the bundle. query/import ask
   for the asset URL rather than the file's contents. */
const portraitFiles = import.meta.glob(
    './portraits/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
    { eager: true, query: '?url', import: 'default' },
)
const travelFiles = import.meta.glob(
    './travel/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
    { eager: true, query: '?url', import: 'default' },
)

function build(galleryName, files) {
    /* Glob keys are paths like './portraits/image1.jpg'; the manifest is
       keyed on the bare filename, so reduce to that. */
    const urlByFile = new Map(
        Object.entries(files).map(([path, url]) => [path.split('/').pop(), url]),
    )

    return (manifest[galleryName] ?? [])
        /* A manifest entry with no matching file means a photo was
           deleted since the manifest was written. Skip it rather than
           render a broken image. */
        .filter((entry) => urlByFile.has(entry.file))
        .map((entry) => ({
            file: entry.file,
            src: urlByFile.get(entry.file),
            width: entry.width,
            height: entry.height,
        }))
}

export const portraits = build('portraits', portraitFiles)
export const travel = build('travel', travelFiles)
