import { Link } from "react-router-dom";

export default function DoctorPage() {
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
            <Link to="/patient" style={navStyle}>
              Patient
            </Link>
            <Link to="/nurse" style={navStyle}>
              Nurse
            </Link>
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
