/* Rendered inside PageLayout (see App.jsx), which supplies the navbar. */
import './MyLastNameIsYours.css'

function MyLastNameIsYours(){
    return(
        <div className="mlniy">
            {/* One heading, not two: the date range belongs to the title
                rather than standing on its own, so a screen reader should
                read it as a single line. The span is only there to put it
                on its own row. */}
            <h1 className="mlniy-title">
                MY LAST NAME IS YOURS
                <span className="mlniy-dates">(2024 -)</span>
            </h1>
        </div>
    )
}

export default MyLastNameIsYours
