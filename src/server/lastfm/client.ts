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

export interface LastFmTag {
  name: string;
  count?: number;
  reach?: number;
}

export interface LastFmArtistInfo {
  name: string;
  url: string;
  bio?: {
    summary: string;
    content: string;
  };
  tags?: {
    tag: LastFmTag[];
  };
  similar?: {
    artist: LastFmArtist[];
  };
}

export interface LastFmTagTopArtist {
  name: string;
  url: string;
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

  return response.json() as Promise<T>;
}

export const lastFm = {
  async getSimilarTracks(artist: string, track: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("track.getSimilar", {
      artist,
      track,
      limit,
    });
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).similartracks?.track || [];
  },

  async getSimilarArtists(artist: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ artist: LastFmArtist[] }>>("artist.getSimilar", {
      artist,
      limit,
    });
    return (data as LastFmResponse<{ artist: LastFmArtist[] }>).similarartists?.artist || [];
  },

  async getTopTracksByTag(tag: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("tag.getTopTracks", {
      tag,
      limit,
    });
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).tracks?.track || [];
  },

  async getArtistTopTracks(artist: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("artist.getTopTracks", {
      artist,
      limit,
    });
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).toptracks?.track || [];
  },

  async getArtistInfo(artist: string) {
    const data = await fetchLastFm<LastFmResponse<LastFmArtistInfo>>("artist.getInfo", {
      artist,
      autocorrect: 1,
    });
    return (data as LastFmResponse<LastFmArtistInfo>).artist;
  },

  async getArtistTopTags(artist: string, limit = 15) {
    const data = await fetchLastFm<LastFmResponse<{ tag: LastFmTag[] }>>("artist.getTopTags", {
      artist,
      limit,
      autocorrect: 1,
    });
    return (data as LastFmResponse<{ tag: LastFmTag[] }>).toptags?.tag || [];
  },

  async getTrackTopTags(artist: string, track: string, limit = 15) {
    const data = await fetchLastFm<LastFmResponse<{ tag: LastFmTag[] }>>("track.getTopTags", {
      artist,
      track,
      limit,
      autocorrect: 1,
    });
    return (data as LastFmResponse<{ tag: LastFmTag[] }>).toptags?.tag || [];
  },

  async getTagSimilarTags(tag: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ tag: LastFmTag[] }>>("tag.getSimilar", {
      tag,
      limit,
    });
    return (data as LastFmResponse<{ tag: LastFmTag[] }>).similartags?.tag || [];
  },

  async getTagTopArtists(tag: string, limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ artist: LastFmTagTopArtist[] }>>("tag.getTopArtists", {
      tag,
      limit,
    });
    return (data as LastFmResponse<{ artist: LastFmTagTopArtist[] }>).topartists?.artist || [];
  },

  async getGlobalTopTracks(limit = 20) {
    const data = await fetchLastFm<LastFmResponse<{ track: LastFmTrack[] }>>("chart.getTopTracks", {
      limit,
    });
    return (data as LastFmResponse<{ track: LastFmTrack[] }>).tracks?.track || [];
  },
};
