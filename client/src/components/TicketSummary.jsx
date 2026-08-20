import React from "react";
import { Link } from "react-router-dom";

export default function TicketSummary({ ticket }) {
  if (!ticket) return null;

  const number = ticket.number ?? ticket.ticket_number ?? ticket.id ?? "—";
  const status = ticket.status ?? ticket.state ?? "registered";
  const createdAt =
    ticket.created_at ?? ticket.createdAt ?? ticket.timestamp ?? null;

  return (
    <div className="card ticket-summary" role="status" aria-live="polite">
      <div className="ticket-row">
        <div className="ticket-number">{number}</div>
        <div className={`badge badge-${status.replace(/\s+/g, "-")}`}>
          {status}
        </div>
      </div>

      {createdAt && (
        <div className="muted">
          Created: {new Date(createdAt).toLocaleString()}
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button
          className="btn"
          onClick={() => {
            try {
              navigator.clipboard.writeText(String(number));
            } catch (e) {
              /* ignore */
            }
          }}
        >
          Copy Ticket
        </button>

        <Link
          className="btn btn-outline"
          to="/patient"
          style={{ textDecoration: "none" }}
        >
          Back to Patient
        </Link>
      </div>
    </div>
  );
}
