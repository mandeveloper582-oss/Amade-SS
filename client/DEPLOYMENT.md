# AMADE frontend deployment

The frontend project root is `client`.

- Local development: `npm run dev`
- Production build: `npm run build` (publishes `dist`)
- Production preview: `npm run preview`
- For Vercel Production, set `VITE_API_URL` to `https://amade-software-0epp.onrender.com/api`. If the value is supplied as only the backend origin, the client adds the verified `/api` prefix. The production fallback is the Render API URL; local development defaults to `http://localhost:5000/api`. Any Vite variable change requires a new deployment because values are embedded at build time.

The backend project root is `backend`. Install with `npm install`; use `npm run dev` locally and `npm start` on the hosting service. No compile step is required. Configure the backend environment using the names in `backend/.env.example`, and set `CLIENT_URL`/`CORS_ORIGIN` to the deployed frontend origin. CORS permits Vite development origins on `localhost` and `127.0.0.1` using ports 5170–5179. The backend health check is `/api/health` (not the site root `/`).
