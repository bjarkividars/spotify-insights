export type PlayWithDetails = {
  played_at: string;
  track: {
    id: string;
    name: string;
    artist: {
      id: string;
      name: string;
      image_url: string | null;
    };
  };
};


