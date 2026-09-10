/* Rendered inside PageLayout (see App.jsx), which supplies the navbar. */
import Carousel from '../../components/Carousel/Carousel.jsx'
import { myLastNameIsYours } from '../../photos/galleries.js'
import './MyLastNameIsYours.css'

function MyLastNameIsYours(){
    return(
        <div className="mlniy">
            {/* One heading, not two: the date range belongs to the title
                rather than standing on its own, so a screen reader should
                read it as a single line. The span is only there to put it
                on its own row. */}
            <h1 className="mlniy-title">
                MY LAST NAME IS YOURS (2024 - )
                {/* <span className="mlniy-dates">(2024 -)</span> */}
            </h1>

            {/* Photos come from src/photos/mylastnameisyours/, ordered by
                filename - so renaming to 01.jpg, 02.jpg is what sets the
                sequence, and nothing here needs editing.

                `label` isn't shown; it names the carousel for screen
                readers and supplies each photo's alt text. */}
            <Carousel photos={myLastNameIsYours} label="My Last Name Is Yours" />
        </div>
    )
}

export default MyLastNameIsYours
