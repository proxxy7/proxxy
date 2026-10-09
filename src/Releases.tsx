import { artistMusicLinks, releases } from './releaseCatalog'

export default function Releases() {
  return (
    <section className="releases-section reveal" id="releases" aria-labelledby="releases-title">
      <div className="section-header">
        <span>02 / DISCOGRAPHY</span>
        <span>SELECTED RELEASES ↘</span>
      </div>

      <div className="releases-intro">
        <div className="release-heading-block">
          <span className="release-eyebrow">PROXXY / SOUND ARCHIVE</span>
          <h2 id="releases-title"><span>NEW</span><span className="frequency-heading">FREQUENCIES<span className="frequency-dot">.</span></span></h2>
        </div>
        <p>Music from the PROXXY roster. Explore each release and find your place to listen.</p>
      </div>

      <div className="releases-grid">
        {releases.map((release, index) => (
          <article className={`release-card release-card--${release.id}`} key={release.id}>
            <div className="release-card-topline"><span>0{index + 1}</span><span>RELEASE ↘</span></div>
            <a className="release-artwork" href={release.playlistUrl} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${release.title} on SoundCloud (opens in a new tab)`}>
              {release.artwork ? (
                <img src={release.artwork} alt={`${release.title} cover artwork`} loading="lazy" />
              ) : (
                <span className="release-art-title">{release.title}</span>
              )}
              <span className="release-status">
                {release.status === 'released' ? 'OUT NOW' : release.status === 'upcoming' ? 'COMING SOON' : 'ANNOUNCED'}
              </span>
            </a>
            <div className="release-details">
              <div>
                <h3>{release.id === 'generationohmega' ? <><span className="release-title-prefix">generation</span><span>OHMEGA</span></> : <><span className="release-title-prefix" aria-hidden="true">&nbsp;</span><span>FIVEBYFIVE</span></>}</h3>
              </div>
              <span className="release-title-symbol" aria-hidden="true">Ω</span>
            </div>
            <div className="release-signal" aria-hidden="true">
              {Array.from({ length: 48 }, (_, bar) => <i key={bar} style={{ height: `${18 + Math.abs(Math.sin(bar * (index ? 0.61 : 0.32)) * Math.cos(bar * 0.17)) * 82}%` }} />)}
            </div>
            <details className="release-listening" open>
              <summary>
                <span>{release.links.length ? 'CHOOSE YOUR FREQUENCY' : 'RELEASE INFO'}</span>
                <span className="release-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="release-listening-content">
                <p className="release-catalog">{release.artist} / {release.title}</p>
                {release.links.length ? (
                  <ul className="music-links" aria-label={`Listen to ${release.title}`}>
                    {release.links.map((link) => (
                      <li key={link.platform}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <span>{link.platform}</span>
                          <span aria-hidden="true">↗</span>
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="release-pending">{release.status === 'upcoming' ? 'Release details and listening links coming soon.' : 'Listening links will appear here when available.'}</p>
                )}
              </div>
            </details>
          </article>
        ))}
      </div>
      <div className="artist-music">
        <h3><span>KEEP LISTENING</span><strong>25OHMS ↗</strong></h3>
        <ul className="music-links" aria-label="25OHMS music profiles">
          {artistMusicLinks.map((link) => (
            <li key={link.platform}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <span>{link.platform}</span><span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
          <li><a href="https://linktr.ee/25ohms" target="_blank" rel="noopener noreferrer">ALL MUSIC &amp; SOCIALS <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>
        </ul>
      </div>
      <div className="section-footer">
        <a className="release-inquiry" href="mailto:hello@proxxy.com">RELEASE INQUIRIES ↗</a>
      </div>
    </section>
  )
}
