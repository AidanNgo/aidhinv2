import './Home.css'
import Navbar from '../../components/Navbar/Navbar.jsx'

function Home(){
    return(
        <div className="home">
            {/* The menu is this page's entire content, so it stays
                fully visible instead of collapsing to a hamburger. */}
            <Navbar collapsible={false} />
        </div>
    )
}

export default Home
