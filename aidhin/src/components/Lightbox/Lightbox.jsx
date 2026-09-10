import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Lightbox.css'

/* Full-screen photo viewer. Rendered only while open, so all the effects
   below double as its open/close lifecycle.

   Props:
     photos   - the whole collection array
     index    - which photo is showing
     label    - collection name, for the dialog's accessible name
     onClose  - dismiss
     onPrev / onNext - step. OPTIONAL, and both together: leave them out
                and the viewer becomes a dead end — no arrows, no arrow
                keys, no neighbour prefetch. Closing is the only way out.

   The gallery passes them, so its lightbox steps through the whole set.
   The carousel deliberately doesn't: it already has arrows of its own on
   the page, and stepping in two places at once means the reader can lose
   track of which photo they'll be back on when the viewer closes. There,
   the lightbox is strictly "look closer at THIS one".
*/
function Lightbox({ photos, index, label, onClose, onPrev, onNext }){
    const dialogRef = useRef(null)
    const closeRef = useRef(null)

    const photo = photos[index]

    /* Both handlers or neither — a viewer with one arrow would be a bug
       rather than a design. More than one photo is the other half of it:
       a single-photo collection has nowhere to step to. */
    const canStep = Boolean(onPrev && onNext) && photos.length > 1

    /* ── Keyboard ─────────────────────────────────────────────────
       Bound to the document rather than the dialog so the arrows work
       no matter which control happens to hold focus.

       Tab is handled here too: a dialog that doesn't trap focus lets
       Tab walk into the gallery behind it, where a keyboard user is
       then stuck operating a page they can't see. Cycling within the
       three buttons keeps that from happening. */
    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }
            /* Left alone when stepping is off, rather than swallowed:
               preventDefault on a key this viewer has no use for would
               take it away from the browser too. */
            if (canStep && event.key === 'ArrowLeft') {
                event.preventDefault()
                onPrev()
                return
            }
            if (canStep && event.key === 'ArrowRight') {
                event.preventDefault()
                onNext()
                return
            }
            if (event.key !== 'Tab') return

            const focusable = dialogRef.current?.querySelectorAll('button')
            if (!focusable || focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', onKeyDown)
        return () => document.removeEventListener('keydown', onKeyDown)
    }, [onClose, onPrev, onNext, canStep])

    /* ── Focus ────────────────────────────────────────────────────
       Remember whichever thumbnail was clicked, move focus into the
       dialog, and hand it back on close — otherwise focus falls to the
       top of the document and a keyboard user loses their place in a
       gallery that might be fifty photos long. */
    useEffect(() => {
        const opener = document.activeElement
        closeRef.current?.focus()
        return () => {
            if (opener instanceof HTMLElement) opener.focus()
        }
    }, [])

    /* ── Scroll lock ──────────────────────────────────────────────
       Without this the page scrolls behind the overlay. Hiding the
       scrollbar reclaims its width, which would shift the whole layout
       left as the lightbox opens, so the same width is paid back as
       padding. */
    useEffect(() => {
        const { body, documentElement } = document
        const scrollbar = window.innerWidth - documentElement.clientWidth
        const prevOverflow = body.style.overflow
        const prevPadding = body.style.paddingRight

        body.style.overflow = 'hidden'
        if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

        return () => {
            body.style.overflow = prevOverflow
            body.style.paddingRight = prevPadding
        }
    }, [])

    /* Fetch the neighbours so stepping through feels instant instead of
       flashing empty while a multi-megabyte photo downloads. Skipped
       entirely when there's no stepping — downloading two photos nobody
       can reach from here is pure waste on a phone connection. */
    useEffect(() => {
        if (!canStep) return
        const around = [
            photos[(index + 1) % photos.length],
            photos[(index - 1 + photos.length) % photos.length],
        ]
        for (const neighbour of around) {
            const img = new Image()
            img.src = neighbour.src
        }
    }, [photos, index, canStep])

    if (!photo) return null

    /* ── Why this is a portal ─────────────────────────────────────
       A full-screen overlay belongs to the VIEWPORT, not to whichever
       corner of the page happened to render it — and position: fixed
       alone doesn't guarantee that. Any ancestor with a transform (or a
       filter, or a container-type) becomes the containing block for
       fixed descendants AND opens a new stacking context, and both
       halves of that break this dialog:

         - inset: 0 then covers that ancestor's box instead of the
           screen, so the backdrop stops short of the edges.
         - z-index: 100 is measured inside that ancestor's context, so
           it can't rise above anything painted over the ancestor
           itself — the navbar's z-index: 5 wins, whatever number is
           written here. No z-index can escape a stacking context.

       Which is exactly what happened on My Last Name Is Yours: that
       page centres itself with a translateX (see --mlniy-x), so the
       navbar stayed fully visible and clickable on top of the viewer,
       while the gallery — no transform anywhere above it — looked fine.

       Rendering into <body> puts the dialog outside every one of those
       ancestors, so it behaves the same wherever it's used and can't be
       broken by a page adding a transform later.

       React events still bubble along the React tree rather than the
       DOM, so a portal is NOT a way out of a parent's onKeyDown — see
       the note in Carousel.jsx about keeping this a sibling of the
       carousel region. */
    return createPortal(
        <div
            className="lightbox"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${label} — photo ${index + 1} of ${photos.length}`}
            /* Clicking the backdrop closes; clicking the photo itself
               must not, so the image stops the event going up. */
            onClick={onClose}
        >
            <button
                type="button"
                className="lightbox-close"
                onClick={onClose}
                ref={closeRef}
                aria-label="Close"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 5L19 19M19 5L5 19" />
                </svg>
            </button>

            {canStep && (
                <button
                    type="button"
                    className="lightbox-nav lightbox-prev"
                    onClick={(event) => { event.stopPropagation(); onPrev() }}
                    aria-label="Previous photo"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M15 4L7 12l8 8" />
                    </svg>
                </button>
            )}

            <img
                className="lightbox-photo"
                src={photo.src}
                width={photo.width}
                height={photo.height}
                alt={`${label} ${index + 1}`}
                onClick={(event) => event.stopPropagation()}
            />

            {canStep && (
                <button
                    type="button"
                    className="lightbox-nav lightbox-next"
                    onClick={(event) => { event.stopPropagation(); onNext() }}
                    aria-label="Next photo"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M9 4l8 8-8 8" />
                    </svg>
                </button>
            )}
        </div>,
        document.body,
    )
}

export default Lightbox
