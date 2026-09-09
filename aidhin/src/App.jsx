import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import PageLayout from './components/PageLayout/PageLayout.jsx'
import Splash from './pages/Splash/Splash.jsx'
import Home from './pages/Home/Home.jsx'
import About from './pages/About/About.jsx'
import Video from './pages/Video/Video.jsx'
import MyLastNameIsYours from './pages/MyLastNameIsYours/MyLastNameIsYours.jsx'
import SelectedWorkPortraits from './pages/SelectedWorkPortraits/SelectedWorkPortraits.jsx'
import SelectedWorkTravel from './pages/SelectedWorkTravel/SelectedWorkTravel.jsx'

function App() {
  /* Right-click and drag are the two one-step ways to save a photo, so
     both are blocked - but ONLY on images. Blocking the whole page would
     also take away back, open-in-new-tab and copying text, none of which
     has anything to do with the photos.

     One document-level pair of listeners rather than handlers on each
     <img>: it covers the gallery, the lightbox, About and Splash alike,
     and any image added later is covered without remembering to opt in.

     Worth being straight about what this is: a deterrent against the
     casual save, not protection. The files are still delivered to the
     browser, so devtools, the network tab and a screenshot all still
     work. Nothing running client-side can change that. */
  useEffect(() => {
    const blockOnImages = (event) => {
      if (event.target instanceof HTMLImageElement) event.preventDefault()
    }

    document.addEventListener('contextmenu', blockOnImages)
    document.addEventListener('dragstart', blockOnImages)

    return () => {
      document.removeEventListener('contextmenu', blockOnImages)
      document.removeEventListener('dragstart', blockOnImages)
    }
  }, [])

  return (
    <Routes>
      {/* Splash and Home each own their whole screen. */}
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />

      {/* The interior pages share one PageLayout instance. Moving
          between them swaps only the content, so the navbar stays
          mounted and its menu can animate. Add new interior pages here. */}
      <Route element={<PageLayout />}>
        <Route path="/selected-work/portraits" element={<SelectedWorkPortraits />} />
        <Route path="/selected-work/travel" element={<SelectedWorkTravel />} />
        <Route path="/my-last-name-is-yours" element={<MyLastNameIsYours />} />
        <Route path="/video" element={<Video />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}

export default App
