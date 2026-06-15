# Real-Time Match Timeline

A simplified ShotMob-style football match tracker with a Socket.IO-backed live event stream, animated React timeline, live score state, event filters, match controls, connection status indicator, and scroll-stable newest-first updates.

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS
- Zustand
- Framer Motion
- Netlify static hosting

## Real-Time Transport

In a production system where match events are primarily server-to-client and user commands are infrequent, Server-Sent Events (SSE) combined with REST endpoints could be a simpler and more cost-efficient alternative. WebSocket was chosen here because the assessment specifically requires a WebSocket-based real-time event stream and it provides a flexible foundation for future bidirectional features.

## Features Implemented

- Live score and current match minute
- Start, pause, resume, and reset controls
- Socket.IO-backed live match simulation
- Event timeline with newest events first
- Filters for all events, goals, chances, fouls, cards, set pieces, and substitutions
- Match summary panel with totals and latest event
- Connection indicator with reconnecting state and control gating
- Command acknowledgement, pending UI, and reconnect snapshot resync
- Shared frontend/backend domain types

## Bonus/Assessment Details

- Match does not start automatically on page load. The user explicitly starts it from the UI.
- The match clock is real-time: one simulated match minute equals one real-world minute.
- The full match takes about 90 real-world minutes and is not compressed into a short demo duration.
- The server runtime generates one mock match event every 1-2 seconds using the current real-time match minute.
- Generated events use weighted realistic football data: possession, tackles, throw-ins, fouls, free kicks, corners, offsides, shots, shots on target, saves, cards, goals, and phase-aware substitutions.
- The server prevents duplicate match intervals when Start Match is triggered repeatedly.
- The client requests a fresh snapshot on connect/reconnect so score, clock, and timeline resync cleanly after transport loss.

## Project Layout

```txt
backend/     Socket.IO match server (deploy independently)
shared/      Shared domain types used by frontend and backend
src/         React frontend
```

## Running Locally

Install dependencies from the repo root:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Run the backend:

```bash
npm run dev:backend
```

Run both together:

```bash
npm run dev:all
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

Copy `.env.example` and `backend/.env.example` if you need custom ports or origins.

## Match Flow

1. The page connects to the Socket.IO match server.
2. User clicks Start Match.
3. The server starts the real-time 90-minute match clock.
4. Mock events are generated every 1-2 seconds using the current minute and broadcast to all connected clients.
5. Pause, resume, reset, and end states are acknowledged by the server and reflected in the UI.

## Timeline Scroll Stability

The timeline uses a fixed-height scroll container and tracks whether the user is near the latest events:

```ts
scrollContainer.scrollTop < 80;
```

If the user is near the top, new events animate into view. If the user is reading older events, the component measures the previous scroll height and offsets `scrollTop` after insertion so the visible reading position stays stable.

## Back To Latest

When new events arrive while the user is not near the top, the unread count increments and a floating Back to Latest button appears. Clicking it smoothly scrolls to `top: 0` and clears the unread count.

## Animation System

All Framer Motion usage is routed through shared tokens in `src/motion/motionTokens.ts`:

- Shared durations
- Shared easing
- Shared button hover/tap behavior
- Opacity and transform animations only for timeline stability

## Folder Structure

```txt
src/
  components/
  hooks/
  lib/
  motion/
  store/
  types/
  utils/
```

## Deployment

Frontend and backend are split so each can be deployed on its own platform.

### Frontend (Netlify)

This repo is configured for Netlify static hosting with [netlify.toml](./netlify.toml).

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_SOCKET_URL` = your deployed backend URL

Deploy flow:

```bash
npm run build
```

Then connect the repo in Netlify or deploy the generated `dist` directory with the Netlify CLI.

### Backend (Node / Docker / Railway / Render)

The backend lives in [backend/](./backend/) and exposes:

- `GET /health` for uptime checks
- Socket.IO on the same port

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | HTTP + Socket.IO port |
| `CLIENT_ORIGINS` | `http://localhost:5173` | Comma-separated frontend URLs allowed by CORS |

Build and run without Docker:

```bash
npm run build:backend
npm run start --workspace=@rtmt/backend
```

Docker:

```bash
docker build -f backend/Dockerfile -t rtmt-backend .
docker run -p 4000:4000 -e CLIENT_ORIGINS=https://your-frontend.netlify.app rtmt-backend
```

After the backend is live, set `VITE_SOCKET_URL` on the frontend to that public URL and redeploy the frontend.

## Performance Notes

- Derived timeline results use `useMemo`.
- Timeline keys use stable event IDs.
- Store score updates only occur on goal events.
- New event animations avoid layout animation, height changes, margin changes, and full-list reflow effects.
- The server runtime keeps one active stream timer and one active clock timer, then clears both on pause, reset, and match end.

## Production Next Steps

For a production-scale version, the next step would be timeline virtualization.
