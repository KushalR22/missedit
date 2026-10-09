// app.js
// ---------------------------------------------------------------------------
// Main controller. Wires the DOM to the auth, samples, api-client, and render
// modules. Keeps only orchestration here; details live in their own files.
// ---------------------------------------------------------------------------

import { getCurrentUser, signIn, signOut, DEMO_CREDENTIALS } from "./auth.js";
import { SAMPLES } from "./samples.js";
import { analyzeConversation } from "./api-client.js";
import { renderResults, resultsToText } from "./render.js";

// ---- Element references ----------------------------------------------------
const $ = (id) => document.getElementById(id);

const loginScreen = $("login-screen");
const appScreen = $("app-screen");
const loginForm = $("login-form");
const loginError = $("login-error");
const fillDemoBtn = $("fill-demo");
const usernameInput = $("username");
const passwordInput = $("password");

const welcome = $("welcome");
const logoutBtn = $("logout");
const themeToggle = $("theme-toggle");

const yourName = $("your-name");
const conversation = $("conversation");
const charCount = $("char-count");
const analyzeBtn = $("analyze-btn");
const clearBtn = $("clear-btn");
const inputError = $("input-error");

const emptyState = $("empty-state");
const loadingState = $("loading-state");
const resultsEl = $("results");
const modelNote = $("model-note");

// ---------------------------------------------------------------------------
// Theme (persisted per browser — a per-viewer convenience, so localStorage is ok)
// ---------------------------------------------------------------------------
function applyTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const dark = isDark();
  themeToggle.textContent = dark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}
function isDark() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr) return attr === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("missedit_theme"); } catch {}
  applyTheme(saved);
})();
themeToggle.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  try { localStorage.setItem("missedit_theme", next); } catch {}
  applyTheme(next);
});

// ---------------------------------------------------------------------------
// Screen switching
// ---------------------------------------------------------------------------
function showApp(user) {
  loginScreen.hidden = true;
  appScreen.hidden = false;
  welcome.textContent = `Hi, ${user.displayName}`;
}
function showLogin() {
  appScreen.hidden = true;
  loginScreen.hidden = false;
}

// Restore session on load so a refresh doesn't log the evaluator out
(function restore() {
  const user = getCurrentUser();
  if (user) showApp(user);
  else showLogin();
})();

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const result = signIn(usernameInput.value, passwordInput.value);
  if (result.ok) {
    showApp(result.session);
  } else {
    loginError.textContent = result.error;
    loginError.hidden = false;
  }
});

fillDemoBtn.addEventListener("click", () => {
  usernameInput.value = DEMO_CREDENTIALS.username;
  passwordInput.value = DEMO_CREDENTIALS.password;
  loginForm.requestSubmit();
});

logoutBtn.addEventListener("click", () => {
  signOut();
  showLogin();
  resetResults();
  conversation.value = "";
  yourName.value = "";
  updateCharCount();
});

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------
function updateCharCount() {
  charCount.textContent = conversation.value.length.toLocaleString();
}
conversation.addEventListener("input", updateCharCount);

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const key = chip.dataset.sample;
    const sample = SAMPLES[key];
    if (!sample) return;
    conversation.value = sample.text;
    yourName.value = sample.name;
    updateCharCount();
    inputError.hidden = true;
    conversation.focus();
  });
});

clearBtn.addEventListener("click", () => {
  conversation.value = "";
  yourName.value = "";
  updateCharCount();
  inputError.hidden = true;
  resetResults();
});

// ---------------------------------------------------------------------------
// Results state management
// ---------------------------------------------------------------------------
function resetResults() {
  resultsEl.hidden = true;
  resultsEl.innerHTML = "";
  loadingState.hidden = true;
  emptyState.hidden = false;
  modelNote.textContent = "";
}
function showLoading() {
  emptyState.hidden = true;
  resultsEl.hidden = true;
  loadingState.hidden = false;
}
function showResults(data) {
  loadingState.hidden = true;
  emptyState.hidden = true;
  resultsEl.innerHTML = renderResults(data);
  resultsEl.hidden = false;
  addCopyButton(data);
  wireInteractions();
  // one orchestrated reveal of the brief (respects reduced-motion via CSS)
  resultsEl.classList.remove("entering");
  void resultsEl.offsetWidth; // restart the animation
  resultsEl.classList.add("entering");
  if (data._model) modelNote.textContent = `Analyzed with ${data._model}`;
}

// Make the brief interactive: filter chips, collapsible sections, task progress.
function wireInteractions() {
  // 1) Stat chips filter which sections are shown
  const chips = resultsEl.querySelectorAll(".stat-chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-active", c === chip));
      const want = chip.dataset.stat;
      resultsEl.querySelectorAll(".result-group").forEach((g) => {
        const f = g.dataset.filter;
        // "all" shows everything; otherwise show summary + the matching group
        const show = want === "all" || f === want || g.querySelector("#grp-summary");
        g.hidden = !(want === "all" || f === want);
        if (g.querySelector("#grp-summary")) g.hidden = false; // always keep summary
      });
    });
  });

  // 2) Collapsible sections
  resultsEl.querySelectorAll(".group-head").forEach((head) => {
    head.addEventListener("click", () => {
      const open = head.getAttribute("aria-expanded") === "true";
      head.setAttribute("aria-expanded", String(!open));
      head.closest(".result-group").classList.toggle("collapsed", open);
    });
  });

  // 3) Checking off tasks updates a little progress meter
  const checks = resultsEl.querySelectorAll(".task-check");
  const meter = document.createElement("div");
  if (checks.length) {
    meter.className = "task-progress";
    const update = () => {
      const done = resultsEl.querySelectorAll(".task-check:checked").length;
      const total = checks.length;
      const pct = Math.round((done / total) * 100);
      meter.innerHTML = `<div class="tp-bar"><span style="width:${pct}%"></span></div>
        <span class="tp-label">${done} of ${total} done</span>`;
    };
    checks.forEach((c) =>
      c.addEventListener("change", () => {
        c.closest(".task").classList.toggle("is-done", c.checked);
        update();
      })
    );
    const tasksGroup = resultsEl.querySelector('[data-filter="tasks"] .group-body');
    if (tasksGroup) { tasksGroup.prepend(meter); update(); }
  }
}

function addCopyButton(data) {
  const row = document.createElement("div");
  row.className = "copy-row";
  const btn = document.createElement("button");
  btn.className = "btn btn-ghost btn-sm";
  btn.textContent = "📋 Copy summary";
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(resultsToText(data));
      btn.textContent = "✓ Copied";
      setTimeout(() => (btn.textContent = "📋 Copy summary"), 1600);
    } catch {
      btn.textContent = "Copy failed";
    }
  });
  row.appendChild(btn);
  resultsEl.appendChild(row);
}

// ---------------------------------------------------------------------------
// Analyze — the core action
// ---------------------------------------------------------------------------
function setBusy(busy) {
  analyzeBtn.disabled = busy;
  analyzeBtn.querySelector(".btn-label").hidden = busy;
  analyzeBtn.querySelector(".btn-spinner").hidden = !busy;
}

const MAX_CHARS = 40000; // keep in sync with the server-side guard

function setLoadingNote(msg) {
  const note = loadingState.querySelector(".loading-note");
  if (note) note.textContent = msg;
}

analyzeBtn.addEventListener("click", async () => {
  inputError.hidden = true;
  const text = conversation.value.trim();

  // Client-side validation: block empty and over-long input before it ever
  // hits the API, so we never waste a call or blow the model's token limit.
  if (text.length < 10) {
    inputError.textContent = "Please paste a conversation first (or load a sample).";
    inputError.hidden = false;
    conversation.focus();
    return;
  }
  if (text.length > MAX_CHARS) {
    inputError.textContent = `That's a bit long (${text.length.toLocaleString()} chars). Please trim it to under ${MAX_CHARS.toLocaleString()} characters.`;
    inputError.hidden = false;
    conversation.focus();
    return;
  }

  setBusy(true);
  showLoading();
  setLoadingNote("Reading the conversation with AI…");

  try {
    const data = await analyzeConversation(text, yourName.value.trim(), setLoadingNote);
    showResults(data);
  } catch (err) {
    resetResults();
    inputError.textContent = err.message || "Something went wrong. Please try again.";
    inputError.hidden = false;
  } finally {
    setBusy(false);
  }
});

updateCharCount();
