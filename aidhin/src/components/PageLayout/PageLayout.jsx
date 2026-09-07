import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar.jsx'
import './PageLayout.css'

/* Shared shell for the interior pages: navbar in a left-hand column,
   page content beside it. Splash and Home have their own layouts
   and deliberately don't use this.

   Used as a layout route, so React keeps ONE instance of this (and
   of the Navbar) mounted while you move between the interior pages.
   That persistence is what lets the Selected Work menu animate
   closed on navigation instead of blinking out of existence.

   The navbar is wrapped in .page-nav so this file owns the column
   width; Navbar.css stays unaware of how it's placed. */
function PageLayout(){
    return(
        <div className="page-layout">
            <div className="page-nav">
                <Navbar />
            </div>
            <main className="page-content">
                <Outlet />
            </main>
        </div>
    )
}

export default PageLayout
