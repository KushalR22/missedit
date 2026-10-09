// api-client.js
// ---------------------------------------------------------------------------
// Thin client that calls our own /api/analyze serverless function (which in
// turn calls Gemini). The UI never talks to Gemini directly, so the API key
// stays on the server.
//
// On a rate limit (HTTP 429) it automatically retries a couple of times with a
// short backoff, reporting each wait through onRetry so the UI can show a
// friendly "Model is busy, retrying…" message instead of just failing.
// ---------------------------------------------------------------------------

const MAX_RETRIES = 2;        // total attempts = 1 + MAX_RETRIES
const RETRY_DELAY_MS = 3000;  // wait between retries

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function analyzeConversation(conversation, userName, onRetry) {
  let attempt = 0;

  while (true) {
    let res;
    try {
      res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation, userName }),
      });
    } catch {
      // Network error (offline, DNS, etc.) — retry if we have attempts left.
      if (attempt < MAX_RETRIES) {
        attempt++;
        if (onRetry) onRetry(`Network hiccup — retrying (${attempt}/${MAX_RETRIES})…`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw new Error("Can't reach the server. Check your connection and try again.");
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("The server returned an unexpected response. Please try again.");
    }

    // Rate limited: back off and retry automatically.
    if (res.status === 429 && attempt < MAX_RETRIES) {
      attempt++;
      if (onRetry) onRetry(`Model is busy — retrying in ${RETRY_DELAY_MS / 1000}s (${attempt}/${MAX_RETRIES})…`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status}).`);
    }
    return data;
  }
}
