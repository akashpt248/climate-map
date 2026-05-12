# Deploy on Vercel + Render

This project is split into two deploys:

- `client/` goes to Vercel
- `server/` goes to Render

## 1. Prepare accounts and keys

You need:

- a Vercel account
- a Render account
- a MongoDB Atlas database
- an OpenWeather API key
- an OpenAQ API key
- a GeoDB RapidAPI key

## 2. Deploy the backend on Render

Create a new Web Service from this repo.

Use these settings if you configure it in the Render dashboard:

- Root Directory: `server`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

This repo also includes [render.yaml](/Applications/XAMPP/xamppfiles/htdocs/map/render.yaml:1), so you can deploy with Render Blueprint if you prefer.

Set these environment variables in Render:

```env
PORT=10000
CLIENT_ORIGIN=https://your-vercel-app.vercel.app
MONGODB_URI=your_mongodb_atlas_connection_string
OPENWEATHER_API_KEY=your_openweather_key
OPENAQ_API_KEY=your_openaq_key
GEODB_API_KEY=your_geodb_rapidapi_key
GEODB_API_HOST=wft-geo-db.p.rapidapi.com
SNAPSHOT_RETENTION_DAYS=15
REFRESH_CRON=*/30 * * * *
```

After deploy, note your Render URL, for example:

```text
https://global-city-insights-api.onrender.com
```

Check the health endpoint:

```text
https://global-city-insights-api.onrender.com/api/health
```

## 3. Deploy the frontend on Vercel

Create a new Vercel project from this repo.

Use these settings:

- Framework Preset: `Vite`
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`

Set this environment variable in Vercel:

```env
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
```

This repo includes [client/vercel.json](/Applications/XAMPP/xamppfiles/htdocs/map/client/vercel.json:1) so direct route requests keep working for the SPA.

## 4. Update backend CORS

Once Vercel gives you the real frontend URL, make sure Render uses that exact URL for:

```env
CLIENT_ORIGIN=https://your-real-vercel-domain.vercel.app
```

Without that, the browser will block API calls.

## 5. Verify production

Open the Vercel site and confirm:

- the map loads
- city cards load
- modal details open
- no CORS errors appear in the browser console

Also test the API directly:

- `GET /api/health`
- `GET /api/cities`

## 6. Recommended deploy order

1. Deploy Render first
2. Copy the Render backend URL
3. Add it to Vercel as `VITE_API_BASE_URL`
4. Deploy Vercel
5. Copy the final Vercel URL
6. Update Render `CLIENT_ORIGIN`
7. Redeploy Render if needed
