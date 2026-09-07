import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import './Navbar.css'

// NavLink can hand us the active state; add 'active' so the CSS can
// underline whichever page we're currently on.
const linkClass = ({ isActive }) =>
    isActive ? 'navbar-link active' : 'navbar-link'

/* collapsible={false} opts a page out of the small-screen hamburger,
   so the full menu shows at every width (Home does this — the menu
   is that page's whole content). */
function Navbar({ collapsible = true }){
    const location = useLocation()

    // Expanded when the current page is one of the Selected Work options,
    // so Portraits/Travel are visible (and underlined) on arrival.
    const onSelectedWork = location.pathname.startsWith('/selected-work')
    const [workOpen, setWorkOpen] = useState(onSelectedWork)

    // Whether the small-screen hamburger menu is showing.
    const [menuOpen, setMenuOpen] = useState(false)

    // The navbar stays mounted across the interior pages, so leaving
    // Portraits/Travel gives the menu a real open -> closed change to
    // animate. Adjusting state during render (rather than in an effect)
    // is React's documented way to react to a changed value: it only
    // runs when the boolean actually flips, so manual toggles stick.
    const [wasOnSelectedWork, setWasOnSelectedWork] = useState(onSelectedWork)
    if (wasOnSelectedWork !== onSelectedWork) {
        setWasOnSelectedWork(onSelectedWork)
        setWorkOpen(onSelectedWork)
    }

    // Close the hamburger menu after navigating, so it doesn't stay
    // open over the page the reader just chose.
    const [lastPath, setLastPath] = useState(location.pathname)
    if (lastPath !== location.pathname) {
        setLastPath(location.pathname)
        setMenuOpen(false)
    }

    return(
        <nav className={collapsible ? 'navbar' : 'navbar navbar-static'}>
            {/* Outside the collapsible area, so it stays visible at every
                width — the hamburger only hides the rest of the menu. */}
            <Link to="/" className="navbar-brand">
                AIDAN NGO
            </Link>

            {/* Only rendered visibly at <= 640px; CSS hides it above that.
                The three bars are separate elements so they can transform
                into an X rather than swapping to a different icon. */}
            <button
                type="button"
                className={menuOpen ? 'navbar-hamburger is-open' : 'navbar-hamburger'}
                aria-expanded={menuOpen}
                aria-controls="navbar-items"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen(open => !open)}
            >
                <span className="navbar-hamburger-bar" aria-hidden="true"></span>
                <span className="navbar-hamburger-bar" aria-hidden="true"></span>
                <span className="navbar-hamburger-bar" aria-hidden="true"></span>
            </button>

            <div
                id="navbar-items"
                className={menuOpen ? 'navbar-items is-open' : 'navbar-items'}
            >
                <div className="navbar-items-inner">
                    {/* A button, not a link — it toggles options rather than
                        navigating anywhere itself. */}
                    <button
                        type="button"
                        className="navbar-link navbar-toggle"
                        aria-expanded={workOpen}
                        aria-controls="selected-work-options"
                        onClick={() => setWorkOpen(open => !open)}
                    >
                        Selected Work
                    </button>

                    {/* Always rendered so it can animate. The CSS collapses it
                        to zero height when 'is-open' is absent. */}
                    <div
                        className={workOpen ? 'navbar-sublist is-open' : 'navbar-sublist'}
                        id="selected-work-options"
                    >
                        <div className="navbar-sublist-inner">
                            <NavLink to="/selected-work/portraits" className={linkClass}>
                                Portraits
                            </NavLink>
                            <NavLink to="/selected-work/travel" className={linkClass}>
                                Travel
                            </NavLink>
                        </div>
                    </div>

                    <NavLink to="/my-last-name-is-yours" className={linkClass}>
                        My Last Name Is Yours
                    </NavLink>
                    <NavLink to="/video" className={linkClass}>
                        Video
                    </NavLink>
                    <NavLink to="/about" className={linkClass}>
                        About
                    </NavLink>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
