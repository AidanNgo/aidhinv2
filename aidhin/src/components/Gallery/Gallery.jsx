import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import Lightbox from '../Lightbox/Lightbox.jsx'
import './Gallery.css'

/* Masonry photo gallery, shared by both Selected Work pages.

   Props:
     photos - array of { file, src, width, height } from photos/galleries.js
     label  - gallery name, used for alt text and the lightbox's title

   Photos keep their own aspect ratio, so every column ends at a
   different height and the rows never line up. That's the staggered
   look, and it's why nothing has to be cropped. */
function Gallery({ photos, label }){
    /* null when closed; otherwise the index being viewed. */
    const [openAt, setOpenAt] = useState(null)

    const galleryRef = useRef(null)

    /* ── Column count ─────────────────────────────────────────────
       Read from the --gallery-columns custom property rather than
       duplicated here, so Gallery.css stays the single place the
       breakpoints are defined. Change 3/2/1 there and this follows.

       useLayoutEffect, not useEffect: this runs before the browser
       paints, so the gallery is never briefly laid out at the wrong
       column count and then reflowed. */
    const [columns, setColumns] = useState(1)

    useLayoutEffect(() => {
        const root = galleryRef.current
        if (!root) return

        const read = () => {
            const raw = getComputedStyle(root).getPropertyValue('--gallery-columns')
            const next = Math.max(1, parseInt(raw, 10) || 1)
            /* Only commit an actual change — resize fires constantly and
               a same-value set would re-render the whole gallery. */
            setColumns((prev) => (prev === next ? prev : next))
        }

        read()

        /* A ResizeObserver, not a window resize listener. It fires on
           this element's own box changing, which covers the viewport
           moving AND the subtler cases a resize event misses entirely:
           a scrollbar appearing as photos load and narrowing the content
           column, or any ancestor's layout shifting underneath. */
        const observer = new ResizeObserver(read)
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    /* ── Row-major distribution ───────────────────────────────────
       Photos are dealt across the columns like cards — 1, 2, 3 along
       the top, then 4, 5, 6 beneath — so the sequence reads left to
       right. Each column then stacks its own share vertically, which
       is what keeps the masonry stagger.

       `index` is carried alongside each photo because it must stay the
       position in the ORIGINAL array: it drives the lightbox, its
       prev/next stepping, and the fade's bookkeeping, none of which
       should know the photos were dealt into columns.

       Modulo, rather than filling the shortest column: it guarantees
       the left-to-right reading order. Balancing by height would read
       better at the bottom edge but would let a photo jump a column
       ahead of its neighbours. */
    const dealt = useMemo(() => {
        const buckets = Array.from({ length: columns }, () => [])
        photos.forEach((photo, index) => {
            buckets[index % columns].push({ photo, index })
        })
        return buckets
    }, [photos, columns])

    /* Indices that have finished fading in. */
    const [revealed, setRevealed] = useState(() => new Set())

    /* ── Fade-in ──────────────────────────────────────────────────
       Each photo fades once it scrolls into view AND its pixels are
       ready to paint. decode() is what gets both: it resolves only when
       the image is downloaded *and* decoded, so by the time the fade
       starts there is no work left to do.

       That ordering is the whole point. The obvious trigger — the load
       event — fires BEFORE the browser has decoded anything, so the
       animation would begin at the exact moment of the most expensive
       main-thread work and drop frames doing it.

       decode() also waits for a lazily-loaded file on its own, which is
       why there's no separate load handler here: one promise covers
       both halves. It's only ever called on a photo that has scrolled
       into view, so it doesn't defeat loading="lazy". */
    useEffect(() => {
        const root = galleryRef.current
        if (!root) return

        /* The promises below outlive a fast scroll past this component,
           so don't set state once it's gone. */
        let cancelled = false

        const reveal = (index) => {
            if (cancelled) return
            setRevealed((prev) => {
                if (prev.has(index)) return prev
                const next = new Set(prev)
                next.add(index)
                return next
            })
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue

                    const index = Number(entry.target.dataset.index)

                    /* Fades once, so stop watching immediately. */
                    observer.unobserve(entry.target)

                    const img = entry.target.querySelector('img')
                    if (!img) {
                        reveal(index)
                        continue
                    }

                    /* decode() rejects if the file is broken or the src
                       changes underneath it. Reveal anyway — a photo
                       left at opacity 0 would hold its slot open blank
                       forever, which is worse than showing the broken
                       image icon. */
                    img.decode().then(
                        () => reveal(index),
                        () => reveal(index),
                    )
                }
            },
            /* The small negative bottom margin holds the reveal back until
               the photo is properly on screen rather than one pixel over
               the edge, so the fade is something you actually see. */
            { rootMargin: '0px 0px -8% 0px' },
        )

        for (const item of root.querySelectorAll('.gallery-item')) {
            observer.observe(item)
        }

        return () => {
            cancelled = true
            observer.disconnect()
        }
        /* Re-runs when the column count changes: the items are rebuilt
           into different parents, so the old nodes are gone. Photos
           already revealed keep their class and don't fade again. */
    }, [photos, columns])

    /* Wrapping in both directions means the arrows never dead-end — from
       the last photo, Next returns to the first. */
    const showPrev = useCallback(() => {
        setOpenAt((i) => (i === null ? i : (i - 1 + photos.length) % photos.length))
    }, [photos.length])

    const showNext = useCallback(() => {
        setOpenAt((i) => (i === null ? i : (i + 1) % photos.length))
    }, [photos.length])

    const close = useCallback(() => setOpenAt(null), [])

    /* An empty folder shouldn't blow up the page. */
    if (!photos || photos.length === 0) return null

    return (
        <>
            {/* The outer element owns where the gallery sits on the page
                (width cap, top offset); the inner one owns the masonry.
                Both Selected Work pages want identical placement, so it
                lives here rather than being repeated per page. */}
            <div className="gallery-page">
                {/* is-animated is what arms the fade, and it's added here
                    rather than assumed by the CSS: the hidden state starts
                    at opacity 0, so if this component never ran the photos
                    would stay invisible forever. Scoping the hidden rule to
                    this class means the gallery degrades to plain visible
                    images instead of a blank page. */}
                <div
                    className="gallery is-animated"
                    ref={galleryRef}
                    aria-label={label}
                    role="group"
                >
                    {dealt.map((column, columnIndex) => (
                        <div className="gallery-column" key={columnIndex}>
                            {column.map(({ photo, index }) => (
                                /* A button, not a bare image: this opens a
                                   viewer, so it needs to be reachable and
                                   operable from the keyboard. Gallery.css
                                   strips the button chrome. */
                                <button
                                    type="button"
                                    className={
                                        revealed.has(index)
                                            ? 'gallery-item is-visible'
                                            : 'gallery-item'
                                    }
                                    key={photo.file}
                                    data-index={index}
                                    onClick={() => setOpenAt(index)}
                                    aria-label={`${label} ${index + 1}, view larger`}
                                >
                                    <img
                                        className="gallery-photo"
                                        src={photo.src}
                                        /* These two attributes are the whole
                                           point of the manifest. The browser
                                           derives the aspect ratio from them
                                           and reserves the right height
                                           before the file arrives, so the
                                           columns don't reshuffle as photos
                                           stream in. */
                                        width={photo.width}
                                        height={photo.height}
                                        alt={`${label} ${index + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {openAt !== null && (
                <Lightbox
                    photos={photos}
                    index={openAt}
                    label={label}
                    onClose={close}
                    onPrev={showPrev}
                    onNext={showNext}
                />
            )}
        </>
    )
}

export default Gallery
