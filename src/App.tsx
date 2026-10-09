import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Proxxy3D from './Proxxy3D'
import Releases from './Releases'
function App() {
    useEffect(() => {
    const sections = document.querySelectorAll('.reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])
  return (
    <main id="top">
      <nav className="navbar">
        <a className="logo" href="/">PROXXY®</a>

        <div className="nav-links">
          <a href="#artists">ARTISTS</a>
          <a href="#releases">RELEASES</a>
          <a href="#projects">PROJECTS</a>
          <a href="#about">ABOUT</a>
          <a href="mailto:hello@proxxy.com">CONTACT ↗</a>
        </div>
      </nav>

     <section className="hero">
  <div className="hero-top">
    <span>INDEPENDENT CREATIVE PLATFORM</span>
    <span>EST. 2026 — WORLDWIDE</span>
  </div>

  <div className="hero-journey">
  <div className="hero-stage">
    <div className="sculpture-container">
      <Proxxy3D />
    </div>

    <h1 className="hero-wordmark hero-wordmark--static">PROXXY</h1>
    <span className="hero-stage-note" aria-hidden="true">SWISH / DRAG + THROW / SCROLL TO ENTER</span>
  </div>

  </div>

  <div className="hero-bottom">
    <span>ARTIST MANAGEMENT / MUSIC / CREATIVE CULTURE</span>
    <span>SCROLL TO EXPLORE ↓</span>
  </div>
</section>
      <section className="artists-section reveal" id="artists">
  <div className="section-header">
    <span>01 / ROSTER</span>
    <span>SELECTED ARTISTS ↘</span>
  </div>

  <Link to="/artists/25ohms" className="artist-card">
    <div className="artist-number">001</div>

    <div className="artist-info">
      <h2 className="ohms-wordmark" aria-label="25OHMS"><span>25</span><span className="ohms-suffix">OHMS</span></h2>
      <p>ELECTRONIC / EXPERIMENTAL / SOUND DESIGN</p>
    </div>

    <div className="artist-arrow">↗</div>
  </Link>

</section>
    <Releases />
    <section className="projects-section reveal" id="projects">
  <div className="section-header">
    <span>03 / PROJECTS</span>
    <span>CREATIVE OUTPUT ↘</span>
  </div>

  <div className="project-row">
    <span className="project-number">001</span>
    <div className="project-info">
      <h2>VISUAL EXPERIMENTS</h2>
      <p>GENERATIVE ART / MOTION / 3D</p>
    </div>
    <span className="project-arrow">↗</span>
  </div>

  <div className="project-row">
    <span className="project-number">002</span>
    <div className="project-info">
      <h2>SONIC RESEARCH</h2>
      <p>SOUND DESIGN / ELECTRONIC MUSIC</p>
    </div>
    <span className="project-arrow">↗</span>
  </div>

  <div className="project-row">
    <span className="project-number">003</span>
    <div className="project-info">
      <h2>COLLABORATIONS</h2>
      <p>INTERDISCIPLINARY / CULTURE / ART</p>
    </div>
    <span className="project-arrow">↗</span>
  </div>
</section>
    <section className="about-section reveal" id="about">
  <div className="section-header">
    <span>04 / ABOUT</span>
    <span>WHO WE ARE ↘</span>
  </div>

  <div className="about-content reveal">
    <h2>
      AN INDEPENDENT PLATFORM FOR SOUND,
      ART AND CULTURE.
    </h2>

    <p>
      PROXXY operates at the intersection of electronic music,
      visual art and creative experimentation.
      Working across artist management, music releases and
      interdisciplinary projects, we connect emerging talent
      with new audiences and opportunities.
    </p>
  </div>
</section>
    <section className="contact-section reveal" id="contact">
  <div className="section-header">
    <span>05 / CONTACT</span>
    <span>GET IN TOUCH ↘</span>
  </div>

  <div className="contact-content">
    <p>BOOKINGS / COLLABORATIONS / GENERAL INQUIRIES</p>

    <a href="mailto:hello@proxxy.com" className="contact-email">
      LET'S CONNECT ↗
    </a>
  </div>

  <footer className="site-footer">
    <span>PROXXY © 2026</span>
    <span>INDEPENDENT BY DESIGN</span>
    <a href="#top">BACK TO TOP ↑</a>
  </footer>
</section>
    </main>
  )
}

export default App
