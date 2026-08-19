# Deadline Plan — Submission Aug 21, 2026

Rule if you fall behind on any day: cut a feature, never cut your
understanding of what's already built. A smaller project you can defend
cold beats a bigger one you can't explain.

## Aug 17 — Schema + DB connection working
1. Confirm Postgres is running; create the `track_sd05` database.
2. Write real CREATE TABLE statements in server/src/db/schema.sql
   (patient, ticket + ticket_number_seq first, then the simpler
   supporting tables).
3. Run schema.sql against the real database; fix errors as they appear.
4. Hand-test in psql: call nextval() a few times, insert a patient +
   ticket, then try inserting a ticket with a fake patient_id and confirm
   the foreign key constraint rejects it.
5. npm install express pg dotenv in server/.
6. Write the real Pool connection in config/db.js (credentials from .env,
   copied from .env.example).
7. Add one test route in index.js that queries the DB and returns real
   JSON. Confirm it works before stopping for the day.

## Aug 18 — Registration endpoint + concurrency proof
- Build POST /tickets with Idempotency-Key handling and atomic ticket
  numbering via the sequence.
- Write and run concurrency.test.js: fire concurrent requests, prove no
  duplicate tickets. This is your strongest piece of defense evidence —
  keep the output/logs from this test.

## Aug 19 — Lifecycle logic + SSE endpoint
- Ticket status transitions (simplify to REGISTERED -> ACTIVE ->
  IN_CONSULT -> COMPLETE, plus a basic HELD/EXPIRED path if time allows).
- Build the SSE endpoint (queue_update + heartbeat events), verify with
  `curl -N` before touching any client code.

## Aug 20 — End-to-end verification, then STOP building
- Wire up test-harness/plain-client.html against the real backend.
- If using React: only after the plain-JS harness fully works, scaffold
  Vite in /client and port the already-working fetch()/EventSource logic
  into TicketForm.jsx and QueueStatus.jsx. Two components, useState +
  useEffect only.
- Once it works end to end, STOP adding features. Switch to writing
  DEFENSE_NOTES.md entries and rehearsing explanations out loud.

## Aug 21 — Final review and submission
- No new code. Re-read schema.sql and the controllers cold — confirm you
  can explain every decision without looking at comments.
- Fix only what's broken. Submit.
