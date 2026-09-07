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
