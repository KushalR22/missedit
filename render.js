// render.js
// ---------------------------------------------------------------------------
// Pure rendering: takes the structured analysis object and builds DOM for it.
// Separated from logic so it's easy to read, test, and restyle.
// All user/AI text goes through escapeHtml to prevent HTML injection (security).
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
  high:   { label: "Needs you now",  note: "There's urgent, time-sensitive stuff in here.", badge: "!" },
  medium: { label: "Worth a look",   note: "A few things to handle, nothing on fire.",       badge: "~" },
  low:    { label: "You're caught up", note: "Mostly chatter — nothing urgent waiting on you.", badge: "✓" },
};

// Each result group is a self-contained section of the report, so it's an
// <article> labelled by its own heading — correct landmark semantics for AT.
// `count` shows a pill with how many items the group found (null = no pill).
function group(title, icon, innerHtml, count) {
  const headingId = "grp-" + title.toLowerCase().replace(/[^a-z]+/g, "-");
  const countPill = count != null && count > 0
    ? `<span class="group-count">${count}</span>` : "";
  return `<article class="result-group" aria-labelledby="${headingId}">
    <h3 id="${headingId}"><span class="group-icon" aria-hidden="true">${icon}</span> ${escapeHtml(title)}${countPill}</h3>
    ${innerHtml}
  </article>`;
}

function emptyNote(text) {
  return `<p class="group-empty">${escapeHtml(text)}</p>`;
}

export function renderResults(data) {
  const parts = [];

  // --- The verdict: the one bold moment of the report ---
  const p = ["high", "medium", "low"].includes(data.priority) ? data.priority : "low";
  const v = VERDICT[p];
  parts.push(`<div class="verdict ${p}">
    <span class="verdict-badge" aria-hidden="true">${v.badge}</span>
    <span class="verdict-text"><strong>${v.label}</strong><span>${escapeHtml(v.note)}</span></span>
  </div>`);

  // --- Summary ---
  parts.push(group("Summary", "📝",
    `<p class="summary-text">${escapeHtml(data.summary)}</p>`));

  // --- Action items (with a colored urgency rail + badge) ---
  if (data.actionItems.length) {
    const items = data.actionItems.map((a) => `
      <li class="list-item">
        <span class="rail ${a.priority}" aria-hidden="true"></span>
        <div class="item-body">
          <div class="item-main">${escapeHtml(a.text)}
            <span class="badge ${a.priority}">${escapeHtml(a.priority)}</span>
          </div>
          <div class="item-meta">Owner: <span class="owner">${escapeHtml(a.owner)}</span></div>
        </div>
      </li>`).join("");
    parts.push(group("Action items", "✅", `<ul class="list">${items}</ul>`, data.actionItems.length));
  } else {
    parts.push(group("Action items", "✅", emptyNote("No tasks were assigned to anyone.")));
  }

  // --- Deadlines ---
  if (data.deadlines.length) {
    const items = data.deadlines.map((d) => `
      <div class="pill deadline">
        <span>${escapeHtml(d.what)}</span>
        <span class="pill-when">${escapeHtml(d.when)}</span>
      </div>`).join("");
    parts.push(group("Deadlines", "⏰", `<div class="pill-list">${items}</div>`, data.deadlines.length));
  } else {
    parts.push(group("Deadlines", "⏰", emptyNote("No deadlines mentioned.")));
  }

  // --- Mentions ---
  if (data.mentions.length) {
    const items = data.mentions.map((m) => `
      <div class="pill mention">
        <span class="pill-key">${escapeHtml(m.who)}</span>
        <span>${escapeHtml(m.context)}</span>
      </div>`).join("");
    parts.push(group("Mentions of you", "👋", `<div class="pill-list">${items}</div>`, data.mentions.length));
  } else {
    parts.push(group("Mentions of you", "👋", emptyNote("You weren't directly mentioned.")));
  }

  // --- Decisions ---
  if (data.decisions.length) {
    const items = data.decisions.map((d) =>
      `<li class="list-item"><div class="item-body"><div class="item-main">${escapeHtml(d)}</div></div></li>`).join("");
    parts.push(group("Decisions made", "🤝", `<ul class="list">${items}</ul>`, data.decisions.length));
  } else {
    parts.push(group("Decisions made", "🤝", emptyNote("No clear decisions were made.")));
  }

  // --- Key messages (only when present) ---
  if (data.keyMessages.length) {
    const items = data.keyMessages.map((k) => `
      <li class="list-item">
        <div class="item-body">
          <div class="quote">
            <p>${escapeHtml(k.text)}</p>
            <div class="cite">${escapeHtml(k.from)} · ${escapeHtml(k.why)}</div>
          </div>
        </div>
      </li>`).join("");
    parts.push(group("Key messages", "💬", `<ul class="list">${items}</ul>`, data.keyMessages.length));
  }

  return parts.join("");
}

// Build a plain-text version of the analysis for the "Copy" button.
export function resultsToText(data) {
  const lines = [];
  lines.push("WHAT YOU MISSED\n===============\n");
  lines.push(`Overall priority: ${data.priority.toUpperCase()}\n`);
  lines.push(`SUMMARY\n${data.summary}\n`);
  if (data.actionItems.length) {
    lines.push("ACTION ITEMS");
    data.actionItems.forEach((a) => lines.push(`  - [${a.priority}] ${a.text} (owner: ${a.owner})`));
    lines.push("");
  }
  if (data.deadlines.length) {
    lines.push("DEADLINES");
    data.deadlines.forEach((d) => lines.push(`  - ${d.what} — ${d.when}`));
    lines.push("");
  }
  if (data.mentions.length) {
    lines.push("MENTIONS");
    data.mentions.forEach((m) => lines.push(`  - ${m.who}: ${m.context}`));
    lines.push("");
  }
  if (data.decisions.length) {
    lines.push("DECISIONS");
    data.decisions.forEach((d) => lines.push(`  - ${d}`));
    lines.push("");
  }
  return lines.join("\n");
}

export { escapeHtml };
