# JARVIS

JARVIS v1 is a React/Vite frontend with a Node/Express backend. Secrets belong in `backend/.env`; the browser never receives them.

## Run

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. The backend health endpoint is http://localhost:5000/api/health.
