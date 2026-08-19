# Product Requirements Document: Track SD-05 Clinic Appointment System
**Author:** Ibrahim Danjuma, Byteforce Solutions Tech Ltd.
**Context:** 3MTT NextGen Capstone Project
**Status:** Locked for Build

---

## 1. Strategic Context & Problem Definition

The Nigerian public health sector is currently constrained by structural patient congestion. Research conducted at the National Hospital Abuja (NHA) reveals a median patient-clinic encounter time of 2.7 hours, driven by a median 1-hour wait for physician contact and an additional 30 minutes in medical records processing. Track SD-05 is a digital intervention designed to close the gap between public-sector encounter times (122.6-minute mean) and the private-sector benchmark (44.9 minutes), by digitizing the queue so the 15-minute consultation window — not administrative delay — defines the patient's time in the clinic.

### 1.1 Bottleneck Analysis
The primary driver of physician overwhelm is "block arrival": in the absence of a time-specific appointment system, most patients converge on the clinic between 07:00 and 10:00.

### 1.2 Psychological Barriers to Care
A 30-minute wait is a recognized psychological threshold in healthcare settings. Track SD-05 addresses this with real-time, transparent wait estimates.

---

## 2. Behavioral Personas

### 2.1 Amina (The Planner)
High-digital-literacy user on a high-end smartphone. Books a scheduled 15-minute slot with clear confirmation.

### 2.2 Bello (The On-Demand User)
Mid-range Android hardware. Uses "Virtual Walk-in" functionality with live, low-data wait tracking, allowing him to wait off-site.

### 2.3 The Kure Market Food Seller (The Offline/Non-Literate User)
Represents patients without smartphone access or English literacy.
- **Nurse Proxy Workflow:** on-site registration performed by staff via a proxy interface, selecting the patient's primary language.
- **Visual Communication:** color-coded visual tickets (e.g., Red Lion, Green Leaf) bypass literacy barriers.
- **Local-Language Audio:** pre-recorded audio announcements mapped to the language selected at registration.

---

## 3. Functional Specifications

### 3.1 Multi-Doctor Pull-Based Logic
The system maintains a centralized pool of waiting patients rather than fixed room assignments. Any doctor finishing a consultation pulls the next patient from the head of the queue.

### 3.2 Nurse Proxy Registration Interface
Staff-facing form for rapid registration of non-literate or device-less patients: language dropdown, one-click visual/audio ticket assignment, automatic binding to the correct audio set.

### 3.3 Ticket Generation
Every registration issues a dual-output ticket: a digital UUID (for app users) and a simplified visual/audio identifier (e.g., "Blue Star") for feature-phone users, corresponding to PA announcements.

### 3.4 Queue Priority & Sequencing
Priority is governed by two independent axes: clinical vitals-screening order and consultation queue position. Proxy registration gets priority only on the first axis, never the second — this prevents digitally-capable patients from bypassing the app by requesting proxy registration to skip the consultation queue.

| Priority Level | Type | Vitals Screening Order | Consultation Queue Position |
|---|---|---|---|
| Level 1 | Scheduled Appointment | Standard | Fixed 15-minute slot; holds exact time |
| Level 2 | Virtual Walk-in | Standard | Check-in time order |
| Level 3 | Manual On-site (Proxy) | First in vitals queue | Same as Level 2 — entry-time order, no queue-jump |

### 3.5 Ticket Lifecycle
`REGISTERED → ACTIVE → HELD (notification undelivered) → RECALLED (moved to back, on confirmed misses) → IN_CONSULT → COMPLETE`

`EXPIRED` is reached only when both: 6 confirmed-delivered notification misses, **and** total elapsed time exceeds 3 hours (configurable). On expiry, the patient sees: *"Your ticket has expired due to prolonged inactivity. Please see the registration desk to re-register."* — never phrased as a cancellation. This frees the queue slot and prevents dead tickets from accumulating during peak hours.

---

## 4. Technical Architecture

### 4.1 Bounded Audio Bank

Browser-native speech synthesis is not used — it is unsupported in Opera Mini and unreliable for Hausa, Nupe, and Gbagyi. The system instead uses a pre-recorded, closed-vocabulary audio bank.

**Build scope:**
- One language fully built out end-to-end (ticket colors, numbers, room identifiers, status phrases), recorded with a native or fluent speaker and reviewed for accuracy — this is what gets demoed live.
- The remaining two languages are architecturally supported (same file-naming convention, same binding logic in the Nurse Proxy interface) but populated with placeholder or lower-fidelity recordings, documented as "same pattern, to be completed with dedicated voice talent post-graduation."
- Format: short Opus/AAC clips recorded on a phone/laptop mic — production audio quality is not the grading criterion; the architecture (bounded vocabulary, no live synthesis dependency, correct language routing) is.

### 4.2 Real-Time Queue Updates (Server-Sent Events)
The system uses Server-Sent Events rather than short polling or WebSockets, minimizing data cost and battery drain on low-end devices.
- Server emits a heartbeat event every 25 seconds.
- If the client receives no event within 75 seconds, it falls back to a single polling request and attempts to silently re-establish the SSE connection.
- The "Last Updated" timestamp is always displayed, regardless of transport method.

### 4.3 Concurrency & Ticket Sequencing
Application-level "read-then-write" ticket numbering is prohibited. Ticket numbering uses a genuinely atomic mechanism — a Postgres `SEQUENCE` or Redis `INCR`. All registration requests include a client-generated idempotency key so a retried submission (e.g., double-click, network lag) returns the original ticket rather than issuing a new one. This is tested under simulated concurrent load as part of acceptance criteria (Section 9).

### 4.4 Offline-First State Management
The client caches the last known queue state locally. During a network drop, the UI continues showing the last known state with its "Last Updated" timestamp rather than an error or blank screen.

### 4.5 Bundle & Performance Constraints
- Total bundle size under 500KB; no external CDN dependencies.
- Minimal time-to-interactive on 3G and low-end Android devices.
- Stack: vanilla JS frontend, Node.js/Express backend, HTML5.

---

## 5. Notification Handling & Error Recovery

### 5.1 Delivery Confirmation Policy
The system distinguishes "sent" from "delivered" using delivery status where the notification provider supports it. If a notification is not confirmed delivered, the system holds the patient's position rather than penalizing them — a patient is never demoted or expired due to a failure in the notification channel itself.

**Build scope:** SMS/IVR delivery is simulated (mocked delivery-status responses) rather than wired to a live paid gateway, since a real carrier account isn't needed to demonstrate the fail-open logic. The delivery-status handling code is written so a real provider (e.g., Termii, Africa's Talking) could be plugged in later without changing the core queue logic.

### 5.2 Registrar Dashboard & Manual Override
A staff-facing "Reinstate" control restores a patient's position when they were physically present but missed due to a dead zone or notification failure.
- Every use requires a reason selection from a fixed list (`Network dead zone`, `Notification not received`, `Registered in error`, `Other — specify`).
- Every reinstatement is logged with staff ID, timestamp, ticket ID, and reason code, viewable in a simple filterable table — this is a straightforward log view, not a full role-based access control system.

### 5.3 Strike Policy
The 3-strike missed-notification policy applies only to confirmed-delivered notifications. A confirmed-delivered miss moves the patient to the back of the queue, not to cancellation. Cancellation occurs only through the ticket expiry mechanism (Section 3.5).

---

## 6. Data Model

- **Patient** — id, name (optional for proxy registration), phone, language_preference, registration_channel (`app` | `proxy`)
- **Ticket** — id (UUID), sequence_number (atomic), patient_id, priority_level, visual_identifier, status, created_at, expires_at
- **NotificationAttempt** — id, ticket_id, channel, sent_at, delivery_status, delivered_at
- **ReinstatementLog** — id, ticket_id, staff_id, reason_code, free_text, timestamp
- **Consultation** — id, ticket_id, doctor_id, started_at, ended_at, delta_minutes

---

## 7. API Surface

- `POST /tickets` — registration (app or proxy); requires `Idempotency-Key` header
- `GET /tickets/:id/stream` — SSE connection; emits `queue_update` and `heartbeat` events
- `POST /tickets/:id/reinstate` — requires `staff_id`, `reason_code`
- `POST /doctors/:id/next` — pulls next patient from the pool
- `GET /admin/reinstatements` — filterable log

---

## 8. Acceptance Criteria

- [ ] Two simultaneous registration requests sharing an idempotency key never produce two tickets (tested under simulated concurrent load).
- [ ] SSE connection recovers to accurate queue data within 75 seconds of a simulated stalled connection.
- [ ] A ticket with 6 simulated confirmed-delivered misses and over 3 hours elapsed transitions to `EXPIRED` with the correct patient-facing message.
- [ ] The Reinstate action cannot be submitted without a reason code.
- [ ] The primary demo language's audio set plays correctly for a full registration-to-consultation flow.
- [ ] The client remains usable, showing last-known state, through a simulated network drop.
- [ ] Proxy-registered patients are never placed ahead of an earlier-timestamped digital walk-in in consultation queue order.

---

## 9. Out of Scope

- Telehealth / video or audio consultation modules
- Payments or insurance gateway integration
- Advanced analytics dashboards
- Indoor geofencing and position-swapping between patients
- Dynamic overtime smoothing (raw delay delta based on the most recently completed consultation only)
- Multi-hospital data synchronization
- Client-side text-to-speech
- Live SMS/IVR provider integration (mocked for demo; architecture supports future integration)
- Full three-language production-grade audio (one language built fully; remaining two architecturally supported, placeholder audio)
