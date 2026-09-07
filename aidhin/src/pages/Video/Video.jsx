/* Rendered inside PageLayout (see App.jsx), which supplies the navbar. */
import './Video.css'

/* One entry per film, newest first — the page renders them in this
   order, so adding Uni Vol.3 means adding an object above/below this
   one and nothing else.

   `id` is the YouTube video id: the part after youtu.be/ in a share
   link, before the '?'. For
   https://youtu.be/rP7jwOajTYY?si=y3n93P6iGDXhPMMn
   that's rP7jwOajTYY. The ?si= tracking parameter isn't needed and is
   deliberately left off. */
const videos = [
    {
        id: 'rP7jwOajTYY',
        title: 'You Are The Love You Give (Uni Vol. 4)',
    },
    {
        id: '2b12nrryaUc',
        // Double quotes so the apostrophe in "We're" needs no escaping.
        title: "We're Alive (Uni Vol. 3)",
    },
    {
        id: 'uRG8XK6PgcA',
        title: 'lost hard drives, found moments',
    },
    {
        id: 'Y3ND_J5oGrU',
        title: 'some perfect days',
    },
    {
        id: 'AbFGtUAVcyg',
        title: 'in the blink of an eye (Uni Vol. 2)',
    },
    {
        id: 'OV3A1vEPR8s',
        // Double quotes again for the apostrophe.
        title: "You're more like the sunset on the sea",
    },
    {
        // Ids can legitimately start with a hyphen; it's part of the id,
        // not a typo, and needs no escaping inside the URL.
        id: '-UpSFhO9Oig',
        title: 'our silly lives go on (Uni Vol. 1)',
    },
]

function Video(){
    return(
        <div className="video">
            {videos.map(video => (
                <article className="video-item" key={video.id}>
                    {/* A real heading, so screen-reader users can jump
                        between films once there's more than one. It's
                        styled back down to body size in Video.css. */}
                    <h2 className="video-title">{video.title}</h2>

                    <iframe
                        className="video-embed"
                        /* youtube-nocookie serves the same player from
                           YouTube's privacy-enhanced domain: it plays
                           inline exactly the same, but sets no tracking
                           cookies unless the viewer actually presses
                           play.

                           rel=0 no longer removes the end-screen
                           suggestions (it did before 2018); what it does
                           now is restrict them to THIS channel, so a
                           finished film leads to Aidan's other work
                           rather than to strangers' videos.

                           Built from the id here rather than stored per
                           entry, so every video added to the array above
                           gets this automatically.

                           Note: modestbranding and showinfo are NOT here
                           on purpose. Both are deprecated and ignored —
                           they do not remove the channel overlay or the
                           "Watch on YouTube" button, which YouTube's
                           terms require the player to show. */
                        src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
                        /* Names the frame for assistive tech, which
                           would otherwise announce it as just "frame". */
                        title={video.title}
                        /* Only fetch the player when it nears the
                           viewport — matters once the list is long. */
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </article>
            ))}
        </div>
    )
}

export default Video
