import { useState } from "react";
import TicketSummary from "./TicketSummary";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

function generateIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `ticket-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const initialForm = {
  name: "Ada",
  phone: "08012345678",
  language_preference: "English",
  registration_channel: "app",
  priority_level: "virtual_walkin",
  visual_identifier: "Blue Star",
};

export default function TicketForm({ onTicketCreated }) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": generateIdempotencyKey(),
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ticket registration failed");
      }

      setResult(data);
      onTicketCreated?.(data.ticket);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #dfe3e8",
        borderRadius: 18,
        padding: 28,
        marginBottom: 24,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px",
          fontSize: "clamp(2rem, 3vw, 3rem)",
          lineHeight: 1.1,
        }}
      >
        Register Patient
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          <label style={labelStyle}>
            <span style={labelTextStyle}>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Language</span>
            <input
              name="language_preference"
              value={form.language_preference}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Channel</span>
            <select
              name="registration_channel"
              value={form.registration_channel}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="app">app</option>
              <option value="proxy">proxy</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Priority</span>
            <select
              name="priority_level"
              value={form.priority_level}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="virtual_walkin">virtual_walkin</option>
              <option value="scheduled">scheduled</option>
              <option value="manual_proxy">manual_proxy</option>
            </select>
          </label>

          <label style={labelStyle}>
            <span style={labelTextStyle}>Visual ID</span>
            <input
              name="visual_identifier"
              value={form.visual_identifier}
              onChange={handleChange}
              style={inputStyle}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            padding: "0.9rem 1.4rem",
            fontWeight: 700,
            border: "none",
            borderRadius: 10,
            background: "#1f2937",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {error && (
        <p
          style={{
            color: "#b42318",
            marginTop: 14,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {error}
        </p>
      )}

      {result && result.ticket && (
        <div style={{ marginTop: 18 }}>
          <TicketSummary ticket={result.ticket} />
        </div>
      )}
    </section>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelTextStyle = {
  fontSize: 18,
  fontWeight: 600,
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "0.8rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  boxSizing: "border-box",
  fontSize: 18,
  background: "#f9fafb",
};
