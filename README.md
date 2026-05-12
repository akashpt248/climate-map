# Global City Insights Map

Interactive dashboard for 10 global cities showing live weather, AQI, population, and currency comparison against INR.

## Stack

- Frontend: React + Vite + React Leaflet + Recharts
- Backend: Node.js + Express + Mongoose + node-cron
- Database: MongoDB Atlas

## Features

- Clickable markers for 10 cities on a world map
- Weather, AQI, population, and currency metrics
- 7 to 15 day historical trends from stored snapshots
- Automatic backend refresh job
- Frontend polling every 30 seconds
- Mobile responsive modal and dashboard layout

## Project Structure

```text
client/   React frontend
server/   Express API, schedulers, MongoDB models
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy the backend environment file and add your keys:

```bash
cp server/.env.example server/.env
```

3. Start the backend:

```bash
npm run dev:server
```

4. In a new terminal, start the frontend:

```bash
npm run dev:client
```

## API Keys Needed

- OpenWeather API key
- OpenAQ API key
- GeoDB RapidAPI key
- MongoDB Atlas connection string

## Notes

- Currency rates use a free exchange-rate endpoint and are refreshed by the backend scheduler.
- Population and currency metadata are hydrated from GeoDB and cached in MongoDB.
- Snapshot retention defaults to 15 days and can be configured in `server/.env`.

## Deployment

For the recommended hosted setup, use:

- Vercel for `client/`
- Render for `server/`

See [DEPLOYMENT.md](/Applications/XAMPP/xamppfiles/htdocs/map/DEPLOYMENT.md:1) for the exact settings and environment variables.
