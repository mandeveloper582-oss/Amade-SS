# AMADE Backend API

This backend provides the API foundation for AMADE Software Solutions, including authentication, services, projects, academy content, blog content, enrollments, messages, uploads, and dashboard analytics.

## Quick start

1. Copy `.env.example` to `.env` and set the values for your environment. Use a long, unique `JWT_SECRET`.
2. To provision the first super admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` in the backend environment before first startup. The backend hashes the password and creates this account only when that email does not already exist. Remove these bootstrap variables after provisioning; do not use default/example credentials in production.
3. Install dependencies:
   npm install
4. Start the app in development mode:
   npm run dev
5. Production:
   npm start

## Environment variables

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `MONGO_DNS_SERVERS` (optional; comma-separated DNS servers for MongoDB SRV resolution)
- `MONGO_MEMORY_SERVER` (optional; set to `true` to opt in to a temporary, non-persistent development fallback)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Core routes

- `/api/health`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/services`
- `/api/projects`
- `/api/courses`
- `/api/lessons`
- `/api/enrollments`
- `/api/enrollments/admin` (admin-only, paginated list with status/course filters and student/course search)
- `/api/enrollments/admin/:id/status` (admin-only status update)
- `/api/blog`
- `/api/messages`
- `/api/dashboard`
- `/api/uploads`

The health endpoint returns HTTP 503 with `database: "disconnected"` when MongoDB is unavailable. Development mode may still start without MongoDB for local route/UI work; production startup requires a successful database connection. The in-memory MongoDB fallback is disabled by default because it is temporary and requires a working MongoDB binary download. Set `MONGO_MEMORY_SERVER=true` only when you explicitly want that non-persistent fallback; a reachable MongoDB instance is required for persistent accounts, courses, and enrollments.

## Deployment

Deploy the `backend` directory as the service root. Install dependencies with `npm install`, use `npm start` as the start command, and leave the build command empty (or use `npm run build`, which is a no-op check). Set `NODE_ENV=production`, `PORT` as provided by the host, and the required database, JWT, and allowed-origin values listed above. Set `CLIENT_URL` and `CORS_ORIGIN` to the exact deployed frontend origin(s). Do not configure `ADMIN_PASSWORD` as a permanent production secret; use it only for first-account provisioning, then remove it. Verify MongoDB connectivity at `/api/health`, which must return HTTP 200 and `database: "connected"`.

Deploy the `client` directory as a separate frontend service. Build with `npm run build` and publish `dist`. Set the Vercel build variable `VITE_API_URL` to `https://amade-software-0epp.onrender.com/api`. If configured with only the backend origin, the client adds the verified `/api` prefix. The client has the Render URL as its production fallback; local development defaults to `http://localhost:5000/api`. Changes to this Vite variable require a new frontend deployment.

## Roles

- `student`
- `instructor`
- `admin`
- `super_admin`

## Course statuses

- `draft`
- `coming_soon`
- `published`
- `archived`

## Upload handling

Uploads are validated for image file types only. If Cloudinary credentials are missing, the app falls back to a local uploads directory instead of crashing.

## Security

- Helmet
- CORS restriction
- Rate limiting for public endpoints
- JWT validation
- Password hashing with bcrypt
- Role-based authorization
