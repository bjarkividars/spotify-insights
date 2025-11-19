const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const BASE_URL = "http://ws.audioscrobbler.com/2.0/";

if (!LASTFM_API_KEY) {
  console.warn("LASTFM_API_KEY is not set");
}

type LastFmResponse<T> = {
  [key: string]: T;
};

export interface LastFmTrack {
  name: string;
  url: string;
  artist: {
    name: string;
    url: string;
  };
  image?: {
    "#text": string;
    size: string;
  }[];
}

export interface LastFmArtist {
  name: string;
  url: string;
  image?: {
    "#text": string;
    size: string;
  }[];
}

async function fetchLastFm<T>(method: string, params: Record<string, string | number>): Promise<T> {
  if (!LASTFM_API_KEY) {
    throw new Error("LASTFM_API_KEY is not configured");
  }

  const searchParams = new URLSearchParams({
    method,
    api_key: LASTFM_API_KEY,
    format: "json",
    ...params,
  });

  const response = await fetch(`${BASE_URL}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export const lastFm = {
  async getSimilarTracks(artist: string, track: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("track.getSimilar", {
      artist,
      track,
      limit,
    });
    // The API returns { similartracks: { track: [...] } }
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).similartracks?.track || [];
  },

  async getSimilarArtists(artist: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ artist: LastFmArtist[] }>>("artist.getSimilar", {
      artist,
      limit,
    });
    // The API returns { similarartists: { artist: [...] } }
    return (data as LastFmResponse<{ artist: LastFmArtist[] }>).similarartists?.artist || [];
  },

  async getTopTracksByTag(tag: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("tag.getTopTracks", {
      tag,
      limit,
    });
    // The API returns { tracks: { track: [...] } }
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).tracks?.track || [];
  },

  async getArtistTopTracks(artist: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("artist.getTopTracks", {
      artist,
      limit,
    });
    // The API returns { toptracks: { track: [...] } }
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).toptracks?.track || [];
  },
};

