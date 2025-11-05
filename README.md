# PingWave

A real-time chat application with secure cookie-based authentication, WebSocket presence, media messaging, and an optimistic, responsive UI.

## Overview

PingWave delivers one-to-one messaging with online presence, media uploads, and instant UX. It uses a React + Vite frontend, a Node.js/Express backend, MongoDB for persistence, and Socket.IO for real-time events. Authentication is JWT-based using httpOnly cookies to mitigate XSS, with SameSite=strict to reduce CSRF risk. Additional protections include Arcjet for bot detection and rate limiting.

## Features

- Real-time messaging with Socket.IO (send/receive, live online users)
- Optimistic UI for sending messages with instant feedback
- Secure auth: JWT in httpOnly cookies (SameSite=strict), password hashing (bcrypt)
- Authenticated WebSocket connections (JWT verified on handshake)
- Media messaging via Cloudinary (base64 upload -> secure URL)
- Email onboarding via Resend (welcome email)
- Contacts and chat partners discovery
- Responsive UI with Tailwind CSS + DaisyUI
- State management with Zustand; toasts via react-hot-toast
- Production build serves frontend from the backend

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, DaisyUI, React Router, Axios, Zustand, Socket.IO client
- Backend: Node.js, Express, Socket.IO, MongoDB (Mongoose), JSON Web Tokens, bcryptjs, cookie-parser, CORS
- Services: Cloudinary (image hosting), Resend (email), Arcjet (bot protection / rate limiting)

## Architecture

Monorepo with `backend` and `frontend` packages.

- Backend exposes REST APIs under `/api` and a Socket.IO server on the same origin/port.
- In production, the backend serves the built frontend (`frontend/dist`).
- In development, the frontend runs on Vite dev server, backend on port 3000.

```
root
├─ backend/           # Express API + Socket.IO + MongoDB
│  ├─ src/
│  │  ├─ controllers/  # auth, message
│  │  ├─ emails/       # Resend templates/handlers
│  │  ├─ lib/          # env, db, socket, utils (JWT cookie), cloudinary, arcjet
│  │  ├─ middlewares/  # auth (JWT), arcjet, socket auth
│  │  ├─ models/       # User, Message (Mongoose)
│  │  └─ routes/       # /api/auth, /api/messages
│  └─ package.json
├─ frontend/          # React + Vite app
│  ├─ src/
│  │  ├─ components/   # UI components
│  │  ├─ pages/        # Chat, Login, SignUp
│  │  ├─ store/        # Zustand stores (auth, chat)
│  │  └─ lib/axios.js  # Axios instance
│  └─ package.json
└─ package.json        # Root scripts for build/start
```

## Environment Variables

Create a `.env` file inside `backend/` with the following variables:

```
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGO_URI=mongodb://localhost:27017/pingwave

# Auth
JWT_SECRET=your_jwt_secret_here

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=you@example.com
EMAIL_FROM_NAME=PingWave

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Arcjet (optional in dev)
ARCJET_KEY=your_arcjet_key
ARCJET_ENV=production
```

Notes:

- `CLIENT_URL` must match the frontend origin used in development; Socket.IO CORS uses it.
- In production, set `NODE_ENV=production` and ensure you use HTTPS so the `secure` cookie flag is honored.

## Getting Started (Development)

Requirements: Node.js >= 20, MongoDB running locally or a cloud URI.

1. Install dependencies

```powershell
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

2. Configure environment

```powershell
# Copy the example file and fill in your values
cp backend/.env.example backend/.env
```

3. Start backend (port 3000 by default)

```powershell
cd backend
npm run dev
```

4. Start frontend (Vite defaults to port 5173)

Open a new terminal:

```powershell
cd frontend
npm run dev
```

Frontend dev server: http://localhost:5173

Backend API base URL in dev: http://localhost:3000/api

## Build and Run (Production-like)

- Build frontend and install package deps via root script:

```powershell
npm run build
```

- Start the server (serves API and built frontend):

```powershell
npm start
```

Ensure `backend/.env` is set to your production values before starting.

## REST API (summary)

Base path: `/api`

Auth (Arcjet-protected):

- POST `/auth/signup`
- POST `/auth/login`
- POST `/auth/logout`
- GET `/auth/check-auth` (requires auth)
- PUT `/auth/update-profile` (requires auth)

Messages (Arcjet + auth-protected):

- GET `/messages/contacts` — all users except me
- GET `/messages/chats` — users I’ve conversed with
- GET `/messages/:id` — messages between me and user `:id`
- POST `/messages/send/:id` — send text and/or base64 image

## WebSocket Events

- Server -> Client: `getOnlineUsers` (array of userIds)
- Server -> Client: `newMessage` (message object) — targeted to the receiver

Authentication: Socket.IO handshake reads the `jwt` cookie and verifies it server-side; only authenticated users connect.

## Security

- JWT stored in httpOnly cookies with SameSite=strict; `secure` flag enabled outside development
- Passwords hashed with bcrypt
- Arcjet middleware for bot detection and rate limiting (skipped in development)
- Defensive input validation and consistent error handling

## Key UX Details

- Optimistic message sending with reconciliation
- Toast-driven feedback
- User-configurable notification sounds

## Troubleshooting

- 401 Unauthorized on API: ensure cookies are allowed (`withCredentials: true`) and `JWT_SECRET` matches
- Socket connection fails in dev: verify `CLIENT_URL` matches Vite URL and backend runs on port 3000
- Images not showing: confirm Cloudinary credentials; uploads accept base64 strings
- Emails not sent: verify Resend API key and sender identity/domain settings
