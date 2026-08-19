import { Link } from "react-router-dom";

export default function HomePage() {
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
            background: "#ffffff",
            borderRadius: 20,
            padding: "32px 28px",
            border: "1px solid #dfe3e8",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
          }}
        >
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
            Clinic Queue System
          </div>

          <h1
            style={{
              margin: "16px 0 12px",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: 1.05,
            }}
          >
            Track SD-05
          </h1>

          <p style={{ fontSize: 22, lineHeight: 1.6, margin: "0 0 28px" }}>
            A queue system built around the human flow: patient registration,
            live waiting updates, nurse intake, and doctor-led consultation
            handoff.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link to="/patient" style={primaryCardStyle}>
              Patient View
            </Link>
            <Link to="/nurse" style={secondaryCardStyle}>
              Nurse View
            </Link>
            <Link to="/doctor" style={secondaryCardStyle}>
              Doctor View
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const primaryCardStyle = {
  textDecoration: "none",
  display: "inline-block",
  background: "#111827",
  color: "#ffffff",
  padding: "14px 22px",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 18,
};

const secondaryCardStyle = {
  textDecoration: "none",
  display: "inline-block",
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #d1d5db",
  padding: "14px 22px",
  borderRadius: 12,
  fontWeight: 700,
  fontSize: 18,
};
