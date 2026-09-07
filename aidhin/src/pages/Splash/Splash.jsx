import { Link, useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'
import './Splash.css'
import sunrisePhoto from '../../photos/splash/sunrise-bedroom-window.jpg'

function Splash(){
    const navigate = useNavigate()

    function enterHome(event){
        // Let cmd/ctrl/shift clicks open a new tab the way users expect.
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

        event.preventDefault()

        // Cross-fade into Home where the browser supports it. flushSync makes
        // React commit the route change inside the transition callback, which
        // is what lets the browser capture the before/after frames.
        if (typeof document.startViewTransition === 'function') {
            const transition = document.startViewTransition(
                () => flushSync(() => navigate('/home'))
            )
            // An interrupted transition (tab hidden, or the reader hits Back
            // mid-fade) rejects this promise. The navigation still happens,
            // so swallow it rather than logging an uncaught rejection.
            transition.finished.catch(() => {})
        } else {
            navigate('/home')
        }
    }

    return(
        <div className="splash">
            <div className="name-row">
                <div className="name">AIDAN</div>
                <div className="name">NGO</div>
            </div>

            {/* Still a real <Link>, so right-click, middle-click and
                screen readers all behave normally. */}
            <Link
                to="/home"
                className="splash-photo-link"
                aria-label="Enter"
                onClick={enterHome}
            >
                <img
                    className="splash-photo"
                    src={sunrisePhoto}
                    alt="Sunrise through a bedroom window"
                />
            </Link>

            <div className="name-row">
                <div className="name">NGO</div>
                <div className="name">AIDAN</div>
            </div>
        </div>
    )
}

export default Splash
