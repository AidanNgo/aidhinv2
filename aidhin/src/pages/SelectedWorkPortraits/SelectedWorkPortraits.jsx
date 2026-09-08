/* Rendered inside PageLayout (see App.jsx), which supplies the navbar. */
import Gallery from '../../components/Gallery/Gallery.jsx'
import { portraits } from '../../photos/galleries.js'

/* No heading by choice — the navbar already shows which page this is,
   and the photos start straight away.

   `label` isn't shown; it names the gallery for screen readers and
   supplies each photo's alt text, since the images have no captions. */
function SelectedWorkPortraits(){
    return <Gallery photos={portraits} label="Portrait" />
}

export default SelectedWorkPortraits
