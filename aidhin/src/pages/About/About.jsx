/* Rendered inside PageLayout (see App.jsx), which supplies the navbar. */
import './About.css'
import aboutPhoto from '../../photos/about/about-picture.jpg'

function About(){
    return(
        <div className="about">
            {/* The figure holds the photo and its credit, and nothing
                else — the bio is a sibling, not part of the figure.
                About.css sizes both to the photo's width, which is what
                keeps their left edges in line. */}
            <figure className="about-figure">
                <img
                    className="about-photo"
                    src={aboutPhoto}
                    alt="Portrait of me"
                />
                <figcaption className="about-credit">
                    Photo by Manoo Sirivelu
                </figcaption>
            </figure>

            <div className="about-bio">
                <div>
                    <b>Aidan Ngo</b> (b. 2004) is a Chinese American photographer raised and based in Houston, Texas. His work is informed by his immigrant roots and lived experience. Through gentle observation, portraiture, and brief poetry, his practice navigates the emotional landscape of family, inheritance, intergenerational sacrifice, and the aches of belonging. For him, photography becomes a way to capture the silences strung between people.
                </div>
                <br />
                <div>
                    Outside of making pictures, Aidan creates videos that capture how the world feels through his eyes. From travels to college youth, his storytelling always traces back to two compelling forces: presence and love.  
                </div>
                <br />
                <div>
                    Aidan graduated in 2026 from the University of Texas at Austin with a B.S. in Computer Science.
                </div>
                <br />
                <div>
                    <a className="about-email" href="mailto:aidhinngo@gmail.com">
                        aidhinngo@gmail.com
                    </a>
                </div>
            </div>

            {/* Icons are inline SVG rather than image files: they take
                their colour from the surrounding text via currentColor,
                so they follow the light/dark theme with no second asset,
                and they stay sharp at any size.

                The <svg> is aria-hidden and the accessible name lives on
                the link, so a screen reader announces "Instagram" once
                rather than describing the artwork. */}
            <div className="about-socials">
                <a
                    className="about-social"
                    href="https://www.instagram.com/aid.hin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <rect x="2" y="2" width="20" height="20" rx="5.5" />
                        <circle cx="12" cy="12" r="4.5" />
                        <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" stroke="none" />
                    </svg>
                </a>

                <a
                    className="about-social"
                    href="https://www.youtube.com/@aid_hin/videos"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                >
                    {/* One path, evenodd: the play triangle is a hole in
                        the solid body rather than a shape painted in the
                        background colour, so it stays correct on any
                        backdrop. */}
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5 4h14a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zM9.75 8.25L15.75 12L9.75 15.75Z"
                        />
                    </svg>
                </a>
            </div>
        </div>
    )
}

export default About
