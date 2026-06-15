# Real-Time Match Timeline

A simplified ShotMob-style football match tracker with a Socket.IO-backed live event stream, virtualized React timeline, animated event cards, live score state, event filters, match controls, connection status indicator, and scroll-stable newest-first updates.

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS
- Zustand
- Framer Motion
- react-window (virtualized timeline)
- Netlify static hosting

## Real-Time Transport

In a production system where match events are primarily server-to-client and user commands are infrequent, Server-Sent Events (SSE) combined with REST endpoints could be a simpler and more cost-efficient alternative. WebSocket was chosen here because the assessment specifically requires a WebSocket-based real-time event stream and it provides a flexible foundation for future bidirectional features.

## Features Implemented

- Live score and current match minute
- Start, pause, resume, and reset controls
- Socket.IO-backed live match simulation
- Virtualized event timeline with newest events first (`react-window`)
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
backend/          Socket.IO match server (deploy independently)
backend/shared/   Shared domain types used by frontend and backend
src/              React frontend
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

## Timeline Virtualization

The timeline is rendered with `react-window` so only visible rows (plus a small overscan buffer) mount in the DOM. This keeps scrolling and live updates responsive even as the event list grows over a full 90-minute match.

Implementation highlights in `src/components/MatchTimeline.tsx`:

- `List` with `useDynamicRowHeight` for variable-height event cards
- `overscanCount` of 5 rows above and below the viewport
- Stable row keys via event IDs
- Fixed 470px viewport height inside the timeline panel

## Timeline Scroll Stability

The virtual list tracks whether the user is near the latest events:

```ts
listRef.current?.element?.scrollTop < 80;
```

If the user is near the top, new events are merged into `renderedEvents` and the list scrolls to row `0`. If the user is reading older events, `renderedEvents` is held steady so the virtual list does not jump; incoming events increment the unread count instead. Returning to the latest or changing filters refreshes the rendered list and scrolls back to the top.

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

### Backend (Render)

The backend lives in [backend/](./backend/) and exposes:

- `GET /health` for uptime checks
- Socket.IO on the same port

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | HTTP + Socket.IO port (Render sets this automatically) |
| `CLIENT_ORIGINS` | `http://localhost:5173` | Comma-separated frontend URLs allowed by CORS |

#### Deploy on Render

The backend is deployed from the `backend/` directory on Render using Docker. The image is self-contained: `shared/` lives inside `backend/` so the Docker build context does not need the repo root.

**Recommended:** In Render, choose **New → Blueprint**, connect this repo, and deploy from `render.yaml`.

**Or create a Web Service manually** with these settings:

| Setting | Value |
| --- | --- |
| Language / Environment | **Docker** |
| Root directory | `backend` |
| Dockerfile path | `Dockerfile` |
| Health check path | `/health` |

Set `CLIENT_ORIGINS` to your Netlify frontend URL (for example `https://your-app.netlify.app`).

#### Run locally with Docker

From the `backend/` directory:

```bash
docker build -t rtmt-backend .
docker run -p 4000:4000 -e CLIENT_ORIGINS=http://localhost:5173 rtmt-backend
```

#### Run locally (production mode, no Docker)

```bash
npm run build:backend
npm run start:backend
```

After the backend is live, set `VITE_SOCKET_URL` on the frontend to that public URL and redeploy the frontend.

## Performance Notes

- The timeline uses `react-window` windowing instead of rendering the full event list.
- Dynamic row heights are measured once per row and cached by `useDynamicRowHeight`.
- Derived timeline results use `useMemo`.
- Timeline keys use stable event IDs.
- Store score updates only occur on goal events.
- New event animations avoid layout animation, height changes, margin changes, and full-list reflow effects.
- The server runtime keeps one active stream timer and one active clock timer, then clears both on pause, reset, and match end.
