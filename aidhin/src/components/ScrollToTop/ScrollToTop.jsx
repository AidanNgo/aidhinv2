import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/* Every interior page scrolls the window itself, and a client-side
   navigation doesn't touch the window's scroll position — nothing is
   reloaded, only the content below the navbar is swapped. So leaving
   Portraits half-way down and choosing Travel would drop you half-way
   down Travel, which is never what you want from a fresh page.

   Rendered once inside the router (see App.jsx). It draws nothing; it
   exists purely for the effect below.

   useLayoutEffect, not useEffect: it runs before the browser paints,
   so the new page is only ever seen from the top. With useEffect the
   old scroll position gets one painted frame first, which reads as a
   flash of the middle of the page.

   Keyed on pathname alone, so a change of query string or hash - if
   either is ever used - doesn't yank the reader back to the top. */
function ScrollToTop() {
    const { pathname } = useLocation()

    /* Back and forward are the other way to change page, and there the
       browser restores the scroll position itself - after the effect
       below has run, so it would win and put you back where you were.
       'manual' hands that job to us so every arrival is treated alike,
       whichever way you got there.

       Set once on mount, and put back on the way out so the setting
       doesn't outlive the app in a shared history entry. */
    useLayoutEffect(() => {
        if (!('scrollRestoration' in window.history)) return

        const previous = window.history.scrollRestoration
        window.history.scrollRestoration = 'manual'

        return () => {
            window.history.scrollRestoration = previous
        }
    }, [])

    useLayoutEffect(() => {
        /* 'instant' rather than the default, which would follow a
           scroll-behavior: smooth if one is ever added to the page.
           A navigation should arrive at the top, not travel there. */
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }, [pathname])

    return null
}

export default ScrollToTop
