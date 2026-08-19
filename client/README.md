Build this ONLY after test-harness/plain-client.html proves the backend
works end to end (registration, idempotency, SSE updates). See main
project README for the build order.

When you get here: `npm create vite@latest . -- --template react` in this
folder, then port the already-working fetch()/EventSource logic from the
test harness into the two components below.
