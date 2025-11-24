import { createAdminClient } from "@/utils/supabase/server";
import { extractColorsForArtists } from "@/utils/color-extraction";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const BATCH_SIZE = 50;

async function backfillArtistColors() {
  const supabase = createAdminClient();

  let processed = 0;
  let updated = 0;
  let skippedNoImage = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("artists")
      .select("id, name, primary_image_url")
      .or("gradient_start.is.null,gradient_end.is.null")
      .not("primary_image_url", "is", null)
      .limit(BATCH_SIZE);

    if (error) throw new Error(`Failed to fetch artists: ${error.message}`);
    if (!data || data.length === 0) break;

    const artistsWithImages = data.filter((a) => a.primary_image_url);
    skippedNoImage += data.length - artistsWithImages.length;

    const colorMap = await extractColorsForArtists(
      artistsWithImages.map((a) => ({
        artist_id: a.id,
        artist_image: a.primary_image_url!,
      }))
    );

    const updates = Array.from(colorMap.entries()).map(([artistId, colors]) => {
      const record = artistsWithImages.find((a) => a.id === artistId);
      return {
        id: artistId,
        name: record?.name ?? "",
        gradient_start: colors.gradientStart,
        gradient_end: colors.gradientEnd,
      };
    });

    if (updates.length) {
      const { error: upsertError } = await supabase.from("artists").upsert(updates);
      if (upsertError) throw new Error(`Failed to upsert colors: ${upsertError.message}`);
      updated += updates.length;
    }

    processed += data.length;
    console.log(`Processed ${processed} artists so far (updated ${updated}, skipped ${skippedNoImage} without images)...`);

    // If this batch was smaller than the limit, we've exhausted the dataset
    if (data.length < BATCH_SIZE) break;
  }

  console.log(`Done. Updated ${updated} artists. Skipped ${skippedNoImage} lacking primary images.`);
}

backfillArtistColors().catch((err) => {
  console.error(err);
  process.exit(1);
});
