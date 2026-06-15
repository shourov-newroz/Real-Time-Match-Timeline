# Real-Time Match Timeline

A simplified ShotMob-style football match tracker with a Socket.IO-backed live event stream, animated React timeline, live score state, event filters, match controls, connection status indicator, and scroll-stable newest-first updates.

## Tech Stack

- React, TypeScript, Vite
- Tailwind CSS
- Zustand
- Framer Motion
- Netlify static hosting

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

## Running Locally

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

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

This repo is configured for Netlify static hosting with [netlify.toml](./netlify.toml).

Netlify settings:

- Build command: `npm run build`
- Publish directory: `dist`

Deploy flow:

```bash
npm run build
```

Then connect the repo in Netlify or deploy the generated `dist` directory with the Netlify CLI.

## Performance Notes

- Derived timeline results use `useMemo`.
- Timeline keys use stable event IDs.
- Store score updates only occur on goal events.
- New event animations avoid layout animation, height changes, margin changes, and full-list reflow effects.
- The server runtime keeps one active stream timer and one active clock timer, then clears both on pause, reset, and match end.

## Production Next Steps

For a production-scale version, the next step would be timeline virtualization.
