import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SoundCloudPlayer from './SoundCloudPlayer'

function Artist25ohms() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <main className="artist-page">
      <nav className="navbar">
        <Link className="logo" to="/">PROXXY®</Link>
        <Link className="artist-back" to="/">← BACK TO PROXXY</Link>
      </nav>

      <section className="artist-profile">
        <div className="section-header">
          <span>PROXXY / ARTIST 001</span>
          <span>ELECTRONIC / EXPERIMENTAL</span>
        </div>

        <h1 className="ohms-wordmark" aria-label="25OHMS"><span>25</span><span className="ohms-suffix">OHMS</span></h1>

        <p>
          SOUND DESIGN / ELECTRONIC MUSIC / AUDIOVISUAL ART
        </p>
      </section>

      <div className="artist-overview">
      <section className="artist-gigs-section" aria-labelledby="artist-gigs-title">
        <div className="section-header">
          <span>01 / LIVE</span>
          <span>RESIDENT ADVISOR ↘</span>
        </div>
        <div className="artist-gigs-heading">
          <h2 id="artist-gigs-title">UPCOMING GIGS</h2>
          <a className="artist-back" href="https://ra.co/dj/25ohms" target="_blank" rel="noopener noreferrer">
            VIEW ON RA ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        <div className="artist-gigs-empty">
          <span className="artist-gigs-index" aria-hidden="true">—</span>
          <div>
            <h3>NEXT DATES</h3>
            <p>Check Resident Advisor for the latest announced shows and ticket details.</p>
          </div>
          <a className="artist-gigs-link" href="https://ra.co/dj/25ohms" target="_blank" rel="noopener noreferrer">
            25OHMS ON RA ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>

      <section className="artist-player-section" aria-labelledby="artist-player-title">
        <div className="section-header">
          <span>02 / LISTEN</span>
          <a className="artist-back" href="https://soundcloud.com/25ohms" target="_blank" rel="noopener noreferrer">
            25OHMS ON SOUNDCLOUD ↗
          </a>
        </div>
        <h2 id="artist-player-title">LATEST TRACKS</h2>
        <div className="artist-player-frame">
          <div className="artist-player-label"><span>25OHMS / SOUNDCLOUD</span><span>NEWEST FIRST ↓</span></div>
          <SoundCloudPlayer />
        </div>
        <p className="artist-player-caption">
          <a href="https://soundcloud.com/25ohms/tracks" target="_blank" rel="noopener noreferrer">
            ALL TRACKS ON SOUNDCLOUD ↗
          </a>
        </p>
      </section>
      </div>
    </main>
  )
}

export default Artist25ohms
