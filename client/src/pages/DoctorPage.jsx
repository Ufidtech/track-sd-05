import { Link, useNavigate } from "react-router-dom";
import { getRole, clearRole } from "../utils/role";
import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function DoctorPage() {
  const [queue, setQueue] = useState([]);
  const [calledTicket, setCalledTicket] = useState(null);
  const [calledError, setCalledError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadQueue = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/tickets/queue`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to load queue");
      }
      setQueue(data.queue || []);
    } catch (err) {
      setCalledError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const callNextPatient = async () => {
    try {
      setCalledError(null);
      const res = await fetch(`${apiBaseUrl}/doctors/1/next`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to call next patient");
      setCalledTicket(data.ticket ?? data);
      await loadQueue();
    } catch (err) {
      setCalledError(err.message || String(err));
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "Arial, sans-serif",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 24,
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
                background: "#dcfce7",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#166534",
              }}
            >
              Doctor View
            </div>
            <h1
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
              }}
            >
              Queue Review
            </h1>
          </div>

          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/" style={navStyle}>
              Home
            </Link>
            {getRole() === "doctor" ? (
              <>
                <Link to="/doctor" style={navStyle}>
                  Doctor
                </Link>
                <button
                  onClick={() => {
                    clearRole();
                    navigate("/");
                  }}
                  style={navStyle}
                >
                  Change Role
                </button>
              </>
            ) : (
              <>
                <Link to="/doctor" style={navStyle}>
                  Doctor
                </Link>
              </>
            )}
          </nav>
        </div>

        <section
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: 28,
            border: "1px solid #dfe3e8",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>
            Doctor responsibilities
          </h2>
          <ul
            style={{
              fontSize: 18,
              lineHeight: 1.8,
              paddingLeft: 24,
              margin: 0,
            }}
          >
            <li>Review the next queued patient in sequence.</li>
            <li>
              Advance the patient from registered or active state into
              consultation.
            </li>
            <li>Use the backend doctor endpoint to keep queue flow moving.</li>
            <li>
              Confirm the patient’s status updates are reflected in real time.
            </li>
          </ul>
        </section>

        <div style={{ marginTop: 18 }}>
          <h3>Doctor actions</h3>
          <button
            className="btn"
            onClick={callNextPatient}
            style={{ marginTop: 8 }}
          >
            Call Next
          </button>

          {calledError && (
            <div style={{ marginTop: 12, color: "#b42318" }}>{calledError}</div>
          )}

          {calledTicket && (
            <div style={{ marginTop: 12 }} className="card">
              <div style={{ fontWeight: 800 }}>
                {calledTicket.sequence_number ?? calledTicket.id}
              </div>
              <div style={{ color: "#6b7280" }}>
                Status: {calledTicket.status ?? calledTicket.state}
              </div>
            </div>
          )}
        </div>

        <section
          style={{
            background: "#ffffff",
            borderRadius: 18,
            padding: 28,
            border: "1px solid #dfe3e8",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
            marginTop: 24,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Active queue</h2>

          {loading ? (
            <p>Loading queue…</p>
          ) : queue.length === 0 ? (
            <p>No waiting patients.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {queue.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 12,
                    background: "#f9fafb",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Queue</div>
                    <strong>{ticket.queuePosition}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Ticket</div>
                    <strong>{ticket.sequence_number}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      Patient
                    </div>
                    <strong>{ticket.displayName}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Status</div>
                    <strong>{ticket.status}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
