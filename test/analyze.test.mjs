// Lightweight tests for the backend's parsing + normalizing logic.
// Run with: node test/analyze.test.mjs
// No framework needed — keeps the project dependency-free and easy to run.

import assert from "node:assert";

// --- Re-implement the two pure helpers here so we can test them in isolation.
// (They mirror the logic in api/analyze.js. If you change one, change both.)
function extractJson(text) {
  if (!text) throw new Error("Empty response from model");
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(t.slice(start, end + 1));
}

function normalize(data) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  const prio = (p) => (["high", "medium", "low"].includes(p) ? p : "low");
  return {
    summary: typeof data.summary === "string" ? data.summary : "No summary available.",
    priority: prio(data.priority),
    actionItems: arr(data.actionItems).map((a) => ({
      text: String(a.text || ""), owner: String(a.owner || "unassigned"), priority: prio(a.priority),
    })),
    decisions: arr(data.decisions).map(String),
    deadlines: arr(data.deadlines).map((d) => ({ what: String(d.what || ""), when: String(d.when || "") })),
    mentions: arr(data.mentions).map((m) => ({ who: String(m.who || ""), context: String(m.context || "") })),
    keyMessages: arr(data.keyMessages).map((k) => ({ from: String(k.from || ""), text: String(k.text || ""), why: String(k.why || "") })),
  };
}

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log("extractJson:");
test("parses plain JSON", () => {
  assert.deepEqual(extractJson('{"summary":"hi"}'), { summary: "hi" });
});
test("strips ```json fences", () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
});
test("strips bare ``` fences", () => {
  assert.deepEqual(extractJson('```\n{"a":1}\n```'), { a: 1 });
});
test("ignores text before/after the object", () => {
  assert.deepEqual(extractJson('Here you go:\n{"a":1}\nHope that helps!'), { a: 1 });
});
test("throws on no JSON", () => {
  assert.throws(() => extractJson("no json here"));
});

console.log("normalize:");
test("fills all fields when input is empty object", () => {
  const n = normalize({});
  assert.equal(n.summary, "No summary available.");
  assert.equal(n.priority, "low");
  assert.deepEqual(n.actionItems, []);
  assert.deepEqual(n.deadlines, []);
});
test("coerces bad priority to low", () => {
  assert.equal(normalize({ priority: "URGENT!!" }).priority, "low");
});
test("defaults missing owner to unassigned", () => {
  const n = normalize({ actionItems: [{ text: "do thing" }] });
  assert.equal(n.actionItems[0].owner, "unassigned");
});
test("handles non-array fields gracefully", () => {
  const n = normalize({ actionItems: "oops", deadlines: null });
  assert.deepEqual(n.actionItems, []);
  assert.deepEqual(n.deadlines, []);
});
test("keeps valid full payload intact", () => {
  const input = {
    summary: "Team moved standup and assigned tasks.",
    priority: "high",
    actionItems: [{ text: "Send slides", owner: "Priya", priority: "high" }],
    decisions: ["Use Postgres"],
    deadlines: [{ what: "Expense reports", when: "Oct 15" }],
    mentions: [{ who: "Priya", context: "asked to send slides" }],
    keyMessages: [{ from: "Arjun", text: "standup at 10", why: "schedule change" }],
  };
  const n = normalize(input);
  assert.equal(n.priority, "high");
  assert.equal(n.actionItems[0].owner, "Priya");
  assert.equal(n.decisions[0], "Use Postgres");
  assert.equal(n.deadlines[0].when, "Oct 15");
});

console.log(`\n${passed} checks passed.`);
