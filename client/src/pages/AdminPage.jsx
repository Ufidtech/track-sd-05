import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRole, clearRole } from "../utils/role";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AdminPage() {
  const [staffId, setStaffId] = useState("staff-001");
  const [reasonCode, setReasonCode] = useState("network_dead_zone");
  const [freeText, setFreeText] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const safeJson = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Server returned non-JSON (${response.status}): ${text.slice(0, 120)}`,
      );
    }
    return response.json();
  };

  const loadLogs = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/admin/reinstatements`);
      const data = await safeJson(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reinstatement logs");
      }
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message || "Failed to load logs");
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const submitReinstate = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/tickets/${ticketId}/reinstate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            staff_id: staffId,
            reason_code: reasonCode,
            free_text: freeText,
          }),
        },
      );
      const data = await safeJson(response);
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Reinstate failed");
      }
      setMessage("Ticket reinstated successfully");
      setTicketId("");
      setFreeText("");
      await loadLogs();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
                background: "#fee2e2",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#991b1b",
              }}
            >
              Admin View
            </div>
            <h1
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.1,
              }}
            >
              Reinstatement Control
            </h1>
          </div>

          <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link to="/" style={navStyle}>
              Home
            </Link>
            <Link to="/admin" style={navStyle}>
              Admin
            </Link>
            {getRole() === "admin" ? (
              <button
                onClick={() => {
                  clearRole();
                  navigate("/");
                }}
                style={navStyle}
              >
                Change Role
              </button>
            ) : null}
          </nav>
        </div>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Reinstate ticket</h2>
          <form onSubmit={submitReinstate} style={{ display: "grid", gap: 14 }}>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Ticket ID</span>
              <input
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Staff ID</span>
              <input
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Reason</span>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                style={inputStyle}
              >
                <option value="network_dead_zone">Network dead zone</option>
                <option value="notification_not_received">
                  Notification not received
                </option>
                <option value="registered_in_error">Registered in error</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label style={labelStyle}>
              <span style={labelTextStyle}>Free text</span>
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                style={{ ...inputStyle, minHeight: 100 }}
              />
            </label>
            <button type="submit" disabled={loading} style={primaryButtonStyle}>
              {loading ? "Submitting..." : "Reinstate Ticket"}
            </button>
          </form>
          {message && (
            <p style={{ color: "#166534", fontWeight: 700 }}>{message}</p>
          )}
          {error && (
            <p style={{ color: "#b42318", fontWeight: 700 }}>{error}</p>
          )}
        </section>

        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>Reinstatement log</h2>
          {logs.length === 0 ? (
            <p>No reinstatement records yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 14,
                    background: "#f9fafb",
                  }}
                >
                  <div>
                    <strong>Ticket:</strong> {log.ticket_id}
                  </div>
                  <div>
                    <strong>Staff:</strong> {log.staff_id}
                  </div>
                  <div>
                    <strong>Reason:</strong> {log.reason_code}
                  </div>
                  <div>
                    <strong>Time:</strong>{" "}
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.free_text ? (
                    <div>
                      <strong>Note:</strong> {log.free_text}
                    </div>
                  ) : null}
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
const cardStyle = {
  background: "#ffffff",
  borderRadius: 18,
  padding: 28,
  border: "1px solid #dfe3e8",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};
const labelStyle = { display: "flex", flexDirection: "column", gap: 6 };
const labelTextStyle = { fontSize: 16, fontWeight: 700 };
const inputStyle = {
  width: "100%",
  padding: "0.8rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  boxSizing: "border-box",
  fontSize: 16,
  background: "#f9fafb",
};
const primaryButtonStyle = {
  padding: "0.9rem 1.4rem",
  fontWeight: 700,
  border: "none",
  borderRadius: 10,
  background: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 18,
};
