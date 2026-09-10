import { useCallback, useEffect, useState } from 'react'
import Lightbox from '../Lightbox/Lightbox.jsx'
import './Carousel.css'

/* One photo at a time, arrows either side to step through it.
 *
 * Props:
 *   photos - array of { file, src, width, height } from photos/galleries.js
 *   label  - collection name, for alt text and the region's accessible name
 *
 * THE SHAPE PROBLEM
 * These photos run from 0.66 (upright) to 1.61 (wide), and none may be
 * cropped. If the frame sized itself to each photo, it would change shape
 * on every step - the arrows would jump around and everything below would
 * slide up and down as you clicked.
 *
 * So the stage is a FIXED box and each photo is scaled to fit inside it,
 * whole. A wide photo meets the left and right edges, an upright one meets
 * the top and bottom, and neither is ever cut. Nothing on the page moves
 * between one photo and the next.
 *
 * The arrows sit OUTSIDE that box, as siblings of it in a flex row, so
 * they never cover any part of a picture.
 */
function Carousel({ photos, label }){
    /* Both halves of the cross-fade live in ONE piece of state, updated
       together. `at` is the photo showing; `from` is the one being faded
       out, or null when nothing is in transit.

       Keeping them together is what makes rapid clicking correct: the
       updater below reads the previous state rather than the values from
       whichever render the click happened in, so two clicks in the same
       frame still step exactly two photos. */
    const [view, setView] = useState({ at: 0, from: null })

    /* ── The lightbox ─────────────────────────────────────────────
       Clicking the photo opens the same full-screen viewer the gallery
       uses, on the photo you clicked.

       Deliberately WITHOUT onPrev/onNext, which is what makes it a dead
       end: no arrows inside it, and its arrow keys do nothing. The way
       on to the next photo is to close it and use the carousel's own
       arrows, which is the point — one place is in charge of where you
       are in the sequence, so you always come back to the photo you
       were looking at rather than somewhere the viewer moved you to. */
    const [zoomed, setZoomed] = useState(false)

    const openZoom = useCallback(() => setZoomed(true), [])
    const closeZoom = useCallback(() => setZoomed(false), [])

    /* The sequence has a first photo and a last one, and stops at both -
       it doesn't wrap around to the start. (The gallery's lightbox does
       wrap; this is deliberately the other behaviour.)

       Returning `prev` unchanged at either end matters for more than
       tidiness: React bails out of the re-render when the state object
       is identical, so a click on a spent arrow can't kick off a
       pointless cross-fade of a photo dissolving into itself. */
    const step = useCallback((delta) => {
        /* Frozen while the lightbox is up. The overlay already covers the
           arrows so they can't be clicked, but the keyboard can still
           reach this, and a carousel that quietly moved on underneath
           the viewer would drop you somewhere else on close. One guard
           here rather than at each caller, so nothing can step by a
           route this forgets about. */
        if (zoomed) return

        setView((prev) => {
            const next = prev.at + delta
            if (next < 0 || next > photos.length - 1) return prev
            return { at: next, from: prev.at }
        })
    }, [photos.length, zoomed])

    const showPrev = useCallback(() => step(-1), [step])
    const showNext = useCallback(() => step(1), [step])

    /* Fetch the neighbours so a click swaps the photo immediately instead
       of fading in over an empty frame while a file downloads. The fade
       makes this matter more than it did, not less. */
    useEffect(() => {
        if (photos.length < 2) return
        const around = [
            photos[(view.at + 1) % photos.length],
            photos[(view.at - 1 + photos.length) % photos.length],
        ]
        for (const neighbour of around) {
            const img = new Image()
            img.src = neighbour.src
        }
    }, [photos, view.at])

    /* An empty folder shouldn't blow up the page. */
    if (!photos || photos.length === 0) return null

    const photo = photos[view.at]
    const leaving = view.from === null ? null : photos[view.from]
    const many = photos.length > 1
    const atStart = view.at === 0
    const atEnd = view.at === photos.length - 1

    /* Scoped to this region rather than the document: arrow keys belong
       to whatever the reader is actually using, and a page-wide listener
       would hijack them. Focus one of the arrows and the keys work,
       because the event bubbles up to here. */
    const onKeyDown = (event) => {
        if (!many) return
        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            showPrev()
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            showNext()
        }
    }

    return (
        <>
        <div
            className="carousel"
            role="group"
            aria-roledescription="carousel"
            aria-label={label}
            onKeyDown={onKeyDown}
        >
            {many && (
                <button
                    type="button"
                    className="carousel-nav carousel-prev"
                    onClick={showPrev}
                    aria-label="Previous photo"
                    aria-disabled={atStart}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M15 4L7 12l8 8" />
                    </svg>
                </button>
            )}

            <div className="carousel-stage">
                {/* aria-live so a screen reader announces the new photo
                    when an arrow is pressed. Without it the image silently
                    swaps and nothing is read out. */}
                <div className="carousel-frame" aria-live="polite">
                    {/* The photo being left behind, fading out underneath.
                        It has to fade rather than simply vanish: photos are
                        different shapes, so an upright one never fully
                        covers the wide one before it, and the uncovered
                        edges would pop out of existence at the end.

                        Removed when its own animation reports finished,
                        which keeps the timing in the CSS rather than
                        duplicating a duration here in JS. */}
                    {leaving && (
                        <div className="carousel-layer" aria-hidden="true">
                            <img
                                className="carousel-photo carousel-photo-out"
                                key={`out-${view.from}`}
                                src={leaving.src}
                                width={leaving.width}
                                height={leaving.height}
                                alt=""
                                onAnimationEnd={() => {
                                    setView((prev) => ({ ...prev, from: null }))
                                }}
                            />
                        </div>
                    )}

                    {/* A button, not a bare image — same reasoning as the
                        gallery's thumbnails: this opens a viewer, so it has
                        to be reachable and operable from the keyboard.

                        No key on the button, deliberately. The key belongs
                        on the img inside it (see below), which leaves this
                        element in place from one photo to the next — so a
                        keyboard user who has tabbed to the photo and is
                        stepping with the arrow keys keeps their focus
                        instead of having it thrown back to the top of the
                        document on every step. */}
                    <button
                        type="button"
                        className="carousel-layer carousel-layer-zoom"
                        onClick={openZoom}
                        aria-label={`${label} ${view.at + 1}, view larger`}
                    >
                        {/* key on the index rather than the file: it forces
                            a fresh element per step, which is what restarts
                            the fade. Without it React would reuse the
                            element and the animation would never replay. */}
                        <img
                            className="carousel-photo carousel-photo-in"
                            key={`in-${view.at}`}
                            src={photo.src}
                            /* The stage governs the size, so these aren't
                               holding the layout open the way they do in the
                               masonry gallery - they give the browser the
                               aspect ratio so it can scale correctly on the
                               first frame rather than after decoding. */
                            width={photo.width}
                            height={photo.height}
                            alt={`${label} ${view.at + 1}`}
                            decoding="async"
                        />
                    </button>
                </div>
            </div>

            {many && (
                <button
                    type="button"
                    className="carousel-nav carousel-next"
                    onClick={showNext}
                    aria-label="Next photo"
                    aria-disabled={atEnd}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M9 4l8 8-8 8" />
                    </svg>
                </button>
            )}
        </div>

        {/* Outside .carousel, not inside it. The region above has an
            onKeyDown for its arrow keys, and anything rendered within it
            would bubble every keystroke straight into that handler — so
            a lightbox nested there would step the carousel behind itself
            despite having no arrows of its own.

            The Lightbox portals its DOM into <body>, but that does NOT
            make the placement here academic: React dispatches events
            along the React tree, not the DOM one, so a portal rendered
            inside the region above would still feed that handler. Being
            a sibling is what actually keeps the keys apart. */}
        {zoomed && (
            <Lightbox
                photos={photos}
                index={view.at}
                label={label}
                onClose={closeZoom}
            />
        )}
        </>
    )
}

export default Carousel
