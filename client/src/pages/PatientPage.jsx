import { useState } from "react";
import { Link } from "react-router-dom";
import TicketForm from "../components/TicketForm";
import QueueStatus from "../components/QueueStatus";

export default function PatientPage() {
  const [currentTicket, setCurrentTicket] = useState(null);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        fontFamily: "Arial, sans-serif",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                background: "#e5e7eb",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#374151",
              }}
            >
              Patient View
            </div>
            <h1
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
              }}
            >
              Queue Status
            </h1>
          </div>

          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/" style={navStyle}>
              Home
            </Link>
            <Link to="/nurse" style={navStyle}>
              Nurse
            </Link>
            <Link to="/doctor" style={navStyle}>
              Doctor
            </Link>
          </nav>
        </div>

        <TicketForm onTicketCreated={setCurrentTicket} />
        <QueueStatus ticketId={currentTicket?.id ?? null} />
      </div>
    </main>
  );
}

const navStyle = {
  textDecoration: "none",
  color: "#111827",
  background: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: 700,
};
