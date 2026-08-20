Track SD-05 — Clinic Appointment System

A patient never has to wonder how much longer they'll wait.

Track SD-05 replaces the chaos of a public hospital's morning queue — 200+ patients converging at 07:00, no visibility, no fairness, no way to know if you're next or forgotten — with a single, transparent, concurrency-safe digital queue that works on the cheapest Android phone in the room and never loses a patient's place just because a text message failed to arrive.

Built as a 3MTT NextGen capstone project.

Live demo: https://track-sd-05.vercel.app Backend health: https://track-sd-05-backend-b3ece8gpgkd9bbf3.southafricanorth-01.azurewebsites.net/health/db Full specification: docs/PRD.md

Why this exists

At National Hospital Abuja, the median patient spends 2.7 hours in the building to get a 15-minute consultation — most of it lost to unmanaged block-arrival congestion and opaque waiting. Private clinics, with appointment systems and visible queues, average 44.9 minutes. Track SD-05 closes that gap not by rationing care, but by digitizing the one thing that was never digital: the queue itself.

It's designed around three real patients, not one idealized user —

Amina, who books a fixed slot and needs certainty her time won't be wasted.
Bello, who tracks the queue from his shop and only walks over when it's his turn.
The Kure Market food seller, who has no smartphone at all and is registered by a nurse, then guided by a color-coded ticket and a voice call in her own language.

Every architectural decision below exists to serve all three at once — not just the person with the newest phone.

Status

Actively in development for capstone submission. This section is kept accurate on purpose — check it before assuming a feature works.

Component	Status
PostgreSQL schema, atomic ticket sequence	✅ Deployed and verified
Backend infrastructure (Azure App Service + Postgres)	✅ Live and connected
CORS / cross-origin request handling	✅ Working
Frontend shell (React, Vercel)	✅ Deployed
Patient registration endpoint	🚧 In active development
Idempotency-safe duplicate handling	🚧 In active development
Real-time queue updates (SSE)	🚧 In active development
Ticket lifecycle (hold / recall / expiry)	✅ Status-transition logic implemented
Multi-doctor pull queue	🚧 Planned
Multi-language audio ticket calls	🚧 One language implemented

See DEFENSE_NOTES.md for the reasoning behind each core design decision.

What makes this different from "just a queue app"

A ticket number is never issued twice, even under simultaneous load. Ticket numbering runs through a PostgreSQL SEQUENCE — an atomic, engine-guaranteed counter — instead of application-level SELECT MAX(id)+1, which breaks under exactly the kind of concurrent registration surge this system exists to handle.

A retried request never creates a duplicate ticket. Every registration requires a client-generated Idempotency-Key. A nurse's double-click or a dropped connection returns the original ticket, not a second one.

A patient's place in line is never lost because a text message failed to send. Notification delivery is treated as best-effort, not guaranteed — if an SMS or call can't be confirmed delivered, the system holds the patient's position rather than penalizing them for a carrier failure.

Real-time updates without draining a prepaid data bundle. Server-Sent Events push queue changes only when something actually moves, instead of every device polling on a timer — with a heartbeat and fallback so it stays reliable even on carrier networks that buffer streamed connections.

Architecture
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

Stack: React (Vite) · Node.js · Express · PostgreSQL · Server-Sent Events — deployed on Vercel (frontend) and Azure App Service (backend) via GitHub Actions.

Getting Started
Backend
bash
cd server
cp .env.example .env     # fill in your local Postgres credentials
npm install
psql -U your_user -d track_sd05 -f src/db/schema.sql
npm start
Frontend
bash
cd client
npm install
npm run dev

Set the backend URL as a full absolute URL (including https://) in the frontend's environment configuration — a bare hostname will silently resolve as a relative path instead of reaching the backend.

API Overview
Method	Endpoint	Description
POST	/tickets	Register a new ticket. Requires Idempotency-Key header.
GET	/tickets/queue	Current queue summary.
GET	/tickets/:id/stream	Server-Sent Events stream of live position updates.
POST	/tickets/:id/hold	Mark a ticket held (notification undelivered).
POST	/tickets/:id/recall	Move a ticket to the back of the queue after confirmed misses.
GET	/health/db	Backend/database connectivity check.
Testing
bash
cd server
npm test

server/tests/concurrency.test.js fires simultaneous registration requests to prove the atomic sequence and idempotency key hold up under real concurrent load.

Out of Scope (MVP)

Telehealth, payments/insurance integration, advanced analytics dashboards, indoor geofencing, position-swapping, multi-hospital sync, and live production SMS/IVR provider integration. Full rationale in docs/PRD.md, Section 9.

Author

Ibrahim Danjuma — Byteforce Solutions Tech Ltd. 3MTT NextGen Capstone Project, 2026.

License

MIT
