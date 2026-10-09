// render.js
// ---------------------------------------------------------------------------
// Builds the interactive "brief" from the structured analysis object.
// Pure DOM-string construction + a small set of data attributes that app.js
// wires up for interactivity (filtering, checking off tasks, collapsing).
// All user/AI text is HTML-escaped before it ever touches innerHTML (security).
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const VERDICT = {
  high:   { label: "Needs you now",    note: "Time-sensitive things are waiting on you.", icon: "!" },
  medium: { label: "Worth a look",     note: "A few things to handle — nothing on fire.",  icon: "~" },
  low:    { label: "You're caught up",  note: "Mostly chatter. Nothing urgent for you.",    icon: "✓" },
};

function section({ id, title, icon, count, filter, body }) {
  const headingId = "grp-" + id;
  const countPill = count > 0 ? `<span class="group-count">${count}</span>` : "";
  // data-filter lets the stat chips show/hide whole sections
  return `<article class="result-group" data-filter="${filter || ""}" aria-labelledby="${headingId}">
    <button class="group-head" aria-expanded="true" aria-controls="body-${id}">
      <span class="group-icon" aria-hidden="true">${icon}</span>
      <h3 id="${headingId}">${escapeHtml(title)}</h3>
      ${countPill}
      <span class="group-chevron" aria-hidden="true">⌄</span>
    </button>
    <div class="group-body" id="body-${id}">${body}</div>
  </article>`;
}

function emptyNote(text) {
  return `<p class="group-empty">${escapeHtml(text)}</p>`;
}

// Build the live stat row — tappable chips that filter the brief.
function statRow(data) {
  const stats = [
    { key: "all",      label: "Everything", n: null, icon: "✦" },
    { key: "tasks",    label: "Tasks",      n: data.actionItems.length, icon: "✅" },
    { key: "deadlines",label: "Deadlines",  n: data.deadlines.length,   icon: "⏰" },
    { key: "mentions", label: "Mentions",   n: data.mentions.length,    icon: "👋" },
  ];
  const chips = stats.map((s) => {
    const num = s.n === null ? "" : `<span class="stat-n">${s.n}</span>`;
    return `<button class="stat-chip${s.key === "all" ? " is-active" : ""}" data-stat="${s.key}" type="button">
      <span class="stat-ic" aria-hidden="true">${s.icon}</span>${num}<span class="stat-lb">${s.label}</span>
    </button>`;
  }).join("");
  return `<div class="stat-row" role="group" aria-label="Filter the brief">${chips}</div>`;
}

export function renderResults(data) {
  const p = ["high", "medium", "low"].includes(data.priority) ? data.priority : "low";
  const v = VERDICT[p];
  const parts = [];

  // --- Verdict: the hero moment ---
  parts.push(`<div class="verdict ${p}">
    <span class="verdict-badge" aria-hidden="true">${v.icon}</span>
    <div class="verdict-text"><strong>${v.label}</strong><span>${escapeHtml(v.note)}</span></div>
  </div>`);

  // --- Live stat / filter row ---
  parts.push(statRow(data));

  // --- Summary ---
  parts.push(section({
    id: "summary", title: "Summary", icon: "📝", count: 0, filter: "",
    body: `<p class="summary-text">${escapeHtml(data.summary)}</p>`,
  }));

  // --- Action items (checkable) ---
  if (data.actionItems.length) {
    const items = data.actionItems.map((a, i) => `
      <li class="task" data-prio="${a.priority}">
        <input type="checkbox" class="task-check" id="task-${i}" aria-label="Mark done: ${escapeHtml(a.text)}" />
        <label for="task-${i}" class="task-box" aria-hidden="true"></label>
        <div class="task-body">
          <div class="task-text">${escapeHtml(a.text)}</div>
          <div class="task-meta">
            <span class="badge ${a.priority}">${escapeHtml(a.priority)}</span>
            <span class="owner">· ${escapeHtml(a.owner)}</span>
          </div>
        </div>
      </li>`).join("");
    parts.push(section({
      id: "tasks", title: "Action items", icon: "✅", count: data.actionItems.length, filter: "tasks",
      body: `<ul class="task-list">${items}</ul>`,
    }));
  } else {
    parts.push(section({ id: "tasks", title: "Action items", icon: "✅", count: 0, filter: "tasks",
      body: emptyNote("No tasks were assigned to anyone.") }));
  }

  // --- Deadlines ---
  if (data.deadlines.length) {
    const items = data.deadlines.map((d) => `
      <div class="pill deadline">
        <span class="pill-dot" aria-hidden="true"></span>
        <span class="pill-main">${escapeHtml(d.what)}</span>
        <span class="pill-when">${escapeHtml(d.when)}</span>
      </div>`).join("");
    parts.push(section({ id: "deadlines", title: "Deadlines", icon: "⏰", count: data.deadlines.length, filter: "deadlines",
      body: `<div class="pill-list">${items}</div>` }));
  } else {
    parts.push(section({ id: "deadlines", title: "Deadlines", icon: "⏰", count: 0, filter: "deadlines",
      body: emptyNote("No deadlines mentioned.") }));
  }

  // --- Mentions ---
  if (data.mentions.length) {
    const items = data.mentions.map((m) => `
      <div class="pill mention">
        <span class="pill-key">${escapeHtml(m.who)}</span>
        <span class="pill-main">${escapeHtml(m.context)}</span>
      </div>`).join("");
    parts.push(section({ id: "mentions", title: "Mentions of you", icon: "👋", count: data.mentions.length, filter: "mentions",
      body: `<div class="pill-list">${items}</div>` }));
  } else {
    parts.push(section({ id: "mentions", title: "Mentions of you", icon: "👋", count: 0, filter: "mentions",
      body: emptyNote("You weren't directly mentioned.") }));
  }

  // --- Decisions ---
  if (data.decisions.length) {
    const items = data.decisions.map((d) =>
      `<li class="deci"><span class="deci-dot" aria-hidden="true">✓</span><span>${escapeHtml(d)}</span></li>`).join("");
    parts.push(section({ id: "decisions", title: "Decisions made", icon: "🤝", count: data.decisions.length, filter: "",
      body: `<ul class="deci-list">${items}</ul>` }));
  } else {
    parts.push(section({ id: "decisions", title: "Decisions made", icon: "🤝", count: 0, filter: "",
      body: emptyNote("No clear decisions were made.") }));
  }

  // --- Key messages ---
  if (data.keyMessages.length) {
    const items = data.keyMessages.map((k) => `
      <li class="quote">
        <p>${escapeHtml(k.text)}</p>
        <div class="cite"><span class="cite-from">${escapeHtml(k.from)}</span> · ${escapeHtml(k.why)}</div>
      </li>`).join("");
    parts.push(section({ id: "messages", title: "Key messages", icon: "💬", count: data.keyMessages.length, filter: "",
      body: `<ul class="quote-list">${items}</ul>` }));
  }

  return parts.join("");
}

// Plain-text export for the Copy button.
export function resultsToText(data) {
  const L = [];
  L.push("WHAT YOU MISSED", "===============", "");
  L.push(`Overall: ${data.priority.toUpperCase()}`, "");
  L.push("SUMMARY", data.summary, "");
  if (data.actionItems.length) {
    L.push("ACTION ITEMS");
    data.actionItems.forEach((a) => L.push(`  [ ] (${a.priority}) ${a.text} — ${a.owner}`));
    L.push("");
  }
  if (data.deadlines.length) {
    L.push("DEADLINES");
    data.deadlines.forEach((d) => L.push(`  • ${d.what} — ${d.when}`));
    L.push("");
  }
  if (data.mentions.length) {
    L.push("MENTIONS OF YOU");
    data.mentions.forEach((m) => L.push(`  • ${m.who}: ${m.context}`));
    L.push("");
  }
  if (data.decisions.length) {
    L.push("DECISIONS");
    data.decisions.forEach((d) => L.push(`  • ${d}`));
    L.push("");
  }
  return L.join("\n");
}

export { escapeHtml };
