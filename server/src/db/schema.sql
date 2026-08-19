-- BUILD STEP 1 — Write this first, before any Node code.
--
-- Tables needed (PRD Section 6 — Data Model):
--   Patient
--   Ticket            <-- includes the atomic sequence for ticket numbering
--   NotificationAttempt
--   ReinstatementLog
--   Consultation
--
-- Before writing a single CREATE TABLE statement, make sure you can answer:
--   - Why does Ticket need a sequence, and not just a normal auto-increment
--     assigned by the application?
--   - What does each ticket status value in Section 3.5 of the PRD actually mean,
--     and what column/type will represent it?
--
-- Hand-test the sequence directly in psql (nextval()) before wiring it into
-- any application code. See build step 2 in README.md.

CREATE TABLE patient (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200),
    phone VARCHAR(25) NOT NULL,
    language_preference VARCHAR(50) NOT NULL,
    registration_channel VARCHAR(10) NOT NULL CHECK (registration_channel IN ('app', 'proxy')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE ticket_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id BIGINT NOT NULL REFERENCES patient(id) ON DELETE RESTRICT,
    sequence_number BIGINT NOT NULL DEFAULT nextval('ticket_number_seq'),
    priority_level VARCHAR(30) NOT NULL CHECK (priority_level IN ('scheduled', 'virtual_walkin', 'manual_proxy')),
    visual_identifier VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('REGISTERED', 'ACTIVE', 'HELD', 'RECALLED', 'IN_CONSULT', 'COMPLETE', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE notification_attempt (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'ivrs', 'app')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'pending')),
    delivered_at TIMESTAMPTZ
);

CREATE TABLE reinstatement_log (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) NOT NULL,
    reason_code VARCHAR(30) NOT NULL CHECK (reason_code IN ('network_dead_zone', 'notification_not_received', 'registered_in_error', 'other')),
    free_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consultation (
    id BIGSERIAL PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES ticket(id) ON DELETE CASCADE,
    doctor_id VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    delta_minutes INTEGER
);
