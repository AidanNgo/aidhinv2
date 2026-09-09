/* Rendered inside PageLayout (see App.jsx), which supplies the navbar. */
import Gallery from '../../components/Gallery/Gallery.jsx'
import { travel } from '../../photos/galleries.js'

/* The same Gallery component Portraits uses. Everything that makes the
   gallery work - the masonry, the row-major dealing, the lightbox, the
   fade-in, the responsive column count - lives in that component, so
   this page is only two decisions: which photo set, and what to call it.

   Which also means the two galleries can't drift apart: a change to
   Gallery.css or Gallery.jsx shows up on both pages at once.

   `label` isn't shown; it names the gallery for screen readers and
   supplies each photo's alt text, since the images have no captions. */
function SelectedWorkTravel(){
    return <Gallery photos={travel} label="Travel" />
}

export default SelectedWorkTravel
