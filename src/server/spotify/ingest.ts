// src/server/ingest.ts
import { createAdminClient } from "@/utils/supabase/server";
import type { IngestPlayItem } from "@/lib/spotify-payloads";
import { Json } from "@/lib/database.types";

export async function ingestPlaysBatch(items: IngestPlayItem[]) {
    const supabaseAdmin = createAdminClient();
    if (!items.length) return { ok: true, inserted: 0 };

    const { error } = await supabaseAdmin.rpc("ingest_spotify_plays", {
        p_items: items as unknown as Json, // JSONB payload
    });

    if (error) throw new Error(error.message);
    return { ok: true, inserted: items.length };
}
