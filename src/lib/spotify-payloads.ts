// src/lib/spotify-payloads.ts
export type PlayArtistMinimal = {
    id: string;
    name: string;
    href?: string | null;
    uri?: string | null;
  };
  
  export type PlayTrackMinimal = {
    id: string;
    name: string;
    duration_ms: number;
    explicit?: boolean;
    artists: PlayArtistMinimal[];  // first is primary
    href?: string | null;
    uri?: string | null;
  };
  
  export type IngestPlayItem = {
    user_id: string;       // uuid (auth.users.id)
    played_at: string;     // ISO timestamp
    track: PlayTrackMinimal;
    context?: unknown;
  };
  
  export type HydrateArtistUpdate = {
    id: string;
    href?: string | null;
    uri?: string | null;
    images: { url: string; width?: number | null; height?: number | null }[];
  };
  