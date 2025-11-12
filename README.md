# Spotify Payout

Track your Spotify listening history and see estimated artist payouts based on your streams.

## Features

- 🎵 Spotify OAuth authentication
- 📊 Top 10 artists dashboard with play counts and estimated payouts
- 📜 Full listening history with artist images
- 🔄 Automatic data syncing via cron
- 🎨 Modern UI with Tailwind CSS v4

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v4
- **Authentication**: Supabase Auth with Spotify OAuth
- **API**: Spotify Web API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Spotify Developer account

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd spotify-payout
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

3. Enable Spotify OAuth in Supabase:
   - Go to Authentication > Providers
   - Enable Spotify
   - Add your Spotify Client ID and Secret

### 3. Set Up Spotify Developer App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)
4. Copy your Client ID and Client Secret

### 4. Environment Variables

Create a `.env.local` file in the root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Cron Security (generate with: openssl rand -base64 32)
CRON_SECRET=your-secure-random-string
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── actions.ts              # Server actions
│   ├── login/                  # Login page
│   ├── plays/                  # Listening history page
│   ├── syncing/                # Initial sync page
│   └── auth/callback/          # OAuth callback
├── components/
│   ├── ArtistBarChart.tsx      # Bar chart component
│   └── PlayCard.tsx            # Play history card
├── server/
│   ├── plays/                  # Play data access
│   └── spotify/                # Spotify sync logic
├── utils/
│   └── supabase/               # Supabase clients
└── middleware.ts               # Auth middleware
```

## Database Schema

- `plays` - User listening history
- `tracks` - Track metadata
- `artists` - Artist metadata
- `user_tokens` - Spotify refresh tokens

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Cron Job Setup

Add a cron job to sync data every 30 minutes:

**vercel.json:**
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

Or use an external cron service (like cron-job.org) to hit `/api/cron/sync-spotify`.

## License

MIT

## Acknowledgments

- Spotify Web API
- Supabase
- Next.js
