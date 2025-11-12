# Spotify Sync Cron Endpoint

## Overview

This endpoint syncs recently played tracks from Spotify for all users in the system.

## Endpoint

```
GET /api/cron/sync-spotify
```

## How It Works

1. **Fetch Users**: Gets all users from `auth.users` (all are Spotify users)
2. **Get Last Sync**: For each user, fetches their most recent `played_at` from the `plays` table
3. **Fetch New Plays**: Calls Spotify API to get recently played tracks after the last sync time
4. **Ingest Data**: Uses the `ingest_spotify_plays` database function to atomically insert artists, tracks, and plays
5. **Handle Errors**: Individual user failures don't stop the sync - errors are logged and the process continues

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "duration_ms": 15234,
  "result": {
    "totalUsers": 10,
    "successful": 9,
    "failed": 1,
    "playsSynced": 145,
    "errors": [
      {
        "userId": "uuid-here",
        "error": "No Spotify tokens available"
      }
    ]
  }
}
```

### Error Response (500)

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Setup Instructions

### 1. Environment Variables

Ensure these are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `CRON_SECRET` - A secure random string to authenticate cron requests

Generate a secure secret:

```bash
# Generate a random secret
openssl rand -base64 32
```

### 2. Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-spotify",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

This runs every 30 minutes.

**Important**: In Vercel's project settings, set the `CRON_SECRET` environment variable. Vercel automatically passes this as the `x-vercel-cron-secret` header.

### 3. Alternative: External Cron

Use any cron service (e.g., cron-job.org, GitHub Actions) with authorization:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/cron/sync-spotify
```

Replace `YOUR_CRON_SECRET` with the value from your `CRON_SECRET` environment variable.

## Token Refresh

The endpoint automatically handles expired Spotify tokens:

1. Attempts API call with stored token
2. If 401 error, refreshes the token using Spotify's refresh token
3. Retries the API call once with new token
4. If still fails, logs error and continues with next user

## Performance Considerations

- **Max Execution Time**: 5 minutes (300 seconds)
- **Rate Limits**: Respects Spotify API rate limits per user
- **Batch Processing**: Inserts are batched per user for efficiency
- **Database**: Uses indexed queries and conflict handling (upserts)

## Monitoring

Check logs for:

```
[Spotify Sync] Starting sync for all users...
[Spotify Sync] Found 10 users to sync
[Spotify Sync] Syncing user uuid...
[Spotify Sync] Found 15 new plays for user uuid
[Spotify Sync] Ingested 15 plays for user uuid
[Spotify Sync] Completed in 15234ms. Success: 9, Failed: 1, Plays: 145
```

## Error Handling

Common errors:

- **No Spotify tokens available**: User needs to re-authenticate
- **Failed to refresh token**: Refresh token is invalid or expired
- **401 errors**: Token refresh failed twice - user needs to re-auth
- **Rate limits**: Spotify API rate limit exceeded (rare with 15min intervals)

## Testing

Test locally with authorization:

```bash
# Set CRON_SECRET in your .env.local first
curl -H "Authorization: Bearer your-local-secret" \
  http://localhost:3000/api/cron/sync-spotify
```

Or use the Vercel CLI:

```bash
vercel dev
# Then call with authorization header
curl -H "Authorization: Bearer your-local-secret" \
  http://localhost:3000/api/cron/sync-spotify
```

