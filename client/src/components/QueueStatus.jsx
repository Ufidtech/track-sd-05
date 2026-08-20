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
    <section className="card" aria-live="polite">
      <h2 className="card-title">Queue Status</h2>

      <p className="muted">
        <strong>Connection:</strong> {connectionState}
      </p>

      {heartbeat && (
        <p className="muted">
          Last heartbeat: {new Date(heartbeat.timestamp).toLocaleTimeString()}
        </p>
      )}

      {streamData ? (
        <div className="live-card">
          <div className="live-row">
            <div>
              <div className="muted">Your ticket</div>
              <div className="ticket-number-small">
                {streamData.ticket?.sequence_number ??
                  streamData.ticket?.id ??
                  "—"}
              </div>
            </div>

            <div>
              <div className="muted">Status</div>
              <div className="status">
                {streamData.ticket?.status ?? streamData.status ?? "—"}
              </div>
            </div>

            <div>
              <div className="muted">Position</div>
              <div className="position">
                {streamData.position ?? streamData.queue_position ?? "—"}
              </div>
            </div>
          </div>

          {streamData.raw && (
            <pre className="debug">
              {JSON.stringify(streamData.raw, null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 18, margin: 0 }}>No live queue data yet.</p>
      )}
    </section>
  );
}
