// api/analyze.js
// ---------------------------------------------------------------------------
// Serverless function (runs on Vercel, NOT in the browser).
// Its ONLY job: take a chat conversation, send it to Google Gemini with a
// carefully engineered prompt, and return structured JSON the UI can render.
//
// Why a backend at all?  So the GEMINI_API_KEY stays secret on the server and
// is never shipped to the user's browser. That is a real security practice and
// is one of the scored parameters in the hackathon.
// ---------------------------------------------------------------------------

// We ask Gemini to return STRICT JSON matching this shape. Keeping the contract
// in one place makes the whole app predictable and easy to test.
const RESPONSE_SHAPE = `{
  "summary": "3-5 sentence plain-English recap of the whole conversation",
  "priority": "high" | "medium" | "low",   // overall urgency of what was missed
  "actionItems": [
    { "text": "what needs doing", "owner": "who (or 'you'/'unassigned')", "priority": "high"|"medium"|"low" }
  ],
  "decisions": [ "a decision the group made" ],
  "deadlines": [ { "what": "the thing", "when": "the date/time mentioned" } ],
  "mentions": [ { "who": "name the user was pinged by or about", "context": "why it matters" } ],
  "keyMessages": [ { "from": "sender", "text": "the important line", "why": "why it matters" } ]
}`;

function buildPrompt(conversation, userName) {
  const who = userName && userName.trim() ? userName.trim() : "the user";
  return `You are "MissedIt", an assistant that helps someone catch up on a chat they did not read.

Analyze the conversation below from the perspective of ${who}. Figure out what ${who} most needs to know, prioritizing by urgency and relevance. Specifically surface anything that mentions ${who} by name, any deadlines, any tasks assigned, and any decisions made.

Rules:
- Base everything ONLY on the conversation. Never invent facts, names, dates, or tasks. If a field has nothing, return an empty array (or "low" for priority).
- "priority" (top level) reflects how urgent the missed content is overall.
- Keep each string short and concrete.
- Respond with VALID JSON ONLY. No markdown, no backticks, no commentary. Match this exact shape:
${RESPONSE_SHAPE}

CONVERSATION:
"""
${conversation}
"""`;
}

// Pull the first valid JSON object out of the model's text, even if it wrapped
// it in ```json fences or added stray words. Defensive = fewer live-demo fails.
function extractJson(text) {
  if (!text) throw new Error("Empty response from model");
  let t = text.trim();
  // strip ```json ... ``` or ``` ... ``` fences
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(t.slice(start, end + 1));
}

// Guarantee every field exists so the UI never crashes on a missing key.
function normalize(data) {
  const arr = (x) => (Array.isArray(x) ? x : []);
  const prio = (p) => (["high", "medium", "low"].includes(p) ? p : "low");
  return {
    summary: typeof data.summary === "string" ? data.summary : "No summary available.",
    priority: prio(data.priority),
    actionItems: arr(data.actionItems).map((a) => ({
      text: String(a.text || ""),
      owner: String(a.owner || "unassigned"),
      priority: prio(a.priority),
    })),
    decisions: arr(data.decisions).map(String),
    deadlines: arr(data.deadlines).map((d) => ({
      what: String(d.what || ""),
      when: String(d.when || ""),
    })),
    mentions: arr(data.mentions).map((m) => ({
      who: String(m.who || ""),
      context: String(m.context || ""),
    })),
    keyMessages: arr(data.keyMessages).map((k) => ({
      from: String(k.from || ""),
      text: String(k.text || ""),
      why: String(k.why || ""),
    })),
  };
}

export default async function handler(req, res) {
  // ---- CORS + method guard -------------------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // ---- Read + validate input ----------------------------------------------
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const conversation = (body && body.conversation) || "";
  const userName = (body && body.userName) || "";

  if (!conversation || conversation.trim().length < 10) {
    return res.status(400).json({ error: "Please provide a conversation of at least a few words." });
  }
  if (conversation.length > 40000) {
    return res.status(400).json({ error: "Conversation too long. Please trim it to under 40,000 characters." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. (Deployment step: add it in Vercel → Settings → Environment Variables.)",
    });
  }

  // ---- Real Gemini call ----------------------------------------------------
  // Using the "gemini-flash-latest" alias so the app keeps working when Google
  // renames the current Flash model. Falls back to an explicit version if the
  // alias is unavailable on the key.
  const models = ["gemini-flash-latest", "gemini-2.5-flash"];
  const prompt = buildPrompt(conversation, userName);

  let lastErr = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,            // low = consistent, factual, less hallucination
            responseMimeType: "application/json",
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!r.ok) {
        const errText = await r.text();
        lastErr = new Error(`Gemini ${model} returned ${r.status}: ${errText.slice(0, 300)}`);
        // 404 => model name not available on this key; try the next one.
        if (r.status === 404) continue;
        // 429 => rate limited; surface a clean message.
        if (r.status === 429) {
          return res.status(429).json({ error: "Gemini rate limit hit. Wait a few seconds and try again." });
        }
        continue;
      }

      const json = await r.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = extractJson(text);
      const clean = normalize(parsed);
      return res.status(200).json({ ...clean, _model: model });
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  return res.status(502).json({
    error: "Could not get a valid analysis from Gemini.",
    detail: lastErr ? String(lastErr.message || lastErr) : "unknown",
  });
}
