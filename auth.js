// auth.js
// ---------------------------------------------------------------------------
// Tiny client-side auth for the demo. Intentionally simple: this app is a
// catch-up tool, not a system of record, and the whole point (local-first) is
// that nothing leaves the browser. We keep a "signed in" flag in sessionStorage
// so a page refresh doesn't kick the evaluator out mid-test.
//
// NOTE: These are DEMO credentials, published on purpose so judges can log in
// and test every feature. Real credentials would never live in client code.
// ---------------------------------------------------------------------------

const DEMO_USER = { username: "demo", password: "demo123", displayName: "Demo User" };
const SESSION_KEY = "missedit_session";

export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function signIn(username, password) {
  const u = (username || "").trim();
  const p = (password || "").trim();
  if (u === DEMO_USER.username && p === DEMO_USER.password) {
    const session = { username: u, displayName: DEMO_USER.displayName, at: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, session };
  }
  return { ok: false, error: "Wrong username or password. Use demo / demo123." };
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
}

export const DEMO_CREDENTIALS = { username: DEMO_USER.username, password: DEMO_USER.password };
