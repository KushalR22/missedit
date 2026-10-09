// api-client.js
// ---------------------------------------------------------------------------
// Thin client that calls our own /api/analyze serverless function (which in
// turn calls Gemini). The UI never talks to Gemini directly, so the API key
// stays on the server.
// ---------------------------------------------------------------------------

export async function analyzeConversation(conversation, userName) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation, userName }),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status}).`);
  }
  return data;
}
