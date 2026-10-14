# AMADE frontend deployment

The frontend project root is `client`.

- Local development: `npm run dev`
- Production build: `npm run build` (publishes `dist`)
- Production preview: `npm run preview`
- Set `VITE_API_URL` in the frontend build environment to the deployed backend API base URL, including `/api` (for example, `https://api.example.com/api`). If omitted in a production build, the client uses the same-origin `/api` path; configure a reverse proxy for that path. The localhost default is development-only.

The backend project root is `backend`. Install with `npm install`; use `npm run dev` locally and `npm start` on the hosting service. No compile step is required. Configure the backend environment using the names in `backend/.env.example`, and set `CLIENT_URL`/`CORS_ORIGIN` to the deployed frontend origin. The backend health check is `/api/health`.
