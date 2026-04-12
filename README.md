# NexusTrade

A full-stack AI stock research terminal built with Next.js, Supabase, and Gemini 2.0 Flash. Monitor live prices, manage a personal watchlist, configure price alerts, and generate on-demand AI-powered stock analysis reports.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running Locally](#running-locally)
- [Deployment](#deployment)

---

## Overview

NexusTrade is a personal stock research tool that combines real-time market data with AI analysis. The application pulls live price ticks from Finnhub via WebSocket, broadcasts them to connected clients through Supabase Realtime, and uses Google Gemini 2.0 Flash (orchestrated by Inngest) to produce structured analysis reports including sentiment, key risks, opportunities, and technical outlook.

The goal is a fast, responsive, keyboard-navigable interface that works well on both desktop and mobile without sacrificing data density.

---

## Tech Stack

**Frontend**
- Next.js 15 (App Router, React Server Components)
- TypeScript (strict mode, exactOptionalPropertyTypes)
- Tailwind CSS v4
- Lucide React (icons)
- SWR (data fetching and client-side cache)
- React Hook Form with Zod validation

**Backend / Infrastructure**
- Supabase — PostgreSQL database, authentication, and Realtime broadcast
- Inngest — durable background job execution for AI analysis pipelines
- Finnhub — WebSocket live price feed (50 symbol limit per connection)
- Google Gemini 2.0 Flash — AI analysis generation

**Utilities**
- date-fns (date formatting)
- clsx / tailwind-merge via `cn()` utility


---

## Features

**Watchlist**
- Add and remove stock symbols (ticker validation via Zod schema)
- Optional per-symbol notes
- Server-side prefetch on page load — zero loading flash on first render
- Live price tickers with flash animation on price change (green up, red down)
- 50-symbol capacity warning at 45 symbols (Finnhub WebSocket limit)

**Live Price Feed**
- Finnhub WebSocket connection managed server-side
- Price ticks broadcast to clients via Supabase Realtime channel
- SWR fetches initial REST quote on mount (15s dedup interval matching gateway TTL)
- Flash animation on tick: green for price increase, red for decrease, fades after 600ms
- Connection status indicator (live / connecting)

**AI Reports**
- On-demand analysis triggered per symbol from the watchlist
- Background processing via Inngest — non-blocking, durable
- Reports streamed to the UI automatically via Supabase Realtime — no manual refresh required
- Each report includes: sentiment (Bullish / Bearish / Neutral), summary, key risks, key opportunities, technical outlook, and technical indicators at time of analysis (RSI, MACD, Bollinger Bands)
- Filterable by symbol, sentiment, and trigger type (manual, alert, scheduled)
- Paginated list with load-more

**Alerts**
- Price alert configuration per symbol
- Alerts trigger automatic AI analysis when conditions are met

**News**
- Per-symbol news feed with thumbnail, source, headline, summary, and relative timestamp

**Authentication**
- Email and password via Supabase Auth
- Email confirmation flow on signup
- Session refresh via Next.js middleware
- Redirect to login on unauthenticated access

**Navigation**
- Sticky sidebar on desktop (220px)
- Slide-in drawer on mobile with backdrop overlay
- Hamburger button vertically centred in the header on mobile
- Active route highlighted with primary accent border

---

**SETUP ENV**
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Finnhub
FINNHUB_API_KEY=your-finnhub-api-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Inngest
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000




