import { useEffect, useRef, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const CACHE_KEY = "track-sd-05:last-queue-state";
const FALLBACK_AFTER_MS = 75_000;

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readCachedState() {
  if (typeof window === "undefined") return null;
  return safeParse(window.localStorage.getItem(CACHE_KEY) || "null");
}

function writeCachedState(payload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export default function QueueStatus({ ticketId }) {
  const [streamData, setStreamData] = useState(() => readCachedState());
  const [heartbeat, setHeartbeat] = useState(null);
  const [connectionState, setConnectionState] = useState(
    "Waiting for a ticket",
  );
  const [lastUpdated, setLastUpdated] = useState(
    () => readCachedState()?.updatedAt ?? null,
  );
  const fallbackTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    const clearTimers = () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      fallbackTimerRef.current = null;
      pollTimerRef.current = null;
    };

    const stopSource = () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };

    const applyPayload = (payload) => {
      setStreamData(payload);
      setLastUpdated(payload.updatedAt || new Date().toISOString());
      writeCachedState(payload);
    };

    const pollOnce = async () => {
      if (!ticketId) return;
      try {
        const response = await fetch(
          `${apiBaseUrl}/tickets/${ticketId}/stream`,
        );
        if (!response.ok) return;
      } catch {
        // keep last known state; client remains usable
      }
    };

    clearTimers();
    stopSource();

    if (!ticketId) {
      setStreamData(null);
      setHeartbeat(null);
      setConnectionState("Waiting for a ticket");
      setLastUpdated(readCachedState()?.updatedAt ?? null);
      return undefined;
    }

    setConnectionState("Connecting to queue stream...");
    const source = new EventSource(`${apiBaseUrl}/tickets/${ticketId}/stream`);
    sourceRef.current = source;

    const scheduleFallback = () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = setTimeout(() => {
        setConnectionState(
          "Live stream stalled. Falling back to cached/polling mode...",
        );
        pollOnce();
        pollTimerRef.current = setInterval(pollOnce, FALLBACK_AFTER_MS);
        stopSource();
      }, FALLBACK_AFTER_MS);
    };

    const handleQueueUpdate = (event) => {
      const payload = JSON.parse(event.data);
      applyPayload(payload);
      setConnectionState("Receiving live queue updates");
      scheduleFallback();
    };

    const handleHeartbeat = (event) => {
      const payload = JSON.parse(event.data);
      setHeartbeat(payload);
      scheduleFallback();
    };

    source.addEventListener("queue_update", handleQueueUpdate);
    source.addEventListener("heartbeat", handleHeartbeat);
    source.onerror = () => {
      setConnectionState("Connection lost. Reconnecting...");
      scheduleFallback();
    };

    scheduleFallback();

    return () => {
      clearTimers();
      source.removeEventListener("queue_update", handleQueueUpdate);
      source.removeEventListener("heartbeat", handleHeartbeat);
      source.close();
    };
  }, [ticketId]);

  const displayLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : "—";

  return (
    <section className="card" aria-live="polite">
      <h2 className="card-title">Queue Status</h2>

      <p className="muted">
        <strong>Connection:</strong> {connectionState}
      </p>

      <p className="muted">
        <strong>Last Updated:</strong> {displayLastUpdated}
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
                {streamData.position ??
                  streamData.queuePosition ??
                  streamData.queue_position ??
                  "—"}
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
