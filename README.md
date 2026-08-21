Track SD-05 — Clinic Appointment System
A patient never has to wonder how much longer they’ll wait.

Track SD-05 is a clinic queue management system designed to reduce congestion, improve transparency, and support faster patient flow in public healthcare settings. It digitizes the queue so patients, nurses, doctors, and admins can work from the same live state without losing track of who is next.

Built as a 3MTT NextGen capstone project.

Live demo: https://track-sd-05.vercel.app
Backend health: https://track-sd-05-backend-b3ece8gpgkd9bbf3.southafricanorth-01.azurewebsites.net/health/db
Full specification: docs/PRD.md
Why this exists
At National Hospital Abuja, public-sector patient flow is heavily affected by morning congestion and opaque waiting. Track SD-05 was built to address that by making the queue visible, reliable, and easier to manage.

It is designed around three real user scenarios:

Amina, who wants a scheduled slot and clear confirmation
Bello, who wants to track the queue remotely and arrive when it is his turn
The Kure Market food seller, who may not have a smartphone or may need nurse-assisted registration in a preferred language
Every major feature exists to support one of these real cases.

Status
This project is now demo-ready and aligned with the PRD’s main user flows.

Component	Status
PostgreSQL schema, atomic ticket sequence	✅ Deployed and verified
Backend infrastructure (Azure App Service + Postgres)	✅ Live and connected
CORS / cross-origin request handling	✅ Working
Frontend shell (React, Vercel)	✅ Deployed
Patient registration endpoint	✅ Implemented
Nurse proxy registration	✅ Implemented
Idempotency-safe duplicate handling	✅ Implemented
Real-time queue updates (SSE)	✅ Implemented with heartbeat/fallback
Ticket lifecycle (hold / recall / expiry)	✅ Implemented
Multi-doctor pull queue	✅ Implemented with locking
Admin reinstatement + logs	✅ Implemented
See DEFENSE_NOTES.md for the reasoning behind the main design decisions.

What makes this different from “just a queue app”
A ticket number is never issued twice, even under simultaneous load.
Ticket numbering uses a PostgreSQL SEQUENCE, which is atomic and safe under concurrency.

A retried request never creates a duplicate ticket.
Each registration uses an Idempotency-Key, so double-clicks or network retries return the original ticket instead of creating another one.

A patient’s place is not lost because a message failed to arrive.
The system treats notification delivery as best-effort and supports hold/recall/reinstate behavior for queue recovery.

Live updates without excessive polling.
Server-Sent Events keep the queue status current, with heartbeat and fallback behavior for resilience.

Architecture

Apply
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
Stack: React (Vite) · Node.js · Express · PostgreSQL · Server-Sent Events
Deployed on Vercel (frontend) and Azure App Service (backend).

Getting Started
Backend
Run
cd server
cp .env.example .env
npm install
psql -U your_user -d track_sd05 -f src/db/schema.sql
npm start
Frontend
Run
cd client
npm install
npm run dev
For local development, set VITE_API_URL to your backend URL.

For production/demo use, set VITE_API_URL to the deployed backend URL.

API Overview
Method	Endpoint	Description
POST	/tickets	Register a new ticket. Requires Idempotency-Key header.
GET	/tickets/queue	Current queue summary.
GET	/tickets/:id/stream	Server-Sent Events stream of live position updates.
POST	/tickets/:id/hold	Mark a ticket held.
POST	/tickets/:id/recall	Move a ticket to the back of the queue after a miss.
POST	/tickets/:id/reinstate	Reinstate a missed ticket.
GET	/admin/reinstatements	Reinstatement log.
GET	/health/db	Backend/database connectivity check.
Testing
Run
cd server
npm test
server/tests/concurrency.test.js fires simultaneous registration requests to verify atomic sequencing and idempotency behavior under concurrent load.

Out of Scope (MVP)
Telehealth, payments/insurance integration, advanced analytics dashboards, indoor geofencing, position-swapping, multi-hospital sync, and live production SMS/IVR provider integration.

Author
Ibrahim Danjuma — Byteforce Solutions Tech Ltd.
3MTT NextGen Capstone Project, 2026.

License
MIT
