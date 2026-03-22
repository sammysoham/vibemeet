# VibeMeet

VibeMeet is a simple full-stack random video chat app built with:

- Next.js App Router frontend
- Node.js + Express backend
- Socket.io matchmaking + WebRTC signaling
- PostgreSQL with Prisma
- Tailwind CSS
- OpenRouter AI fallback chat
- Stripe subscription placeholder flow

## What’s Included

- Email/password signup and login
- Continue as guest flow
- Anonymous display name + gender profile setup
- Terms and Conditions acceptance during auth
- 18+ confirmation modal stored in local storage
- Dashboard with online count, premium banner, and profile summary
- Full-screen video chat layout with:
  - Next user
  - Mute
  - Camera on/off
  - Report user
  - End chat
- Unlimited text chat for free users
- Limited free daily video chat access
- Interest-based matchmaking preferences
- Image/video chat uploads for premium users
- Premium-only advanced gender filter
- Premium-only friend adds
- AI fallback stranger chat when no user is available
- Policy pages:
  - Terms of Service
  - Privacy Policy
  - Community Guidelines
  - Safety Policy
- Rate limiting and basic moderation flagging

## Project Structure

```text
client/                 Next.js frontend
server/                 Express API + sockets
server/routes/
server/controllers/
server/sockets/
server/matchmaking/
server/webrtc/
server/ai/
server/prisma/
```

## Environment Setup

1. Copy the example file:

```bash
cp .env.example .env
```

2. Update the values inside `.env`.

Minimum required values:

- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`

Optional integrations:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`

## Install

```bash
npm install
```

## Database Migration

Make sure PostgreSQL is running and the database in `DATABASE_URL` exists.

Then run:

```bash
npm run db:generate
npm run db:migrate
```

## Start The App

Run both frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client
npm run dev:server
```

Frontend:

- [http://localhost:3000](http://localhost:3000)

Backend:

- [http://localhost:4000](http://localhost:4000)

## Easy Hosting

The simplest production-style setup for this repo is:

- `client/` on Vercel
- `server/` on Render Web Service
- PostgreSQL on Render Postgres

Recommended flow:

1. Push this repo to GitHub.
2. Create a Render Postgres database in the same region you want for the backend.
3. Create a Render Web Service for `server/`.
4. Set the service root directory to `server`.
5. Use:
   - Build command: `npm install && npm run prisma:generate && npm run prisma:deploy`
   - Start command: `npm start`
6. Add backend env vars:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CLIENT_URL`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `FREE_VIDEO_CHAT_LIMIT`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
7. Create a Vercel project for `client/`.
8. Set the project root directory to `client`.
9. Add frontend env vars:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SOCKET_URL`
   - `NEXT_PUBLIC_FREE_VIDEO_CHAT_LIMIT`
10. Point `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` at your Render backend URL.
11. Point `CLIENT_URL` on the backend at your Vercel frontend URL.

After that, opening the Vercel site is enough to test the live app.

## Notes

- OpenRouter is configured locally for AI fallback, and the app still has a local reply fallback if the API is unavailable.
- If Stripe keys are not configured, the premium checkout route upgrades the current user in demo mode so premium features can still be tested locally.
- Matchmaking uses a short wait before AI fallback so a human match can still happen if another user joins quickly.
- Free users keep unlimited text chat and can use a configurable free daily video limit. Premium users can keep using video, share media, use advanced filters, and add friends.

## Verification

These checks were run successfully:

```bash
npm run lint
npm run build
npm run db:generate
```

## Next Practical Step

To make subscriptions fully production-ready, add a Stripe webhook that marks subscriptions active after successful checkout.
