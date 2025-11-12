import { Vibrant } from "node-vibrant/node";
import tinycolor from "tinycolor2";
import pLimit from "p-limit";

// Concurrency limit for image fetching
const limit = pLimit(5);

// Fallback colors if extraction fails
const FALLBACK_START = "#6366f1"; // indigo-500
const FALLBACK_END = "#4338ca"; // indigo-700

export type GradientColors = {
  gradientStart: string; // dominant color (hex)
  gradientEnd: string; // darker shade (hex)
};

/**
 * Extract gradient colors from an image URL
 * Returns dominant color and a darker shade (20-30% darker)
 */
async function extractColorsFromImage(imageUrl: string): Promise<GradientColors> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    
    // Get the most vibrant color, or fallback to vibrant or muted
    const swatch = palette.Vibrant || palette.Muted || palette.DarkVibrant || palette.DarkMuted;
    
    if (!swatch) {
      return { gradientStart: FALLBACK_START, gradientEnd: FALLBACK_END };
    }

    const dominantColor = swatch.hex;
    const color = tinycolor(dominantColor);
    
    // Create a darker shade (25% darker)
    const darkerColor = color.darken(25).toHexString();
    
    return {
      gradientStart: dominantColor,
      gradientEnd: darkerColor,
    };
  } catch (error) {
    console.error(`Failed to extract colors from ${imageUrl}:`, error);
    return { gradientStart: FALLBACK_START, gradientEnd: FALLBACK_END };
  }
}

/**
 * Extract gradient colors for multiple images with concurrency limiting
 */
export async function extractColorsForArtists(
  artists: Array<{ artist_id: string; artist_image: string | null }>
): Promise<Map<string, GradientColors>> {
  const colorMap = new Map<string, GradientColors>();
  
  // Filter artists with images
  const artistsWithImages = artists.filter((a) => a.artist_image);
  
  if (artistsWithImages.length === 0) {
    return colorMap;
  }

  // Extract colors with concurrency limiting
  const promises = artistsWithImages.map((artist) =>
    limit(async () => {
      if (!artist.artist_image) return;
      
      const colors = await extractColorsFromImage(artist.artist_image);
      colorMap.set(artist.artist_id, colors);
    })
  );

  await Promise.all(promises);

  return colorMap;
}

