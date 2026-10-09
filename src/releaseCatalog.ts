export type MusicLink = {
  platform: 'Spotify' | 'Apple Music' | 'Bandcamp' | 'SoundCloud' | 'YouTube'
  url: string
}

export type Release = {
  id: string
  title: string
  artist: string
  year?: string
  status: 'announced' | 'upcoming' | 'released'
  artwork?: string
  playlistUrl: string
  links: MusicLink[]
}

// Add confirmed release artwork and direct listening URLs here.
export const releases: Release[] = [
  {
    id: 'generationohmega',
    playlistUrl: 'https://soundcloud.com/25ohms/sets/generationohmega',
    title: 'generationOHMEGA',
    artist: '25OHMS',
    year: '2026',
    status: 'released',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/62/8c/e3/628ce3af-001d-a96d-8641-9bcbfcee97a9/885975012513_cover.jpg/592x592bf.webp',
    links: [{ platform: 'YouTube', url: 'https://www.youtube.com/watch?v=9d14CxPsR6Q' }],
  },
  {
    id: 'fivebyfive',
    playlistUrl: 'https://soundcloud.com/25ohms/sets/fivebyfive',
    title: 'FIVEBYFIVE',
    artist: '25OHMS',
    status: 'released',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/8f/12/62/8f1262a3-3733-e67e-d939-7212069b2953/085494453907_cover.jpg/592x592bf.webp',
    links: [
      { platform: 'Bandcamp', url: 'https://25ohms.bandcamp.com/album/fivebyfive' },
      { platform: 'SoundCloud', url: 'https://soundcloud.com/25ohms/sets/fivebyfive' },
      { platform: 'Apple Music', url: 'https://music.apple.com/us/album/1836649538' },
    ],
  },
]

export const artistMusicLinks: MusicLink[] = [
  { platform: 'SoundCloud', url: 'https://soundcloud.com/25ohms' },
  { platform: 'Apple Music', url: 'https://music.apple.com/us/artist/25ohms/1760784650' },
  { platform: 'Bandcamp', url: 'https://25ohms.bandcamp.com/' },
]
