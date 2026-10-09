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

const PRIORITY_LABEL = { high: "High priority", medium: "Worth a look", low: "Low priority" };
const PRIORITY_ICON = { high: "🔴", medium: "🟠", low: "🟢" };

function group(title, icon, innerHtml) {
  return `<div class="result-group">
    <h3><span aria-hidden="true">${icon}</span> ${escapeHtml(title)}</h3>
    ${innerHtml}
  </div>`;
}

function emptyNote(text) {
  return `<p class="group-empty">${escapeHtml(text)}</p>`;
}

export function renderResults(data) {
  const parts = [];

  // Overall priority banner
  const p = data.priority || "low";
  parts.push(`<div class="priority-banner ${p}">
    <span aria-hidden="true">${PRIORITY_ICON[p]}</span>
    <span>${PRIORITY_LABEL[p]} — here's what stands out.</span>
  </div>`);

  // Summary
  parts.push(group("Summary", "📝",
    `<p class="summary-text">${escapeHtml(data.summary)}</p>`));

  // Action items
  if (data.actionItems.length) {
    const items = data.actionItems.map((a) => `
      <li class="list-item">
        <span class="dot ${a.priority}" aria-hidden="true"></span>
        <div class="item-body">
          <div class="item-main">${escapeHtml(a.text)}
            <span class="badge ${a.priority}">${escapeHtml(a.priority)}</span>
          </div>
          <div class="item-meta">Owner: ${escapeHtml(a.owner)}</div>
        </div>
      </li>`).join("");
    parts.push(group("Action items", "✅", `<ul class="list">${items}</ul>`));
  } else {
    parts.push(group("Action items", "✅", emptyNote("No tasks were assigned.")));
  }

  // Deadlines
  if (data.deadlines.length) {
    const items = data.deadlines.map((d) => `
      <div class="pill deadline">${escapeHtml(d.what)} —
        <span class="when">${escapeHtml(d.when)}</span></div>`).join("");
    parts.push(group("Deadlines", "⏰", `<div class="pill-list">${items}</div>`));
  } else {
    parts.push(group("Deadlines", "⏰", emptyNote("No deadlines mentioned.")));
  }

  // Mentions
  if (data.mentions.length) {
    const items = data.mentions.map((m) => `
      <div class="pill mention"><strong>${escapeHtml(m.who)}</strong> — ${escapeHtml(m.context)}</div>`).join("");
    parts.push(group("Mentions of you", "👋", `<div class="pill-list">${items}</div>`));
  } else {
    parts.push(group("Mentions of you", "👋", emptyNote("You weren't directly mentioned.")));
  }

  // Decisions
  if (data.decisions.length) {
    const items = data.decisions.map((d) => `<li class="list-item"><div class="item-body"><div class="item-main">${escapeHtml(d)}</div></div></li>`).join("");
    parts.push(group("Decisions made", "🤝", `<ul class="list">${items}</ul>`));
  } else {
    parts.push(group("Decisions made", "🤝", emptyNote("No clear decisions found.")));
  }

  // Key messages
  if (data.keyMessages.length) {
    const items = data.keyMessages.map((k) => `
      <li class="list-item">
        <div class="item-body">
          <div class="item-main">"${escapeHtml(k.text)}"</div>
          <div class="item-meta">— ${escapeHtml(k.from)} · ${escapeHtml(k.why)}</div>
        </div>
      </li>`).join("");
    parts.push(group("Key messages", "💬", `<ul class="list">${items}</ul>`));
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
