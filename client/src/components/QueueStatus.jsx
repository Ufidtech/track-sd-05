import { useEffect, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function QueueStatus({ ticketId }) {
  const [streamData, setStreamData] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [connectionState, setConnectionState] = useState(
    "Waiting for a ticket",
  );

  useEffect(() => {
    if (!ticketId) {
      setStreamData(null);
      setHeartbeat(null);
      setConnectionState("Waiting for a ticket");
      return undefined;
    }

    setConnectionState("Connecting to queue stream...");
    const source = new EventSource(`${apiBaseUrl}/tickets/${ticketId}/stream`);

    const handleQueueUpdate = (event) => {
      const payload = JSON.parse(event.data);
      setStreamData(payload);
      setConnectionState("Receiving live queue updates");
    };

    const handleHeartbeat = (event) => {
      const payload = JSON.parse(event.data);
      setHeartbeat(payload);
    };

    source.addEventListener("queue_update", handleQueueUpdate);
    source.addEventListener("heartbeat", handleHeartbeat);
    source.onerror = () => {
      setConnectionState("Connection lost. Reconnecting...");
    };

    return () => {
      source.removeEventListener("queue_update", handleQueueUpdate);
      source.removeEventListener("heartbeat", handleHeartbeat);
      source.close();
    };
  }, [ticketId]);

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #dfe3e8",
        borderRadius: 18,
        padding: 28,
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <h2
        style={{
          margin: "0 0 16px",
          fontSize: "clamp(2rem, 3vw, 3rem)",
          lineHeight: 1.1,
        }}
      >
        Queue Status
      </h2>

      <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>
        <strong>Connection:</strong> {connectionState}
      </p>

      {heartbeat && (
        <p style={{ fontSize: 16, margin: "0 0 14px" }}>
          <strong>Last heartbeat:</strong>{" "}
          {new Date(heartbeat.timestamp).toLocaleTimeString()}
        </p>
      )}

      {streamData ? (
        <pre
          style={{
            background: "#f6f8fa",
            padding: 16,
            borderRadius: 10,
            overflowX: "auto",
            border: "1px solid #e5e7eb",
            fontSize: 15,
          }}
        >
          {JSON.stringify(streamData, null, 2)}
        </pre>
      ) : (
        <p style={{ fontSize: 18, margin: 0 }}>No live queue data yet.</p>
      )}
    </section>
  );
}
