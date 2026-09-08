import { useEffect, useRef } from 'react'
import './Lightbox.css'

/* Full-screen photo viewer. Rendered only while open, so all the effects
   below double as its open/close lifecycle.

   Props:
     photos   - the whole gallery array
     index    - which photo is showing
     label    - gallery name, for the dialog's accessible name
     onClose  - dismiss
     onPrev / onNext - step, already wrapped by the caller
*/
function Lightbox({ photos, index, label, onClose, onPrev, onNext }){
    const dialogRef = useRef(null)
    const closeRef = useRef(null)

    const photo = photos[index]

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
            if (event.key === 'ArrowLeft') {
                event.preventDefault()
                onPrev()
                return
            }
            if (event.key === 'ArrowRight') {
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
    }, [onClose, onPrev, onNext])

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
       flashing empty while a multi-megabyte photo downloads. */
    useEffect(() => {
        if (photos.length < 2) return
        const around = [
            photos[(index + 1) % photos.length],
            photos[(index - 1 + photos.length) % photos.length],
        ]
        for (const neighbour of around) {
            const img = new Image()
            img.src = neighbour.src
        }
    }, [photos, index])

    if (!photo) return null

    const many = photos.length > 1

    return (
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

            {many && (
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

            {many && (
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
        </div>
    )
}

export default Lightbox
