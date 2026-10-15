# AMADE frontend deployment

The frontend project root is `client`.

- Local development: `npm run dev`
- Production build: `npm run build` (publishes `dist`)
- Production preview: `npm run preview`
- Set `VITE_API_URL` in the Vercel production build environment to `https://amade-software-0epp.onrender.com/api`. The client defaults to this Render API URL in production if the variable is omitted; local development defaults to `http://localhost:5000/api`. Any change to this Vite variable requires a new deployment because it is embedded at build time.

The backend project root is `backend`. Install with `npm install`; use `npm run dev` locally and `npm start` on the hosting service. No compile step is required. Configure the backend environment using the names in `backend/.env.example`, and set `CLIENT_URL`/`CORS_ORIGIN` to the deployed frontend origin. The backend health check is `/api/health` (not the site root `/`).
