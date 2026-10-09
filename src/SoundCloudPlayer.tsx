import { useEffect, useRef, useState } from 'react'

type Track = { id: number; title: string; artwork_url: string | null; duration: number; permalink_url: string; user: { avatar_url: string } }
type Widget = {
  bind: (event: string, callback: (event: { currentPosition: number }) => void) => void
  unbind: (event: string) => void
  getSounds: (callback: (tracks: Track[]) => void) => void
  getCurrentSoundIndex: (callback: (index: number) => void) => void
  toggle: () => void
  skip: (index: number) => void
  play: () => void
  pause: () => void
  seekTo: (position: number) => void
}
type SoundCloud = { Widget: ((iframe: HTMLIFrameElement) => Widget) & { Events: Record<string, string> } }
let sdkPromise: Promise<SoundCloud> | undefined
function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = new Promise<SoundCloud>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://w.soundcloud.com/player/api.js'
      script.onload = () => resolve((window as unknown as { SC: SoundCloud }).SC)
      script.onerror = () => { sdkPromise = undefined; script.remove(); reject(new Error('SoundCloud unavailable')) }
      document.head.appendChild(script)
    })
  }
  return sdkPromise
}
function time(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
export default function SoundCloudPlayer() {
  const iframe = useRef<HTMLIFrameElement>(null)
  const widget = useRef<Widget | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [current, setCurrent] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [error, setError] = useState(false)
  useEffect(() => {
    let disposed = false
    let instance: Widget | undefined
    let events: string[] = []
    const timeout = window.setTimeout(() => { if (!disposed) setError(true) }, 20000)
    loadSdk().then((sc) => {
      if (disposed || !iframe.current) return
      instance = sc.Widget(iframe.current)
      widget.current = instance
      const bind = (name: string, callback: (event: { currentPosition: number }) => void) => {
        const event = sc.Widget.Events[name]
        events.push(event)
        instance!.bind(event, callback)
      }
      const sync = () => instance!.getCurrentSoundIndex((index) => { if (!disposed) { setCurrent(index); setPosition(0) } })
      bind('READY', () => instance!.getSounds((sounds) => {
        if (disposed) return
        window.clearTimeout(timeout)
        setTracks(sounds)
        setError(!sounds.length)
      }))
      bind('PLAY', () => { if (!disposed) { setPlaying(true); sync() } })
      bind('PAUSE', () => { if (!disposed) setPlaying(false) })
      bind('FINISH', () => { if (!disposed) { setPlaying(false); sync() } })
      bind('PLAY_PROGRESS', (event) => { if (!disposed) setPosition(event.currentPosition) })
      bind('ERROR', () => { if (!disposed) setError(true) })
    }).catch(() => { if (!disposed) setError(true) })
    return () => {
      disposed = true
      window.clearTimeout(timeout)
      instance?.pause()
      events.forEach((event) => instance?.unbind(event))
      widget.current = null
      events = []
    }
  }, [])
  const track = tracks[current]
  function select(index: number) {
    if (index === current) widget.current?.toggle()
    else { setCurrent(index); setPosition(0); widget.current?.skip(index); widget.current?.play() }
  }
  return (
    <div className="sc-player">
      <iframe ref={iframe} className="sc-playback-engine" title="SoundCloud playback" tabIndex={-1} aria-hidden="true" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2F25ohms&auto_play=false&visual=false" />
      {error ? <p className="sc-message">Unable to load the player. <a href="https://soundcloud.com/25ohms/tracks" target="_blank" rel="noopener noreferrer">Listen on SoundCloud ↗</a></p> : !track ? <p className="sc-message" role="status">Loading tracks from SoundCloud…</p> : <>
        <div className="sc-now-playing">
          <img className="sc-cover" src={track.artwork_url || track.user.avatar_url} alt={`${track.title} cover art`} />
          <div className="sc-track-info">
            <span className="sc-artist">25OHMS</span>
            <h3>{track.title}</h3>
            <div className="sc-controls">
              <button className="sc-play" onClick={() => widget.current?.toggle()} aria-label={playing ? 'Pause' : 'Play'}>{playing ? 'Ⅱ' : '▶'}</button>
              <label className="sc-seek"><span className="sr-only">Seek within {track.title}</span><input type="range" min="0" max={track.duration} value={Math.min(position, track.duration)} onChange={(e) => { const next = Number(e.target.value); setPosition(next); widget.current?.seekTo(next) }} /></label>
              <span className="sc-time">{time(position)} / {time(track.duration)}</span>
            </div>
            <a className="sc-source" href={track.permalink_url} target="_blank" rel="noopener noreferrer">SOUNDCLOUD ↗</a>
          </div>
        </div>
        <ol className="sc-track-list" aria-label="Latest SoundCloud tracks, newest first">
          {tracks.map((item, index) => <li key={item.id}><button onClick={() => select(index)} aria-current={index === current ? 'true' : undefined} aria-label={`${index === current && playing ? 'Pause' : 'Play'} ${item.title}`}>
            <span className="sc-track-number">{index === current && playing ? 'Ⅱ' : String(index + 1).padStart(2, '0')}</span>
            <img src={item.artwork_url || item.user.avatar_url} alt="" loading="lazy" />
            <span className="sc-track-name">{item.title}</span><span className="sc-time">{time(item.duration)}</span>
          </button></li>)}
        </ol>
      </>}
    </div>
  )
}
