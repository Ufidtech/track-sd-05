# Track SD-05 — Clinic Appointment System

> A patient never has to wonder how much longer they'll wait.

Track SD-05 is a clinic queue management system built to reduce congestion, improve transparency, and support faster patient flow in public healthcare settings. It digitizes the queue so patients, nurses, doctors, and admins all work from the same live state — no one loses track of who's next.

Built as a 3MTT NextGen capstone project.

**Live demo:** https://track-sd-05.vercel.app
**Backend health check:** https://track-sd-05-backend-b3ece8gpgkd9bbf3.southafricanorth-01.azurewebsites.net/health/db
**Full specification:** [`docs/PRD.md`](docs/PRD.md)

---

## Why This Exists

At National Hospital Abuja, public-sector patient flow is heavily affected by morning congestion and opaque waiting. Patients have no reliable way to know where they stand in line, staff struggle to track who's next, and crowding builds as people wait in person just to avoid losing their place.

Track SD-05 was built to fix this by making the queue visible, reliable, and easy to manage — for everyone involved.

The design is grounded in three real user scenarios:

- **Amina** wants a scheduled slot and clear confirmation that her spot is secured.
- **Bello** wants to track the queue remotely, so he can arrive right when it's his turn.
- **The Kure Market food seller** may not own a smartphone, or may need nurse-assisted registration in her preferred language.

Every major feature in the system exists to serve one of these three cases.

---

## Status

This project is demo-ready and aligned with the PRD's main user flows.

| Component | Status |
|---|---|
| PostgreSQL schema, atomic ticket sequence | ✅ Deployed and verified |
| Backend infrastructure (Azure App Service + Postgres) | ✅ Live and connected |
| CORS / cross-origin request handling | ✅ Working |
| Frontend shell (React, Vercel) | ✅ Deployed |
| Patient registration endpoint | ✅ Implemented |
| Nurse proxy registration | ✅ Implemented |
| Idempotency-safe duplicate handling | ✅ Implemented |
| Real-time queue updates (SSE) | ✅ Implemented with heartbeat/fallback |
| Ticket lifecycle (hold / recall / expiry) | ✅ Implemented |
| Multi-doctor pull queue | ✅ Implemented with locking |
| Admin reinstatement + logs | ✅ Implemented |

See [`DEFENSE_NOTES.md`](DEFENSE_NOTES.md) for the reasoning behind the main design decisions.

---

## What Makes This Different From "Just a Queue App"

**A ticket number is never issued twice, even under simultaneous load.**
Ticket numbering uses a PostgreSQL `SEQUENCE`, which is atomic and safe under concurrency.

**A retried request never creates a duplicate ticket.**
Each registration uses an `Idempotency-Key`, so double-clicks or network retries return the original ticket instead of creating another one.

**A patient's place is never lost because a message failed to arrive.**
Notification delivery is treated as best-effort, with hold/recall/reinstate behavior to support queue recovery.

**Live updates without excessive polling.**
Server-Sent Events keep the queue status current, with heartbeat and fallback behavior for resilience.

---

## Architecture

```
track-sd-05/
├── client/            React frontend (Vite)
├── server/            Express backend
│   ├── src/
│   │   ├── config/       Database connection pool
│   │   ├── db/           SQL schema (DDL)
│   │   ├── routes/       Express route definitions
│   │   ├── controllers/  Request handling & business logic
│   │   ├── middleware/   Idempotency key enforcement
│   │   ├── services/     Notification handling (mocked for MVP)
│   │   └── sse/          Server-Sent Events queue stream
│   └── tests/            Concurrency / race-condition tests
├── test-harness/      Plain HTML/JS client for backend verification
└── docs/              PRD and AI-assistant instructions
```

**Stack:** React (Vite) · Node.js · Express · PostgreSQL · Server-Sent Events
**Deployment:** Vercel (frontend) · Azure App Service (backend)

---

## Getting Started

### Backend

```bash
cd server
cp .env.example .env
npm install
psql -U your_user -d track_sd05 -f src/db/schema.sql
npm start
```

### Frontend

```bash
cd client
npm install
npm run dev
```

For local development, set `VITE_API_URL` to your local backend URL.
For production/demo use, set `VITE_API_URL` to the deployed backend URL.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/tickets` | Register a new ticket. Requires `Idempotency-Key` header. |
| `GET` | `/tickets/queue` | Current queue summary. |
| `GET` | `/tickets/:id/stream` | Server-Sent Events stream of live position updates. |
| `POST` | `/tickets/:id/hold` | Mark a ticket held. |
| `POST` | `/tickets/:id/recall` | Move a ticket to the back of the queue after a miss. |
| `POST` | `/tickets/:id/reinstate` | Reinstate a missed ticket. |
| `GET` | `/admin/reinstatements` | Reinstatement log. |
| `GET` | `/health/db` | Backend/database connectivity check. |

---

## Testing

```bash
cd server
npm test
```

`server/tests/concurrency.test.js` fires simultaneous registration requests to verify atomic sequencing and idempotency behavior under concurrent load.

---

## Out of Scope (MVP)

Telehealth, payments/insurance integration, advanced analytics dashboards, indoor geofencing, position-swapping, multi-hospital sync, and live production SMS/IVR provider integration.

---

## Author

**Ibrahim Danjuma** — Byteforce Solutions Tech Ltd.
3MTT NextGen Capstone Project, 2026.

## License

MIT
