// KI-Proxy für das Regelheft als Cloudflare Worker (ScherAI, Gemini oder Groq).
// Variablen/Secrets: SCHER_API_KEY (ScherAI, optional SCHER_API_URL / SCHER_MODELS), GEMINI_API_KEY, GROQ_API_KEY, ALLOWED_ORIGIN,
// Reihenfolge/An-Aus der Anbieter, Mitteilung, Funktionsschalter usw. stellst du im Dashboard unter "Einstellungen" ein.
// ADMIN_USER (dein Benutzername = Dashboard-Zugriff), D1-Binding "DB",
// optional DEBUG=1 (zeigt Fehlerdetails in der Meldung), GEMINI_MODELS, GROQ_MODELS (kommagetrennt, überschreibt die Listen unten), RATE_LIMIT
// „Meine Kurse“ (Lernpfad, Karteikarten, Podcast, Datei-Upload) braucht zusätzlich GEMINI_API_KEY und das Feature „practice“ im Dashboard.
const SYSTEM = `Du bist die Aufgabenhilfe im „Regelheft {FACH}“ eines Schülers. Du siehst ein Foto und/oder einen Text mit einer {AUFGABE}.
Deine Aufgabe: Erkenne, welche {THEMEN} die Aufgabe braucht ({BEISPIELE}), und wähle dazu die passenden Regeln aus der folgenden Liste. Verwende NUR IDs aus dieser Liste. Die Liste enthält zu jeder Regel Titel, Kategorie und einen kurzen Textanfang als Stichwort-Hilfe.
Löse die Aufgabe NICHT vollständig; nenne nur kurz den Ansatz und warum die Regeln helfen.

Antworte ausschließlich mit JSON in genau einer dieser Formen:
{"type":"answer","title":"Chat-Titel","explanation":"1–3 kurze Sätze auf Deutsch","rule_ids":["r1","r2"]}
{"type":"question","title":"Chat-Titel","question":"eine konkrete Rückfrage auf Deutsch"}

Regeln:
- title: sehr kurzer Titel für diesen Chat (2–4 Wörter, Deutsch, ohne Anführungszeichen), der das Aufgabenthema nennt, z. B. {TITEL}.
- rule_ids: höchstens 6, wichtigste zuerst. Wähle immer die 1–4 am ehesten passenden Regeln, auch wenn die Passung nicht perfekt ist ({TEILSCHRITTE}). Eine leere Liste ist nur erlaubt, wenn das Thema gar nicht zur {FACH} der Liste gehört.
- Beachte auch Stichwörter, die ausdrücklich in der Aufgabenstellung stehen.
- Stelle eine Rückfrage nur, wenn du ohne Antwort nicht sinnvoll helfen kannst (Bild unleserbar, Aufgabe mehrdeutig, Teilaufgabe unklar). Genau eine Frage, kurz und präzise.
- Hat der Schüler schon auf eine Rückfrage geantwortet, antworte jetzt mit type "answer".

Regelliste (id | Titel | Kategorie | Textanfang):
`;
// Fachabhängige Teile der Anweisung (die Webseite schickt "fach": "mathe" oder "physik")
const FAECHER = {
  mathe: { FACH: "Mathematik", AUFGABE: "Mathe-Aufgabe", THEMEN: "mathematischen Themen und Rechenschritte",
    BEISPIELE: "z. B. Gleichungen umformen, quadratische Gleichung, Potenzgesetze, Satz des Pythagoras, Prozentrechnung",
    TITEL: "Potenzfunktionen zeichnen", TEILSCHRITTE: "Teilschritte zählen: eine Aufgabe zu Schnittpunkten braucht z. B. auch Gleichungen lösen" },
  physik: { FACH: "Physik", AUFGABE: "Physik-Aufgabe", THEMEN: "physikalischen Themen, Formeln und Größen",
    BEISPIELE: "z. B. Geschwindigkeit, Newtonsche Gesetze, Energieerhaltung, Ohmsches Gesetz, Dichte, Brechung, Einheiten umrechnen",
    TITEL: "Stromstärke berechnen", TEILSCHRITTE: "Teilschritte zählen: eine Aufgabe zur Leistung braucht z. B. auch Einheiten umrechnen oder das Ohmsche Gesetz" },
};
const systemFor = fach => { const f = FAECHER[fach] || FAECHER.mathe; return SYSTEM.replace(/\{([A-Z]+)\}/g, (m, k) => f[k] ?? m); };
const hits = new Map();

// Modelle werden der Reihe nach probiert; schlägt eines fehl (z. B. Limit erreicht), kommt das nächste.
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemma-4-26b-a4b-it",
  "gemma-4-31b-it",
  "gemini-3.1-flash-live-preview",
];
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "gemma2-9b-it",
];
// Diese Groq-Modelle verstehen nur Text. Bei Fotos nutzt der Worker stattdessen dieses Bild-Modell:
const GROQ_VISION_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct"];

// entfernt versehentliche Leerzeichen, Zeilenumbrüche und Anführungszeichen um den Key
const clean = k => String(k || "").trim().replace(/^["']|["']$/g, "").trim();

async function callGemini(env, model, system, msgs, image) {
  const gemma = /^gemma/i.test(model); // Gemma kennt keine systemInstruction und keinen JSON-Modus
  const contents = msgs.map((m, i) => {
    const parts = [{ text: gemma && i === 0 ? system + "\n\n" + m.text : m.text }];
    if (i === 0 && image) {
      const [, mime, data] = image.match(/^data:(image\/[\w.+-]+);base64,(.+)$/s);
      parts.push({ inline_data: { mime_type: mime, data } });
    }
    return { role: m.role === "user" ? "user" : "model", parts };
  });
  const body = { contents, generationConfig: { temperature: 0.2, maxOutputTokens: 1024 } };
  if (!gemma) { body.systemInstruction = { parts: [{ text: system }] }; body.generationConfig.responseMimeType = "application/json"; }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": clean(env.GEMINI_API_KEY), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(model + " " + r.status + " " + (await r.text()).slice(0, 140).replace(/\s+/g, " "));
  const d = await r.json();
  const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!t) throw new Error(model + " leer");
  return { text: t, model: d.modelVersion || model };
}

async function callGroq(env, model, system, msgs, image) {
  const out = [{ role: "system", content: system }];
  msgs.forEach((m, i) => {
    if (i === 0 && image && m.role === "user")
      out.push({ role: "user", content: [{ type: "text", text: m.text }, { type: "image_url", image_url: { url: image } }] });
    else out.push({ role: m.role, content: m.text });
  });
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + clean(env.GROQ_API_KEY), "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: out, temperature: 0.2, max_tokens: 1024, response_format: { type: "json_object" } }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(model + " " + r.status + " " + (await r.text()).slice(0, 140).replace(/\s+/g, " "));
  const d = await r.json();
  const t = d.choices?.[0]?.message?.content;
  if (!t) throw new Error(model + " leer");
  return { text: t, model: d.model || model };
}

// Probiert erst den Anbieter aus AI_PROVIDER (alle Modelle der Reihe nach), dann den anderen, falls dessen Key gesetzt ist.
function parseAnswer(raw) {
  try { const m = raw.match(/\{[\s\S]*\}/); const j = m ? JSON.parse(m[0]) : null;
    return j && (j.type === "question" || j.type === "answer" || Array.isArray(j.rule_ids)) ? j : null; } catch { return null; }
}

async function generate(env, system, msgs, image, ai) {
  const list = (v, def) => (v ? v.split(",").map(x => x.trim()).filter(Boolean) : def);
  ai = ai || DEFAULT_SETTINGS.ai;
  const keyOf = { scher: "SCHER_API_KEY", gemini: "GEMINI_API_KEY", groq: "GROQ_API_KEY" };
  const order = ai.order.filter(p => ai.enabled[p] !== false);
  const errs = [];
  for (const p of order) {
    if (!env[keyOf[p]]) continue;
    const models = p === "groq"
      ? (image ? list(env.GROQ_VISION_MODELS, GROQ_VISION_MODELS) : list(env.GROQ_MODELS, GROQ_MODELS))
      : p === "scher" ? list(env.SCHER_MODELS, SCHER_MODELS)
      : list(env.GEMINI_MODELS, GEMINI_MODELS);
    for (const m of models) {
      try {
        const res = await (p === "groq" ? callGroq : p === "scher" ? callScher : callGemini)(env, m, system, msgs, image);
        const j = parseAnswer(res.text);
        if (!j) throw new Error(m + " ungültige Antwort");
        // model = das Modell, das laut Antwort des Anbieters wirklich geantwortet hat
        return { j, model: res.model, provider: p, skipped: errs.length, failed: errs };
      } catch (e) { errs.push(e.message); }
    }
  }
  throw new Error(errs.length ? errs.join(" | ") : "Kein aktiver Anbieter mit API-Key (SCHER_API_KEY / GEMINI_API_KEY / GROQ_API_KEY)");
}


// ---- ScherAI (OpenAI-kompatibel). Key NUR als Secret SCHER_API_KEY im Worker, nie im Frontend. ----
const SCHER_MODELS = ["scherai-1"];
async function callScher(env, model, system, msgs, image) {
  const out = [{ role: "system", content: system }];
  msgs.forEach((m, i) => {
    if (i === 0 && image && m.role === "user")
      out.push({ role: "user", content: [{ type: "text", text: m.text }, { type: "image_url", image_url: { url: image } }] });
    else out.push({ role: m.role, content: m.text });
  });
  const r = await fetch(env.SCHER_API_URL || "https://scherai-scheraibackend.hf.space/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + clean(env.SCHER_API_KEY), "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: out, temperature: 0.2, max_tokens: 1024 }),
    signal: AbortSignal.timeout(40000),   // Hugging-Face-Spaces brauchen nach Ruhephasen manchmal etwas zum Aufwachen
  });
  if (!r.ok) throw new Error(model + " " + r.status + " " + (await r.text()).slice(0, 140).replace(/\s+/g, " "));
  const d = await r.json();
  const t = d.choices?.[0]?.message?.content;
  if (!t) throw new Error(model + " leer");
  return { text: t, model: d.model || model };
}

// ---- Einstellungen, die der Admin im Dashboard ändert (in der Datenbank, Tabelle settings) ----
const FEATURES = ["ai", "registration", "favorites", "recent", "notes", "practice", "share", "darkmode", "stats"];
const PROVIDERS = ["scher", "gemini", "groq"];
const DEFAULT_SETTINGS = {
  maintenance: { enabled: false, message: "Das Regelheft wird gerade gewartet. Die KI-Aufgabenhilfe ist kurz nicht verfügbar." },
  announcement: { enabled: false, text: "", type: "info", link: "", linkText: "" },
  news: null,   // null = Standardtext aus config.js (NEWS) verwenden
  features: Object.fromEntries(FEATURES.map(f => [f, true])),
  ai: { order: ["scher", "gemini", "groq"], enabled: { scher: true, gemini: true, groq: true }, rateLimit: 20, extra: "" },
  social: { discord: null, instagram: null },   // null = Standard aus config.js
  billing: { enabled: false, proFeatures: { practice: true, notes: true }, freeAiPerDay: 3, plusAiPerDay: 15, plusFeatures: { practice: false, notes: true }, yearly: true, kleinunternehmer: true, promo: false, note: "" },
  auth: { requireEmail: true, requireVerified: true, google: true },
  staff: [],   // Benutzernamen mit Zugriff aufs Dashboard (Team); nur der Besitzer (ADMIN_USER) kann sie ändern
};
const str = (v, n) => String(v == null ? "" : v).slice(0, n);
const okUrl = v => { v = String(v || "").trim(); return !v || /^https:\/\/[^\s]+$/.test(v) || /^[a-z0-9_-]+\.html(\?[^\s#]*)?(#[\w-]+)?$/i.test(v) ? v.slice(0, 300) : ""; };
function cleanSettings(x) {
  x = x && typeof x === "object" ? x : {};
  const d = DEFAULT_SETTINGS, o = JSON.parse(JSON.stringify(d));
  const m = x.maintenance || {};
  o.maintenance = { enabled: m.enabled === true, message: str(m.message || d.maintenance.message, 300) };
  const a = x.announcement || {};
  o.announcement = { enabled: a.enabled === true, text: str(a.text, 400), type: ["info", "warn", "success"].includes(a.type) ? a.type : "info", link: okUrl(a.link), linkText: str(a.linkText, 40) };
  if (x.news && typeof x.news === "object") {
    const n = x.news;
    o.news = { enabled: n.enabled !== false, date: str(n.date, 30), title: str(n.title, 80),
      items: (Array.isArray(n.items) ? n.items : []).map(i => str(i, 300).trim()).filter(Boolean).slice(0, 8) };
  }
  const f = x.features || {};
  for (const k of FEATURES) o.features[k] = f[k] !== false;
  const ai = x.ai || {};
  const order = (Array.isArray(ai.order) ? ai.order : []).filter((p, i, arr) => PROVIDERS.includes(p) && arr.indexOf(p) === i);
  PROVIDERS.forEach(p => { if (!order.includes(p)) order.push(p); });
  o.ai = { order, enabled: Object.fromEntries(PROVIDERS.map(p => [p, !(ai.enabled && ai.enabled[p] === false)])),
    rateLimit: Math.min(200, Math.max(1, parseInt(ai.rateLimit, 10) || 20)), extra: str(ai.extra, 600) };
  const b = x.billing || {}, pf = b.proFeatures || {};
  const fpd = Number.isFinite(+b.freeAiPerDay) ? Math.min(100, Math.max(0, Math.floor(+b.freeAiPerDay))) : 3;
  const plf = b.plusFeatures || {}, pad = Number.isFinite(+b.plusAiPerDay) && b.plusAiPerDay !== "" && b.plusAiPerDay != null ? Math.min(500, Math.max(0, Math.floor(+b.plusAiPerDay))) : 15;
  o.billing = { enabled: b.enabled === true, proFeatures: { practice: pf.practice !== false, notes: pf.notes !== false }, freeAiPerDay: fpd, plusAiPerDay: pad, plusFeatures: { practice: plf.practice === true, notes: plf.notes !== false },
    yearly: b.yearly !== false, kleinunternehmer: b.kleinunternehmer !== false, promo: b.promo === true, note: str(b.note, 300) };
  const au = x.auth || {};
  o.auth = { requireEmail: au.requireEmail !== false, requireVerified: au.requireVerified !== false, google: au.google !== false };
  o.staff = (Array.isArray(x.staff) ? x.staff : []).map(n => String(n || "").trim()).filter((n, i, a) => /^[A-Za-z0-9_.-]{3,20}$/.test(n) && a.findIndex(m => m.toLowerCase() === n.toLowerCase()) === i).slice(0, 20);
  const so = x.social || {};
  const su = v => { v = String(v || "").trim(); return /^https:\/\/[^\s]+$/.test(v) ? v.slice(0, 200) : (v === "" ? "" : null); };
  o.social = { discord: so.discord == null ? null : su(so.discord), instagram: so.instagram == null ? null : su(so.instagram) };
  return o;
}
let settingsCache = { t: 0, v: null };
async function getSettings(env) {
  if (settingsCache.v && Date.now() - settingsCache.t < 10000) return settingsCache.v;
  let saved = {};
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT NOT NULL)").run();
    const row = await env.DB.prepare("SELECT v FROM settings WHERE k = 'site'").first();
    if (row) saved = JSON.parse(row.v);
  } catch (e) {}
  settingsCache = { t: Date.now(), v: cleanSettings(saved) };
  return settingsCache.v;
}

async function saveSettings(env, obj) {
  const c = cleanSettings(obj);
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT NOT NULL)").run();
  await env.DB.prepare("INSERT INTO settings(k, v) VALUES('site', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(c)).run();
  settingsCache = { t: Date.now(), v: c };
  return c;
}

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const rand = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
async function hashPw(pw, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100000 }, k, 256));
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
function limited(key, max) {
  const now = Date.now(), q = (hits.get(key) || []).filter(t => now - t < 600000);
  if (q.length >= max) return true;
  q.push(now); hits.set(key, q); return false;
}
const isAdmin = (env, name) => !!env.ADMIN_USER && String(name).toLowerCase() === String(env.ADMIN_USER).trim().toLowerCase();

// Rollen: owner = ADMIN_USER (alles), admin = owner oder Team-Mitglied (Dashboard ohne Einstellungen)
async function roleOf(env, name) {
  const owner = isAdmin(env, name);
  if (owner) return { admin: true, owner: true };
  const cfg = await getSettings(env);
  return { admin: (cfg.staff || []).some(n => n.toLowerCase() === String(name).toLowerCase()), owner: false };
}
async function newSession(env, uid) {
  const token = rand(32), now = Date.now();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .bind(await sha256(token), uid, now, now + 30 * 864e5).run();
  return token;
}
async function getUser(req, env) {
  const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!t) return null;
  const row = await env.DB.prepare("SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?")
    .bind(await sha256(t), Date.now()).first();
  return row ? { id: row.id, username: row.username, ...(await roleOf(env, row.username)) } : null;
}

async function handleAI(env, user, body, json, cfg) {
  let { messages: msgs, image, rules, chatId, thumb, fach } = body;
  if (limited("ai" + user.id, +(cfg.ai.rateLimit || env.RATE_LIMIT || 20))) return json({ error: "Zu viele Anfragen. Bitte warte ein paar Minuten." }, 429);
  if (!Array.isArray(msgs) || !msgs.length || msgs.length > 12 || !Array.isArray(rules) || rules.length > 500) return json({ error: "Ungültige Anfrage." }, 400);
  msgs = msgs.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", text: String(m.text || "").slice(0, 1500) }));
  if (msgs[0].role !== "user") return json({ error: "Ungültige Anfrage." }, 400);
  if (image != null && !(typeof image === "string" && /^data:image\/[\w.+-]+;base64,/.test(image) && image.length < 5e6)) return json({ error: "Ungültiges Bild." }, 400);

  // E-Mail bestätigt? Tageslimit für Nutzer ohne Pro?
  let quota = null, cid = typeof chatId === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(chatId) ? chatId : null;
  if (!user.admin) {
    const info = await userInfo(env, user);
    if (cfg.auth.requireEmail && cfg.auth.requireVerified && mailReady(env) && !info.emailVerified) return json({ error: "Bitte bestätige zuerst deine E-Mail-Adresse.", code: "verify_required" }, 403);
    if (billingOn(env, cfg) && !info.pro) {
      const day = berlinDay(), limit = info.plus ? cfg.billing.plusAiPerDay : cfg.billing.freeAiPerDay;
      const used = (await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_chats WHERE user_id = ? AND day = ?").bind(user.id, day).first()).n;
      const known = cid ? await env.DB.prepare("SELECT 1 AS x FROM ai_chats WHERE user_id = ? AND day = ? AND cid = ?").bind(user.id, day, cid).first() : null;
      if (!known && used >= limit) return json({ error: limit > 0 ? `Dein Tageslimit von ${limit} KI-Chats ist erreicht. Morgen geht es weiter, oder hol dir ${info.plus || !plusReady(env) ? "Pro für unbegrenzte Chats." : "Plus oder Pro für mehr Chats."}` : `Die KI-Aufgabenhilfe gibt es mit einem Abo (${plusReady(env) ? "Plus oder Pro" : "Pro"}).`, code: "limit", quota: { used, limit } }, 429);
      quota = { used, limit, known: !!known, day };
    }
  }
  const idMap = new Map(rules.map(r => [String(r.id).trim().toLowerCase(), String(r.id)]));
  const sys1 = systemFor(fach);
  const sys0 = cfg.ai.extra ? sys1.replace("\nRegelliste (id", "\nZusätzliche Hinweise des Betreibers:\n" + cfg.ai.extra + "\n\nRegelliste (id") : sys1;
  const system = sys0 + rules.map(r => `${String(r.id).slice(0, 12)} | ${String(r.title).slice(0, 90)} | ${String(r.category).slice(0, 60)} | ${String(r.hint || "").slice(0, 100)}`).join("\n");
  let out;
  try { out = await generate(env, system, msgs, image, cfg.ai); }
  catch (e) { return json({ error: "Die KI ist gerade nicht erreichbar. Versuch es später nochmal." + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, 502); }

  const { j, model, provider, skipped } = out;
  const title = String(j.title || "").trim().slice(0, 40);
  let res, saveText;
  if (j.type === "question" && String(j.question || "").trim()) {
    res = { type: "question", question: String(j.question).trim().slice(0, 400) }; saveText = res.question;
  } else {
    res = { type: "answer", explanation: String(j.explanation || "").slice(0, 600),
      rule_ids: [...new Set((Array.isArray(j.rule_ids) ? j.rule_ids : []).map(i => idMap.get(String(i).trim().toLowerCase())).filter(Boolean))].slice(0, 6) };
    saveText = res.explanation;
  }
  // Chat für das Dashboard mitspeichern
  if (typeof chatId === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(chatId)) {
    try {
      const now = Date.now(), id = user.id + "-" + chatId;
      const th = typeof thumb === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(thumb) && thumb.length < 80000 ? thumb : null;
      const full = [...msgs, { role: "assistant", text: saveText }];
      await env.DB.prepare(`INSERT INTO chats(id,user_id,title,thumb,messages,rule_ids,model,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET title=COALESCE(NULLIF(excluded.title,''),chats.title), thumb=COALESCE(excluded.thumb,chats.thumb),
        messages=excluded.messages, rule_ids=excluded.rule_ids, model=excluded.model, updated_at=excluded.updated_at`)
        .bind(id, user.id, title, th, JSON.stringify(full), JSON.stringify(res.rule_ids || []), model, now, now).run();
    } catch (e) {}
  }
  let q = null;
  if (quota) {   // erst nach erfolgreicher Antwort zählen
    if (!quota.known) { try { await env.DB.prepare("INSERT OR IGNORE INTO ai_chats(user_id, day, cid) VALUES(?,?,?)").bind(user.id, quota.day, cid || ("x" + rand(6))).run(); } catch (e) {} quota.used += 1; }
    if (Math.random() < 0.05) { try { await env.DB.prepare("DELETE FROM ai_chats WHERE day < ?").bind(new Date(Date.now() - 3 * 864e5).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" })).run(); } catch (e) {} }
    q = { used: quota.used, limit: quota.limit };
  }
  return json({ ...res, title, model, provider, skipped, quota: q });
}

// ============================================================
// MEINE KURSE (Pro/Plus): aus einem Regelheft-Thema oder eigenen Unterlagen (PDF, Fotos, GoodNotes)
// macht die KI einen Kurs: Zusammenfassung, Podcast (Lena & Max), Karteikarten und einen Lernpfad mit Übungen.
// Braucht GEMINI_API_KEY (Text, Dateien und Stimmen kommen von Gemini).
//   POST /api/upload-url { name, size }                    → { uploadUrl, mimeType }  (der Browser lädt die Datei direkt zu Google)
//   POST /api/kurs { topic?, fach, rules?, files?, notes? } → { title, emoji, summary, podcast, flashcards, units }
//   POST /api/tts  { lines:[{speaker,text}], calm }         → Gemini-Antwort mit Audio (unverändert durchgereicht)
// /api/kurs wird „langsam“ gestreamt (Leerzeichen als Lebenszeichen, dann JSON), weil die KI dafür bis zu 2 Minuten braucht.
// ============================================================
// Ist das Tageskontingent eines Modells aufgebraucht, kommt das nächste dran.
const KURS_MODELS = ["gemini-3.6-flash", "gemini-3.8-flash", "gemini-3-flash-preview", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
const KURS_MIME = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  heic: "image/heic", heif: "image/heif", txt: "text/plain", md: "text/plain", csv: "text/plain" };
const kursQuestion = { type: "object", additionalProperties: false, required: ["type", "question", "options", "correctIndex", "explanation"],
  properties: { type: { type: "string", enum: ["multiple_choice", "true_false", "fill_blank"] }, question: { type: "string" },
    options: { type: "array", items: { type: "string" } }, correctIndex: { type: "integer" }, explanation: { type: "string" } } };
const KURS_MAX_FILES = 5;   // Pro: so viele eigene Lerndateien pro Kurs
const KURS_SCHEMA = {
  type: "object", additionalProperties: false, required: ["title", "emoji", "summary", "rules", "podcast", "flashcards", "units"],
  properties: {
    title: { type: "string" }, emoji: { type: "string" }, summary: { type: "string" },
    rules: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "text", "example"],
      properties: { title: { type: "string" }, text: { type: "string" }, example: { type: "string" } } } },
    podcast: { type: "object", additionalProperties: false, required: ["title", "lines"], properties: { title: { type: "string" },
      lines: { type: "array", items: { type: "object", additionalProperties: false, required: ["speaker", "text"],
        properties: { speaker: { type: "string", enum: ["Lena", "Max"] }, text: { type: "string" } } } } } },
    flashcards: { type: "array", items: { type: "object", additionalProperties: false, required: ["front", "back"],
      properties: { front: { type: "string" }, back: { type: "string" } } } },
    units: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "lessons"], properties: { title: { type: "string" },
      lessons: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "questions"],
        properties: { title: { type: "string" }, questions: { type: "array", items: kursQuestion } } } } } } },
  },
};
const kursSystem = fachName => `Du bist ein Lerncoach für Schülerinnen und Schüler (Fach: ${fachName}). Du bekommst Lernunterlagen (PDFs, Fotos von Mitschriften, Notizen) und/oder Regeln aus ihrem Regelheft. Lies alles genau, auch Handschrift auf Bildern. Erfinde nichts, was nicht in den Unterlagen steht oder direkt daraus folgt.
Erstelle auf Deutsch:
- title: kurzer Name des Themas; emoji: ein passendes Emoji; summary: Zusammenfassung in 4–8 Sätzen.
- rules: die 4–12 wichtigsten Regeln, Formeln oder Merksätze wie in einem Regelheft. title = kurzer Name, text = die Regel in 1–3 Sätzen (Formeln erlaubt, z. B. a² + b² = c²), example = ein kurzes Beispiel (oder leer).
- podcast: ein lockeres Gespräch zwischen Lena (erklärt) und Max (fragt nach, bringt Alltagsbeispiele), 20–36 Wortbeiträge, das die wichtigsten Inhalte verständlich erklärt. Gesprochene Sprache: keine Aufzählungszeichen, keine Formelzeichen – schreib Formeln so, wie man sie vorliest (z. B. „a Quadrat plus b Quadrat gleich c Quadrat“).
- flashcards: 12–30 Karteikarten. front = kurze Frage oder Aufgabe, back = knappe, richtige Antwort (hier dürfen Formeln wie a² + b² = c² stehen).
- units: ein Lernpfad wie in einer Sprachlern-App: 2–4 Einheiten, von leicht nach schwer, je 2–3 Lektionen mit je 5–7 Fragen.
  Fragetypen: "multiple_choice" (3–4 Optionen), "true_false" (Optionen genau ["Wahr", "Falsch"]), "fill_blank" (Satz mit "___" als Lücke, 3–4 Wörter als Optionen).
  correctIndex = Index der richtigen Option (0-basiert); mische die Position der richtigen Antwort. explanation: ein Satz, warum.`;
// Zusätzliche Karteikarten für einen bestehenden Kurs (Meine Kurse → Karten → „Mit KI erstellen“)
const KARTEN_SCHEMA = { type: "object", additionalProperties: false, required: ["flashcards"], properties: {
  flashcards: { type: "array", items: { type: "object", additionalProperties: false, required: ["front", "back", "rule"],
    properties: { front: { type: "string" }, back: { type: "string" }, rule: { type: "string" } } } } } };
const kartenSystem = (fachName, n, art) => `Du schreibst Karteikarten für Schülerinnen und Schüler (Fach: ${fachName}). Du bekommst einen Kurs: Titel, Zusammenfassung, Regeln und die schon vorhandenen Karten.
Erstelle genau ${n} NEUE Karteikarten auf Deutsch, die es so noch nicht gibt (keine Wiederholung, keine bloße Umformulierung).
${art === "aufgaben" ? "Art: Übungsaufgaben mit konkreten Zahlen oder Beispielen; back = Ergebnis mit kurzem Rechenweg." : art === "begriffe" ? "Art: Begriffe und Definitionen; front = Begriff oder Frage danach, back = kurze, genaue Erklärung." : "Art: gemischt – Verständnisfragen, Begriffe und kleine Übungsaufgaben mit konkreten Zahlen."}
front = kurze Frage oder Aufgabe, back = knappe, richtige Antwort (Formeln wie a² + b² = c² sind erlaubt). Bleib beim Stoff des Kurses; erfinde keine Inhalte, die nicht dazu passen.
rule = der Name der passenden Regel aus der Liste, genau so geschrieben, oder "" wenn keine passt.`;
const tooBusy = s => [0, 400, 404, 429, 500, 502, 503, 504, 524].includes(s);
const kursErr = (msg, detail) => { const e = new Error(detail || msg); e.userMsg = msg; return e; };

// Upload bei Google starten; die Antwort enthält eine Adresse, an die der Browser die Datei direkt schickt
async function startUpload(env, name, size, origin) {
  name = str(name || "datei", 200);
  const ext = (name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || "", mimeType = KURS_MIME[ext];
  if (!mimeType) return { error: `„${name}“ wird nicht unterstützt. Erlaubt sind PDF, Fotos (JPG, PNG, HEIC), TXT und GoodNotes.` };
  if (!(size > 0)) return { error: `„${name}“ ist leer.` };
  if (ext === "pdf" && size > 50 * 1048576) return { error: `„${name}“ ist größer als 50 MB. Teile die PDF bitte auf.` };
  if (size > 200 * 1048576) return { error: `„${name}“ ist größer als 200 MB.` };
  const r = await fetch("https://generativelanguage.googleapis.com/upload/v1beta/files", {
    method: "POST",
    headers: { "x-goog-api-key": clean(env.GEMINI_API_KEY), "X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(size), "X-Goog-Upload-Header-Content-Type": mimeType, "Content-Type": "application/json",
      Origin: origin },   // damit Google dem Browser den Upload erlaubt (CORS)
    body: JSON.stringify({ file: { display_name: name } }), signal: AbortSignal.timeout(20000),
  }).catch(() => null);
  const uploadUrl = r && r.headers.get("x-goog-upload-url");
  return r && r.ok && uploadUrl ? { uploadUrl, mimeType } : { error: "Der Upload konnte nicht gestartet werden. Bitte nochmal versuchen.", status: 502 };
}

// Warten, bis Google die hochgeladenen Dateien verarbeitet hat (große PDFs brauchen etwas)
async function waitFiles(env, files) {
  const end = Date.now() + 4 * 60000, out = [];
  for (const f of files) {
    for (;;) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${f.name}`, { headers: { "x-goog-api-key": clean(env.GEMINI_API_KEY) }, signal: AbortSignal.timeout(15000) }).catch(() => null);
      const j = r && r.ok ? await r.json() : null;
      if (j && j.state === "ACTIVE") { out.push({ label: f.label, uri: j.uri, mimeType: j.mimeType || f.mimeType }); break; }
      if ((j && j.state === "FAILED") || (r && r.status === 404)) throw kursErr(`„${f.label}“ konnte nicht gelesen werden.`);
      if (Date.now() > end) throw kursErr("Die Verarbeitung der Dateien dauert zu lange. Bitte nochmal versuchen.");
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  return out;
}
const dropFiles = (env, files) => Promise.allSettled(files.map(f => fetch(`https://generativelanguage.googleapis.com/v1beta/${f.name}`,
  { method: "DELETE", headers: { "x-goog-api-key": clean(env.GEMINI_API_KEY) } })));

async function geminiKurs(env, system, parts, opts = {}) {
  const errs = [];
  for (const model of KURS_MODELS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": clean(env.GEMINI_API_KEY), "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json", responseJsonSchema: opts.schema || KURS_SCHEMA, maxOutputTokens: opts.tokens || 32000,
          thinkingConfig: model.startsWith("gemini-2") ? { thinkingBudget: 1024 } : { thinkingLevel: "LOW" },
        },
      }),
      signal: AbortSignal.timeout(opts.timeout || 150000),   // hängt ein Modell, kommt das nächste
    }).catch(e => ({ ok: false, status: 0 }));
    if (!r.ok) { errs.push(model + " " + r.status); if (tooBusy(r.status)) continue; break; }
    try {
      const d = await r.json(), j = JSON.parse(d.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "");
      if (opts.check ? opts.check(j) : (Array.isArray(j.units) && j.units.length && Array.isArray(j.flashcards) && j.podcast)) return j;
      errs.push(model + " leer");
    } catch (e) { errs.push(model + " ungültig"); }
  }
  throw kursErr(errs.some(e => / 429$/.test(e)) ? "Das KI-Tageskontingent ist aufgebraucht. Bitte morgen nochmal versuchen." : "Die KI ist gerade nicht erreichbar. Versuch es später nochmal.", errs.join(" | "));
}

// Antwort der KI säubern und begrenzen
function cleanKurs(j, fallbackTitle) {
  const q = x => ({ type: ["multiple_choice", "true_false", "fill_blank"].includes(x.type) ? x.type : "multiple_choice", question: str(x.question, 400),
    options: (Array.isArray(x.options) ? x.options : []).slice(0, 5).map(o => str(o, 160)), correctIndex: Math.max(0, parseInt(x.correctIndex, 10) || 0), explanation: str(x.explanation, 400) });
  return {
    title: str(j.title, 100) || fallbackTitle, emoji: str(j.emoji, 8) || "📘", summary: str(j.summary, 3000),
    podcast: { title: str(j.podcast.title, 120) || str(j.title, 100), lines: (j.podcast.lines || []).filter(l => ["Lena", "Max"].includes(l.speaker) && l.text).slice(0, 60).map(l => ({ speaker: l.speaker, text: str(l.text, 800) })) },
    rules: (Array.isArray(j.rules) ? j.rules : []).filter(r => r && r.title && r.text).slice(0, 20).map(r => ({ title: str(r.title, 120), text: str(r.text, 800), example: str(r.example, 400) })),
    flashcards: (j.flashcards || []).filter(c => c.front && c.back).slice(0, 40).map(c => ({ front: str(c.front, 300), back: str(c.back, 600) })),
    units: (j.units || []).slice(0, 6).map(u => ({ title: str(u.title, 100), lessons: (u.lessons || []).slice(0, 5).map(l => ({ title: str(l.title, 100),
      questions: (l.questions || []).map(q).filter(x => x.question && x.options.length >= 2 && x.correctIndex < x.options.length).slice(0, 10) })).filter(l => l.questions.length) })).filter(u => u.lessons.length),
  };
}

// Stimmen: normal = warm und locker, ruhig = sanft und leise (zum Einschlafen)
const TTS_VOICES = { normal: { Lena: "Sulafat", Max: "Achird" }, calm: { Lena: "Vindemiatrix", Max: "Algieba" } };
function ttsBody(model, lines, calm) {
  const speechConfig = { multiSpeakerVoiceConfig: { speakerVoiceConfigs: Object.entries(calm ? TTS_VOICES.calm : TTS_VOICES.normal)
    .map(([speaker, voiceName]) => ({ speaker, voiceConfig: { prebuiltVoiceConfig: { voiceName } } })) } };
  const generationConfig = { responseModalities: ["AUDIO"], speechConfig };
  if (model.includes("2.5")) {   // 2.5: Regieanweisung als Text vor dem Gespräch
    const style = calm
      ? "Lies das folgende Gespräch zwischen Lena und Max sehr leise, langsam und beruhigend vor, wie in einem Podcast zum Einschlafen. Mach kleine Pausen zwischen den Sätzen."
      : "Lies das folgende Gespräch zwischen Lena und Max natürlich, warm und locker vor, wie in einem echten Podcast.";
    return { contents: [{ role: "user", parts: [{ text: style + "\n\n" + lines.map(l => l.speaker + ": " + l.text).join("\n") }] }], generationConfig };
  }
  const tag = calm ? "[sehr leise, langsam und beruhigend] " : "";   // 3.8: ein Teil pro Beitrag, Stil als Tag
  return { contents: [{ role: "user", parts: lines.map(l => ({ text: tag + l.text, speechMetadata: { speaker: l.speaker } })) }], generationConfig };
}
// Die Gemini-Antwort wird unverändert an den Browser durchgereicht (der wandelt das Audio selbst um).
// So braucht der Worker kaum Rechenzeit – sonst bricht Cloudflare die Anfrage wegen des CPU-Limits ab.
async function geminiSpeak(env, lines, calm) {
  const models = calm ? ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts"] : ["gemini-3.8-flash-tts", "gemini-2.5-flash-preview-tts"];
  const errs = [];
  for (const model of models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": clean(env.GEMINI_API_KEY), "Content-Type": "application/json" },
      body: JSON.stringify(ttsBody(model, lines, calm)), signal: AbortSignal.timeout(150000),
    }).catch(e => ({ ok: false, status: 0 }));
    if (r.ok) return r;
    errs.push(model + " " + r.status);
  }
  const err = new Error(errs.join(" | "));
  err.status = errs.some(e => / 429$/.test(e)) ? 429 : 502;
  err.userMsg = err.status === 429 ? "Das Tageskontingent für die KI-Stimmen ist aufgebraucht. Bitte später nochmal versuchen." : "Die Aufnahme hat nicht geklappt. Bitte nochmal versuchen.";
  throw err;
}

// Antwort offen halten (alle 10 s ein Leerzeichen), am Ende das JSON. Fehler kommen als {error} im JSON.
function slowJson(headers, task, env) {
  const { readable, writable } = new TransformStream(), w = writable.getWriter(), e = new TextEncoder();
  const hb = setInterval(() => w.write(e.encode(" ")).catch(() => {}), 10000);
  task().catch(err => ({ error: (err.userMsg || "Etwas ist schiefgelaufen.") + (env.DEBUG === "1" ? " [" + err.message + "]" : "") }))
    .then(async res => { clearInterval(hb); await w.write(e.encode(JSON.stringify(res))).catch(() => {}); await w.close().catch(() => {}); });
  return new Response(readable, { headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

// ============================================================
// BEZAHLUNG (Stripe), E-MAIL-BESTÄTIGUNG, GOOGLE-LOGIN
// Secrets/Variablen im Worker:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRO_PRICE_MONTH (optional STRIPE_PRO_PRICE_YEAR; die alten Namen STRIPE_PRICE_MONTH/_YEAR gehen weiterhin)
//   Plus-Tarif (optional, günstiger, mit Limit): STRIPE_PLUS_PRICE_MONTH und/oder STRIPE_PLUS_PRICE_YEAR
//   SITE_URL (z. B. https://regelheft.onrender.com)
//   RESEND_API_KEY oder BREVO_API_KEY + MAIL_FROM ("Regelheft <noreply@deine-domain.de>")
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// ============================================================
const siteUrl = env => String(env.SITE_URL || "").trim().replace(/\/+$/, "");
const billingReady = env => !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && (env.STRIPE_PRO_PRICE_MONTH || env.STRIPE_PRICE_MONTH) && siteUrl(env));
const mailReady = env => !!((env.RESEND_API_KEY || env.BREVO_API_KEY) && env.MAIL_FROM);
const googleReady = env => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && siteUrl(env));
const plusReady = env => !!(env.STRIPE_PLUS_PRICE_MONTH || env.STRIPE_PLUS_PRICE_YEAR);   // Plus-Tarif nur anbieten, wenn mindestens ein Plus-Preis eingetragen ist
const billingOn = (env, cfg) => cfg.billing.enabled && billingReady(env);
const berlinDay = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });

let schemaDone = null;
function ensureSchema(env) {
  if (schemaDone) return schemaDone;
  const q = s => env.DB.prepare(s);
  schemaDone = env.DB.batch([
    q("CREATE TABLE IF NOT EXISTS subs(user_id INTEGER PRIMARY KEY, customer_id TEXT, subscription_id TEXT, status TEXT, price_id TEXT, plan TEXT, period_end INTEGER, cancel_at_period_end INTEGER DEFAULT 0, grant_until INTEGER, updated_at INTEGER)"),
    q("CREATE INDEX IF NOT EXISTS ix_subs_customer ON subs(customer_id)"),
    q("CREATE TABLE IF NOT EXISTS emails(user_id INTEGER PRIMARY KEY, email TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, code_hash TEXT, code_expires INTEGER, attempts INTEGER DEFAULT 0, sent_at INTEGER, created_at INTEGER)"),
    q("CREATE UNIQUE INDEX IF NOT EXISTS ux_emails_verified ON emails(email) WHERE verified = 1"),
    q("CREATE TABLE IF NOT EXISTS google_links(sub TEXT PRIMARY KEY, user_id INTEGER NOT NULL)"),
    q("CREATE TABLE IF NOT EXISTS oauth_states(state TEXT PRIMARY KEY, next TEXT, created_at INTEGER)"),
    q("CREATE TABLE IF NOT EXISTS oauth_codes(code TEXT PRIMARY KEY, sub TEXT, email TEXT, created_at INTEGER)"),
    q("CREATE TABLE IF NOT EXISTS ai_chats(user_id INTEGER NOT NULL, day TEXT NOT NULL, cid TEXT NOT NULL, PRIMARY KEY(user_id, day, cid))"),
    q("CREATE TABLE IF NOT EXISTS consents(user_id INTEGER NOT NULL, kind TEXT NOT NULL, ts INTEGER NOT NULL)"),
  ]).then(() => env.DB.prepare("ALTER TABLE subs ADD COLUMN grant_plan TEXT").run().catch(() => {})).catch(e => { schemaDone = null; throw e; });
  return schemaDone;
}

// ---- Stripe ----
function flat(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => typeof x === "object" ? flat(x, `${key}[${i}]`, out) : out.push([`${key}[${i}]`, String(x)]));
    else if (typeof v === "object") flat(v, key, out);
    else out.push([key, String(v)]);
  }
  return out;
}
async function stripe(env, method, path, params) {
  const qs = params ? new URLSearchParams(flat(params)).toString() : "";
  const r = await fetch("https://api.stripe.com" + path + (method === "GET" && qs ? "?" + qs : ""), {
    method,
    headers: { Authorization: "Bearer " + clean(env.STRIPE_SECRET_KEY), ...(method !== "GET" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: method === "GET" ? undefined : qs,
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || ("Stripe " + r.status));
  return j;
}
async function verifyStripeSig(raw, header, secret) {
  const parts = String(header || "").split(",").map(s => s.trim().split("="));
  const t = (parts.find(p => p[0] === "t") || [])[1];
  const sigs = parts.filter(p => p[0] === "v1").map(p => p[1]);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - +t) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(clean(secret)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = hex(await crypto.subtle.sign("HMAC", key, enc.encode(t + "." + raw)));
  return sigs.some(s => same(mac, s));
}
const planOf = (env, priceId) => !priceId ? "month" : priceId === env.STRIPE_PLUS_PRICE_YEAR ? "plus_year" : priceId === env.STRIPE_PLUS_PRICE_MONTH ? "plus_month" : priceId === (env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR) ? "year" : "month";
async function saveSub(env, uid, sub) {
  const item = sub.items?.data?.[0];
  const end = (sub.current_period_end ?? item?.current_period_end ?? 0) * 1000;
  const price = item?.price?.id || null;
  await env.DB.prepare(`INSERT INTO subs(user_id, customer_id, subscription_id, status, price_id, plan, period_end, cancel_at_period_end, updated_at) VALUES(?,?,?,?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET customer_id=excluded.customer_id, subscription_id=excluded.subscription_id, status=excluded.status, price_id=excluded.price_id, plan=excluded.plan,
    period_end=excluded.period_end, cancel_at_period_end=excluded.cancel_at_period_end, updated_at=excluded.updated_at`)
    .bind(uid, typeof sub.customer === "string" ? sub.customer : sub.customer?.id || null, sub.id, sub.status, price, planOf(env, price), end, (sub.cancel_at_period_end || sub.cancel_at) ? 1 : 0, Date.now()).run();
}
async function handleStripeEvent(env, ev) {
  const o = ev.data?.object || {};
  if (ev.type === "checkout.session.completed" && o.mode === "subscription") {
    const uid = +(o.client_reference_id || o.metadata?.user_id || 0);
    if (!uid || !o.subscription) return;
    const sub = await stripe(env, "GET", "/v1/subscriptions/" + o.subscription);
    await saveSub(env, uid, sub);
  } else if (ev.type.startsWith("customer.subscription.")) {
    let uid = +(o.metadata?.user_id || 0);
    if (!uid) {
      const cust = typeof o.customer === "string" ? o.customer : o.customer?.id;
      const row = cust ? await env.DB.prepare("SELECT user_id FROM subs WHERE customer_id = ?").bind(cust).first() : null;
      uid = row ? row.user_id : 0;
    }
    if (!uid) return;
    if (ev.type === "customer.subscription.deleted") o.status = "canceled";
    await saveSub(env, uid, o);
  }
}
async function proState(env, uid) {
  const r = await env.DB.prepare("SELECT * FROM subs WHERE user_id = ?").bind(uid).first();
  const now = Date.now();
  let pro = false, plus = false, until = null;
  if (r) {
    if (r.grant_until && r.grant_until > now) { if (r.grant_plan === "plus") plus = true; else pro = true; until = r.grant_until; }   // geschenkt: Plus oder Pro
    if (["active", "trialing", "past_due"].includes(r.status) && r.period_end > now) {
      if (String(r.plan || "").startsWith("plus")) plus = true; else pro = true;
      until = Math.max(until || 0, r.period_end);
    }
  }
  if (pro) plus = false;
  return { pro, plus, until, status: r ? r.status : null, cancelAtEnd: !!(r && r.cancel_at_period_end), plan: r ? r.plan : null, hasCustomer: !!(r && r.customer_id), hasSub: !!(r && r.subscription_id && ["active", "trialing", "past_due"].includes(r.status)), grant: !!(r && r.grant_until && r.grant_until > now), grantPlan: r && r.grant_until > now ? (r.grant_plan === "plus" ? "plus" : "pro") : null };
}
async function isPro(env, user) { return user.admin || (await proState(env, user.id)).pro; }
// Darf der Nutzer die Funktion f ("notes" | "practice") nutzen? Frei, wenn sie nicht an Pro gebunden ist; sonst mit Pro, oder mit Plus, falls Plus sie enthält.
async function hasFeature(env, cfg, user, f) {
  if (!cfg.billing.proFeatures[f] || user.admin) return true;
  const st = await proState(env, user.id);
  return st.pro || (st.plus && cfg.billing.plusFeatures[f] === true);
}
async function userInfo(env, u) {
  const e = await env.DB.prepare("SELECT email, verified FROM emails WHERE user_id = ?").bind(u.id).first();
  const p = await proState(env, u.id);
  const pw = await env.DB.prepare("SELECT salt FROM users WHERE id = ?").bind(u.id).first();
  return { hasPassword: !(pw && pw.salt === "oauth"), username: u.username, admin: !!u.admin, owner: !!u.owner, email: e ? e.email : null, emailVerified: !!(e && e.verified), pro: p.pro || !!u.admin, plus: p.plus && !u.admin, proUntil: p.until, plan: p.plan, cancelAtEnd: p.cancelAtEnd };
}
let priceCache = { t: 0, v: null };
// Diagnose fürs Dashboard: warum lassen sich Preise nicht laden? (Fehlertext von Stripe je Preis)
async function priceErrors(env) {
  const out = {};
  const ids = { "Pro Monat": (env.STRIPE_PRO_PRICE_MONTH || env.STRIPE_PRICE_MONTH), "Pro Jahr": (env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR), "Plus Monat": env.STRIPE_PLUS_PRICE_MONTH, "Plus Jahr": env.STRIPE_PLUS_PRICE_YEAR };
  await Promise.all(Object.entries(ids).filter(([, v]) => v).map(async ([k, v]) => {
    try { await stripe(env, "GET", "/v1/prices/" + encodeURIComponent(clean(v))); } catch (e) { out[k] = String(e.message || e).slice(0, 200); }
  }));
  return out;
}
async function planList(env, cfg) {
  if (priceCache.v && Date.now() - priceCache.t < 600000) return priceCache.v;
  const ids = [...(env.STRIPE_PLUS_PRICE_MONTH ? [["plus_month", env.STRIPE_PLUS_PRICE_MONTH]] : []), ...(cfg.billing.yearly && env.STRIPE_PLUS_PRICE_YEAR ? [["plus_year", env.STRIPE_PLUS_PRICE_YEAR]] : []),
    ["month", (env.STRIPE_PRO_PRICE_MONTH || env.STRIPE_PRICE_MONTH)], ...(cfg.billing.yearly && (env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR) ? [["year", (env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR)]] : [])];
  const out = [];
  for (const [id, pid] of ids) {
    try {
      const p = await stripe(env, "GET", "/v1/prices/" + encodeURIComponent(clean(pid)));
      out.push({ id, amount: p.unit_amount, currency: p.currency, interval: p.recurring?.interval || (id.endsWith("year") ? "year" : "month") });
    } catch (e) {}
  }
  if (out.length) priceCache = { t: Date.now(), v: out };
  return out;
}

// ---- E-Mail ----
async function sendMail(env, to, subject, text, html) {
  if (!mailReady(env)) throw new Error("E-Mail-Versand ist nicht eingerichtet.");
  if (env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + clean(env.RESEND_API_KEY), "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text, html }), signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error("Resend " + r.status + " " + (await r.text()).slice(0, 160));
  } else {
    const m = String(env.MAIL_FROM).match(/^\s*(?:"?([^"<]*)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?\s*$/) || [];
    const r = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": clean(env.BREVO_API_KEY), "Content-Type": "application/json" },
      body: JSON.stringify({ sender: { name: (m[1] || "Regelheft").trim(), email: m[2] }, to: [{ email: to }], subject, textContent: text, htmlContent: html }), signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error("Brevo " + r.status + " " + (await r.text()).slice(0, 160));
  }
}
const mailHtml = (title, bodyHtml) => `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#14181f"><h2 style="margin:0 0 12px">${title}</h2>${bodyHtml}<p style="color:#6b7280;font-size:12px;margin-top:28px">Regelheft Mathematik · Gölitzer Development · ein Angebot von Scherer Development Excellence</p></div>`;
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[A-Za-z]{2,}$/;
async function startEmailVerify(env, user, emailRaw) {
  const email = String(emailRaw || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 120) return { error: "Bitte gib eine gültige E-Mail-Adresse ein.", status: 400 };
  const taken = await env.DB.prepare("SELECT user_id FROM emails WHERE email = ? AND verified = 1 AND user_id != ?").bind(email, user.id).first();
  if (taken) return { error: "Diese E-Mail-Adresse wird schon von einem anderen Konto benutzt.", status: 409 };
  const cur = await env.DB.prepare("SELECT email, verified FROM emails WHERE user_id = ?").bind(user.id).first();
  if (cur && cur.verified && cur.email === email) return { ok: true, already: true };
  if (!mailReady(env)) {   // E-Mail-Versand (noch) nicht eingerichtet: Adresse nur speichern, ohne Bestätigung
    await env.DB.prepare("INSERT INTO emails(user_id, email, verified, created_at) VALUES(?,?,0,?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email, verified=0, code_hash=NULL").bind(user.id, email, Date.now()).run();
    return { ok: true, noMail: true };
  }
  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  const h = await sha256(`${user.id}:${email}:${code}:${env.CODE_PEPPER || ""}`);
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO emails(user_id, email, verified, code_hash, code_expires, attempts, sent_at, created_at) VALUES(?,?,0,?,?,0,?,?)
    ON CONFLICT(user_id) DO UPDATE SET email=excluded.email, verified=0, code_hash=excluded.code_hash, code_expires=excluded.code_expires, attempts=0, sent_at=excluded.sent_at`)
    .bind(user.id, email, h, now + 15 * 60000, now, now).run();
  await sendMail(env, email, "Dein Bestätigungscode: " + code,
    `Dein Bestätigungscode für das Regelheft lautet: ${code}\n\nEr ist 15 Minuten gültig. Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.`,
    mailHtml("Dein Bestätigungscode", `<p>Gib diesen Code im Regelheft ein:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p><p>Er ist 15 Minuten gültig. Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>`));
  return { ok: true };
}
async function checkEmailCode(env, user, codeRaw) {
  const row = await env.DB.prepare("SELECT email, verified, code_hash, code_expires, attempts FROM emails WHERE user_id = ?").bind(user.id).first();
  if (!row) return { error: "Bitte gib zuerst deine E-Mail-Adresse an.", status: 400 };
  if (row.verified) return { ok: true };
  if (!row.code_hash || row.code_expires < Date.now()) return { error: "Der Code ist abgelaufen. Fordere einen neuen an.", status: 400 };
  if (row.attempts >= 5) return { error: "Zu viele falsche Versuche. Fordere einen neuen Code an.", status: 429 };
  const code = String(codeRaw || "").replace(/\D/g, "");
  const h = await sha256(`${user.id}:${row.email}:${code}:${env.CODE_PEPPER || ""}`);
  if (!same(h, row.code_hash)) {
    await env.DB.prepare("UPDATE emails SET attempts = attempts + 1 WHERE user_id = ?").bind(user.id).run();
    return { error: "Der Code ist nicht richtig.", status: 400 };
  }
  try { await env.DB.prepare("UPDATE emails SET verified = 1, code_hash = NULL WHERE user_id = ?").bind(user.id).run(); }
  catch (e) { return { error: "Diese E-Mail-Adresse wird schon von einem anderen Konto benutzt.", status: 409 }; }
  return { ok: true };
}

// ---- Google-Login (Weiterleitung zu Google, kein Google-Skript auf der Seite) ----
async function googleUsername(env, email) {
  let base = String(email).split("@")[0].replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 16);
  if (base.length < 3) base = (base + "user").slice(0, 8);
  for (let i = 0; i < 8; i++) {
    const name = i === 0 ? base : base.slice(0, 16) + String(100 + (crypto.getRandomValues(new Uint8Array(1))[0] % 900));
    if (!(await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(name).first())) return name;
  }
  return base.slice(0, 12) + rand(3);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "*").split(",").map(s => s.trim());
    const any = allowed.includes("*"), okOrigin = any || allowed.includes(origin);
    const cors = { "Access-Control-Allow-Origin": any ? "*" : (okOrigin ? origin : allowed[0]),
      "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", Vary: "Origin" };
    const json = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const _p = new URL(req.url).pathname.replace(/\/+$/, "");
    const openPaths = ["/api/billing/webhook", "/api/auth/google/start", "/api/auth/google/callback"];   // kommen von Stripe/Google, nicht von der Webseite
    if (!okOrigin && !openPaths.includes(_p)) return json({ error: "Nicht erlaubt." }, 403);
    if (!env.DB) return json({ error: "Die Datenbank (DB) ist im Worker nicht verbunden." }, 500);
    await ensureSchema(env);

    const url = new URL(req.url), path = url.pathname.replace(/\/+$/, ""), ip = req.headers.get("CF-Connecting-IP") || "?";
    // ---- Stripe-Webhook (Signatur wird geprüft) ----
    if (req.method === "POST" && path === "/api/billing/webhook") {
      if (!env.STRIPE_WEBHOOK_SECRET) return new Response("kein Webhook-Secret", { status: 503 });
      const raw = await req.text();
      if (!(await verifyStripeSig(raw, req.headers.get("Stripe-Signature"), env.STRIPE_WEBHOOK_SECRET))) return new Response("ungültige Signatur", { status: 400 });
      let ev; try { ev = JSON.parse(raw); } catch { return new Response("ungültig", { status: 400 }); }
      try { await handleStripeEvent(env, ev); } catch (e) { return new Response("Fehler: " + e.message, { status: 500 }); }   // Stripe wiederholt dann automatisch
      return new Response("ok");
    }
    // ---- Google-Login: Weiterleitung zu Google und zurück ----
    if (req.method === "GET" && (path === "/api/auth/google/start" || path === "/api/auth/google/callback")) {
      const cfg0 = await getSettings(env);
      const back = q => Response.redirect(siteUrl(env) + "/anmeldung.html?" + q, 302);
      if (!siteUrl(env)) return new Response("SITE_URL ist im Worker nicht gesetzt.", { status: 503 });
      if (!cfg0.auth.google || !googleReady(env)) return back("gerr=off");
      if (path === "/api/auth/google/start") {
        if (limited("gst" + ip, 20)) return back("gerr=busy");
        const nx = url.searchParams.get("next") || "";
        const next = /^[a-z0-9_-]+\.html(#[\w-]+)?$/i.test(nx) ? nx : "index.html";
        const state = rand(16);
        await env.DB.prepare("DELETE FROM oauth_states WHERE created_at < ?").bind(Date.now() - 600000).run();
        await env.DB.prepare("INSERT INTO oauth_states(state, next, created_at) VALUES(?,?,?)").bind(state, next, Date.now()).run();
        const q = new URLSearchParams({ client_id: clean(env.GOOGLE_CLIENT_ID), redirect_uri: url.origin + "/api/auth/google/callback", response_type: "code", scope: "openid email profile", state, prompt: "select_account" });
        return Response.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + q, 302);
      }
      const st = url.searchParams.get("state") || "", code = url.searchParams.get("code") || "";
      const row = await env.DB.prepare("SELECT next, created_at FROM oauth_states WHERE state = ?").bind(st).first();
      await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(st).run();
      if (!row || row.created_at < Date.now() - 600000 || !code) return back("gerr=state");
      try {
        const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code, client_id: clean(env.GOOGLE_CLIENT_ID), client_secret: clean(env.GOOGLE_CLIENT_SECRET), redirect_uri: url.origin + "/api/auth/google/callback", grant_type: "authorization_code" }), signal: AbortSignal.timeout(15000) });
        const tj = await tr.json();
        if (!tr.ok || !tj.access_token) throw new Error("token");
        const ur = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: "Bearer " + tj.access_token }, signal: AbortSignal.timeout(15000) });
        const info = await ur.json();
        if (!ur.ok || !info.sub || !info.email || info.email_verified !== true) return back("gerr=mail");
        const gc = rand(24);
        await env.DB.prepare("DELETE FROM oauth_codes WHERE created_at < ?").bind(Date.now() - 600000).run();
        await env.DB.prepare("INSERT INTO oauth_codes(code, sub, email, created_at) VALUES(?,?,?,?)").bind(gc, String(info.sub), String(info.email).toLowerCase(), Date.now()).run();
        return back("gcode=" + gc + "&next=" + encodeURIComponent(row.next));
      } catch (e) { return back("gerr=fail"); }
    }
    let body = {};
    if (req.method === "POST") {
      if (+(req.headers.get("content-length") || 0) > 6e6) return json({ error: "Bild zu groß." }, 413);
      try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage." }, 400); }
    }
    const POST = req.method === "POST", GET = req.method === "GET";
    try {
      const cfg = await getSettings(env);
      const off = () => json({ error: "Diese Funktion ist gerade deaktiviert." }, 403);
      if (GET && path === "/api/config") {   // öffentlich: was die Webseite anzeigen/erlauben soll
        const r = json({ maintenance: cfg.maintenance, announcement: cfg.announcement, news: cfg.news, features: cfg.features, social: cfg.social,
          billing: { enabled: billingOn(env, cfg), proFeatures: cfg.billing.proFeatures, freeAiPerDay: cfg.billing.freeAiPerDay, plusAvailable: plusReady(env), plusAiPerDay: cfg.billing.plusAiPerDay, plusFeatures: cfg.billing.plusFeatures, yearly: cfg.billing.yearly && !!(env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR), kleinunternehmer: cfg.billing.kleinunternehmer, note: cfg.billing.note },
          auth: { requireEmail: cfg.auth.requireEmail, verifyActive: cfg.auth.requireEmail && cfg.auth.requireVerified && mailReady(env), mailActive: mailReady(env), mailProvider: env.RESEND_API_KEY ? "Resend" : env.BREVO_API_KEY ? "Brevo" : null, google: cfg.auth.google && googleReady(env) } });
        r.headers.set("Cache-Control", "public, max-age=20");
        return r;
      }
      if (GET && path === "/api/billing/plans") {
        if (!billingOn(env, cfg)) return json({ enabled: false, plans: [] });
        return json({ enabled: true, plans: await planList(env, cfg) });
      }
      if (POST && path === "/api/auth/google/exchange") {   // Browser tauscht den Einmal-Code gegen eine Anmeldung
        if (!cfg.auth.google || !googleReady(env)) return json({ error: "Google-Login ist gerade nicht verfügbar." }, 503);
        if (limited("gex" + ip, 20)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        const gc = String(body.code || "");
        const c = await env.DB.prepare("SELECT sub, email, created_at FROM oauth_codes WHERE code = ?").bind(gc).first();
        if (!c || c.created_at < Date.now() - 600000) return json({ error: "Der Google-Login ist abgelaufen. Bitte versuche es noch einmal." }, 400);
        let link = await env.DB.prepare("SELECT user_id FROM google_links WHERE sub = ?").bind(c.sub).first();
        let uid = link ? link.user_id : null;
        if (!uid) {   // gibt es schon ein Konto mit dieser (bestätigten) E-Mail-Adresse?
          const m = await env.DB.prepare("SELECT user_id FROM emails WHERE email = ? AND verified = 1").bind(c.email).first();
          if (m) { uid = m.user_id; await env.DB.prepare("INSERT OR IGNORE INTO google_links(sub, user_id) VALUES(?,?)").bind(c.sub, uid).run(); }
        }
        if (!uid) {   // neues Konto: erst Alter + Datenschutz bestätigen lassen
          if (body.age !== true || body.consent !== true) return json({ needsConsent: true, email: c.email });
          if (!cfg.features.registration) return json({ error: "Die Registrierung ist gerade geschlossen." }, 403);
          const name = await googleUsername(env, c.email);
          const r = await env.DB.prepare("INSERT INTO users(username,salt,pw_hash,created_at) VALUES(?,?,?,?)").bind(name, "oauth", "oauth:" + rand(24), Date.now()).run();
          uid = r.meta.last_row_id;
          try { await env.DB.prepare("INSERT INTO emails(user_id,email,verified,created_at) VALUES(?,?,1,?)").bind(uid, c.email, Date.now()).run(); } catch (e) {}
          await env.DB.prepare("INSERT INTO google_links(sub, user_id) VALUES(?,?)").bind(c.sub, uid).run();
        }
        await env.DB.prepare("DELETE FROM oauth_codes WHERE code = ?").bind(gc).run();
        const u = await env.DB.prepare("SELECT id, username FROM users WHERE id = ?").bind(uid).first();
        const uu = { id: u.id, username: u.username, ...(await roleOf(env, u.username)) };
        return json({ token: await newSession(env, uid), user: await userInfo(env, uu) });
      }
      if (POST && path === "/api/register") {
        if (!cfg.features.registration) return json({ error: "Die Registrierung ist gerade geschlossen." }, 403);
        if (limited("reg" + ip, 8)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        const name = String(body.username || "").trim(), pw = String(body.password || "");
        if (!/^[A-Za-z0-9_.-]{3,20}$/.test(name)) return json({ error: "Benutzername: 3–20 Zeichen (Buchstaben, Zahlen, _ . -)." }, 400);
        if (pw.length < 8 || pw.length > 100) return json({ error: "Das Passwort braucht mindestens 8 Zeichen." }, 400);
        if (body.age !== true) return json({ error: "Bitte bestätige das Mindestalter (16) bzw. die Erlaubnis deiner Erziehungsberechtigten." }, 400);
        if (body.consent !== true) return json({ error: "Bitte bestätige den Hinweis zur Einsicht der Chats." }, 400);
        const mail = String(body.email || "").trim().toLowerCase();
        if (cfg.auth.requireEmail && (!EMAIL_RE.test(mail) || mail.length > 120)) return json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, 400);
        if (mail && await env.DB.prepare("SELECT user_id FROM emails WHERE email = ? AND verified = 1").bind(mail).first()) return json({ error: "Zu dieser E-Mail-Adresse gibt es schon ein Konto. Bitte melde dich an (oder nutze „Mit Google“)." }, 409);
        if (await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(name).first()) return json({ error: "Dieser Benutzername ist schon vergeben." }, 409);
        const salt = rand(16), r = await env.DB.prepare("INSERT INTO users(username,salt,pw_hash,created_at) VALUES(?,?,?,?)").bind(name, salt, await hashPw(pw, salt), Date.now()).run();
        const uid = r.meta.last_row_id;
        // Keine Code-Mail beim Registrieren: den Code verschickt erst der Dialog "Code senden" direkt danach.
        if (mail) await env.DB.prepare("INSERT OR IGNORE INTO emails(user_id,email,verified,created_at) VALUES(?,?,0,?)").bind(uid, mail, Date.now()).run();
        return json({ token: await newSession(env, uid), user: await userInfo(env, { id: uid, username: name, ...(await roleOf(env, name)) }), needsVerify: false });
      }
      if (POST && path === "/api/login") {
        if (limited("log" + ip, 10)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        const u = await env.DB.prepare("SELECT id, username, salt, pw_hash FROM users WHERE username = ?").bind(String(body.username || "").trim()).first();
        if (u && u.salt === "oauth") return json({ error: "Dieses Konto wurde mit Google erstellt. Bitte nutze „Mit Google anmelden“." }, 401);
        const h = await hashPw(String(body.password || ""), u ? u.salt : "x");
        if (!u || !same(h, u.pw_hash)) return json({ error: "Benutzername oder Passwort falsch." }, 401);
        return json({ token: await newSession(env, u.id), user: await userInfo(env, { id: u.id, username: u.username, ...(await roleOf(env, u.username)) }) });
      }
      if (POST && path === "/api/log") {   // öffentliche Statistik: Suchbegriffe und geöffnete Regeln
        if (!cfg.features.stats) return json({ ok: true });
        if (limited("ev" + ip, 80)) return json({ ok: true });
        const kind = body.kind === "open" ? "open" : body.kind === "search" ? "search" : null;
        let v = String(body.value || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 60);
        if (!kind || v.length < (kind === "open" ? 2 : 2) || (kind === "open" && !/^r\d{1,4}$/.test(v))) return json({ ok: true });
        await env.DB.prepare("INSERT INTO events(kind,value,ts) VALUES(?,?,?)").bind(kind, v, Date.now()).run();
        if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM events WHERE ts < ?").bind(Date.now() - 365 * 864e5).run();   // Statistik nach 12 Monaten löschen
        return json({ ok: true });
      }

      const user = await getUser(req, env);
      if (GET && path === "/api/me") return user ? json({ user: await userInfo(env, user) }) : json({ error: "Nicht angemeldet." }, 401);
      if (!user) return json({ error: "Bitte melde dich an.", login: true }, 401);

      if (POST && path === "/api/email/start") {
        if (limited("ems" + user.id, 4) || limited("emi" + ip, 12)) return json({ error: "Du hast gerade schon mehrere Codes angefordert. Bitte warte ein paar Minuten." }, 429);
        let r; try { r = await startEmailVerify(env, user, body.email); } catch (e) { return json({ error: "Die E-Mail konnte nicht gesendet werden." + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, 502); }
        return r.error ? json({ error: r.error }, r.status) : json({ ok: true, already: !!r.already, noMail: !!r.noMail, user: await userInfo(env, user) });
      }
      if (POST && path === "/api/email/verify") {
        if (limited("emv" + user.id, 12)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        const r = await checkEmailCode(env, user, body.code);
        return r.error ? json({ error: r.error }, r.status) : json({ ok: true, user: await userInfo(env, user) });
      }
      if (GET && path === "/api/billing/status") {
        const st = await proState(env, user.id);
        let quota = null;
        if (billingOn(env, cfg) && !user.admin && !st.pro) {
          const used = (await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_chats WHERE user_id = ? AND day = ?").bind(user.id, berlinDay()).first()).n;
          quota = { used, limit: st.plus ? cfg.billing.plusAiPerDay : cfg.billing.freeAiPerDay };
        }
        return json({ enabled: billingOn(env, cfg), pro: st.pro || user.admin, plus: st.plus && !user.admin, until: st.until, status: st.status, cancelAtEnd: st.cancelAtEnd, plan: st.plan, canManage: st.hasCustomer, hasSub: st.hasSub, grant: st.grant, quota });
      }
      if (POST && path === "/api/billing/checkout") {
        if (!billingOn(env, cfg)) return json({ error: "Die Bezahlung ist gerade nicht verfügbar." }, 503);
        if (limited("co" + user.id, 8)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        if (body.confirm18 !== true || body.waiver !== true) return json({ error: "Bitte bestätige beide Hinweise vor dem Kauf." }, 400);
        const info = await userInfo(env, user);
        if (mailReady(env) && cfg.auth.requireVerified && !info.emailVerified) return json({ error: "Bitte bestätige zuerst deine E-Mail-Adresse.", code: "verify_required" }, 403);
        const st = await proState(env, user.id);
        if (st.hasSub) return json({ error: "Du hast schon ein aktives Abo. Du kannst es unter „Mein Konto“ verwalten, dort kannst du auch den Tarif wechseln.", code: "already" }, 409);
        const priceFor = { month: (env.STRIPE_PRO_PRICE_MONTH || env.STRIPE_PRICE_MONTH), year: cfg.billing.yearly && (env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR), plus_month: env.STRIPE_PLUS_PRICE_MONTH, plus_year: cfg.billing.yearly && env.STRIPE_PLUS_PRICE_YEAR };
        const plan = priceFor[body.plan] ? body.plan : "month";
        const prev = await env.DB.prepare("SELECT customer_id FROM subs WHERE user_id = ?").bind(user.id).first();
        const now = Date.now();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO consents(user_id, kind, ts) VALUES(?,?,?)").bind(user.id, "checkout_alter_zustimmung", now),
          env.DB.prepare("INSERT INTO consents(user_id, kind, ts) VALUES(?,?,?)").bind(user.id, "checkout_sofortige_ausfuehrung_widerruf", now),
        ]);
        let sess;
        try {
          sess = await stripe(env, "POST", "/v1/checkout/sessions", {
            mode: "subscription", locale: "de",
            line_items: [{ price: priceFor[plan], quantity: 1 }],
            client_reference_id: String(user.id),
            ...(prev && prev.customer_id ? { customer: prev.customer_id } : (info.email ? { customer_email: info.email } : {})),
            success_url: siteUrl(env) + "/pro.html?ok=1", cancel_url: siteUrl(env) + "/pro.html?cancel=1",
            metadata: { user_id: String(user.id), plan }, subscription_data: { metadata: { user_id: String(user.id), plan } },
            allow_promotion_codes: cfg.billing.promo ? "true" : undefined,
            custom_text: { submit: { message: "Mit dem Klick auf die Schaltfläche gehst du eine Zahlungsverpflichtung ein. Das Abo verlängert sich automatisch und ist jederzeit unter „Mein Konto“ kündbar. Rechnungsstellung durch Scherer Development Excellence; die Belastung erscheint in der Regel unter Stripe." } },
          });
        } catch (e) { return json({ error: "Die Bezahlseite konnte nicht geöffnet werden." + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, 502); }
        return json({ url: sess.url });
      }
      if (POST && path === "/api/billing/portal") {
        const row = await env.DB.prepare("SELECT customer_id FROM subs WHERE user_id = ?").bind(user.id).first();
        if (!row || !row.customer_id || !env.STRIPE_SECRET_KEY) return json({ error: "Es gibt noch kein Abo, das verwaltet werden kann." }, 404);
        try { const p = await stripe(env, "POST", "/v1/billing_portal/sessions", { customer: row.customer_id, return_url: siteUrl(env) + "/konto.html" }); return json({ url: p.url }); }
        catch (e) { return json({ error: "Die Verwaltung konnte nicht geöffnet werden." + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, 502); }
      }
      if (POST && (path === "/api/billing/cancel" || path === "/api/billing/resume")) {
        if (limited("can" + user.id, 8)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        const row = await env.DB.prepare("SELECT subscription_id, status FROM subs WHERE user_id = ?").bind(user.id).first();
        if (!row || !row.subscription_id || !["active", "trialing", "past_due"].includes(row.status)) return json({ error: "Es gibt kein laufendes Abo." }, 404);
        const cancel = path === "/api/billing/cancel";
        if (cancel && body.confirm !== true) return json({ error: "Bitte bestätige die Kündigung." }, 400);
        let sub;
        try { sub = await stripe(env, "POST", "/v1/subscriptions/" + row.subscription_id, { cancel_at_period_end: cancel ? "true" : "false" }); }
        catch (e) { return json({ error: "Das hat leider nicht geklappt. Bitte versuche es später noch einmal." + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, 502); }
        await saveSub(env, user.id, sub);
        const info = await userInfo(env, user), tn = info.plan && String(info.plan).startsWith("plus") ? "Plus" : "Pro", end = new Date((sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0) * 1000).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" });
        if (cancel && info.email && mailReady(env)) {   // Kündigungsbestätigung
          try { await sendMail(env, info.email, "Bestätigung deiner Kündigung", `Hallo ${user.username},

deine Kündigung von Regelheft ${tn} ist bei uns eingegangen. Du kannst ${tn} noch bis zum ${end} nutzen, danach endet das Abo.

Gölitzer Development
ein Angebot von Scherer Development Excellence`,
            mailHtml("Kündigung bestätigt", `<p>Hallo ${user.username},</p><p>deine Kündigung von <b>Regelheft ${tn}</b> ist bei uns eingegangen.</p><p>Du kannst ${tn} noch bis zum <b>${end}</b> nutzen, danach endet das Abo.</p>`)); } catch (e) {}
        }
        return json({ ok: true, user: await userInfo(env, user) });
      }
      if (POST && path === "/api/logout") {
        const t = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
        await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(t)).run();
        return json({ ok: true });
      }
      if (POST && path === "/api/account/delete") {
        if (limited("del" + user.id, 5)) return json({ error: "Zu viele Versuche. Bitte warte ein paar Minuten." }, 429);
        const u = await env.DB.prepare("SELECT salt, pw_hash FROM users WHERE id = ?").bind(user.id).first();
        if (u && u.salt === "oauth") { if (String(body.password || "") !== user.username) return json({ error: "Bitte gib zur Bestätigung deinen Benutzernamen ein." }, 403); }
        else if (!u || !same(await hashPw(String(body.password || ""), u.salt), u.pw_hash)) return json({ error: "Das Passwort ist falsch." }, 403);
        // laufendes Abo beenden, damit nach dem Löschen nichts weiter abgebucht wird
        try {
          const sb = await env.DB.prepare("SELECT subscription_id, status FROM subs WHERE user_id = ?").bind(user.id).first();
          if (sb && sb.subscription_id && ["active", "trialing", "past_due"].includes(sb.status) && env.STRIPE_SECRET_KEY) await stripe(env, "DELETE", "/v1/subscriptions/" + sb.subscription_id);
        } catch (e) {}
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS favs(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS recent(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, opened_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS notes(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, body TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cards(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, box INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        await env.DB.batch([
          env.DB.prepare("DELETE FROM favs WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM recent WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM notes WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM cards WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM chats WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM emails WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM google_links WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM subs WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM ai_chats WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM consents WHERE user_id = ?").bind(user.id),
          env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
        ]);
        if ((cfg.staff || []).some(n => n.toLowerCase() === user.username.toLowerCase())) await saveSettings(env, { ...cfg, staff: cfg.staff.filter(n => n.toLowerCase() !== user.username.toLowerCase()) });
        return json({ ok: true });
      }
      // Merkliste (Stern): speichert nur die Regel-Kennungen (r1, r2 …) pro Konto
      if (path === "/api/favs") {
        if (!cfg.features.favorites) return off();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS favs(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        if (GET) {
          const rs = await env.DB.prepare("SELECT rule_id FROM favs WHERE user_id = ? ORDER BY created_at DESC LIMIT 500").bind(user.id).all();
          return json({ ids: rs.results.map(r => r.rule_id) });
        }
        if (POST) {
          const id = String(body.id || "");
          if (!/^r\d{1,4}$/.test(id)) return json({ error: "Ungültige Regel." }, 400);
          if (limited("fav" + user.id, 120)) return json({ error: "Zu viele Anfragen. Bitte warte kurz." }, 429);
          if (body.on === false) await env.DB.prepare("DELETE FROM favs WHERE user_id = ? AND rule_id = ?").bind(user.id, id).run();
          else await env.DB.prepare("INSERT OR IGNORE INTO favs(user_id, rule_id, created_at) VALUES(?,?,?)").bind(user.id, id, Date.now()).run();
          return json({ ok: true });
        }
      }
      // Zuletzt geöffnet: nur Regel-Kennungen, maximal 15 pro Konto
      if (path === "/api/recent") {
        if (!cfg.features.recent) return off();
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS recent(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, opened_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        if (GET) {
          const rs = await env.DB.prepare("SELECT rule_id FROM recent WHERE user_id = ? ORDER BY opened_at DESC LIMIT 15").bind(user.id).all();
          return json({ ids: rs.results.map(r => r.rule_id) });
        }
        if (POST) {
          if (body.clear === true) { await env.DB.prepare("DELETE FROM recent WHERE user_id = ?").bind(user.id).run(); return json({ ok: true }); }
          const id = String(body.id || "");
          if (!/^r\d{1,4}$/.test(id)) return json({ error: "Ungültige Regel." }, 400);
          if (limited("rec" + user.id, 240)) return json({ error: "Zu viele Anfragen. Bitte warte kurz." }, 429);
          await env.DB.batch([
            env.DB.prepare("INSERT INTO recent(user_id, rule_id, opened_at) VALUES(?,?,?) ON CONFLICT(user_id, rule_id) DO UPDATE SET opened_at = excluded.opened_at").bind(user.id, id, Date.now()),
            env.DB.prepare("DELETE FROM recent WHERE user_id = ? AND rule_id NOT IN (SELECT rule_id FROM recent WHERE user_id = ? ORDER BY opened_at DESC LIMIT 15)").bind(user.id, user.id),
          ]);
          return json({ ok: true });
        }
      }
      // Notizen zu Regeln (privat, nur für das eigene Konto)
      if (path === "/api/notes") {
        if (!cfg.features.notes) return off();
        if (billingOn(env, cfg) && !(await hasFeature(env, cfg, user, "notes"))) return json({ error: cfg.billing.plusFeatures.notes && plusReady(env) ? "Notizen gibt es mit Plus oder Pro." : "Notizen gibt es mit Pro.", code: "pro_required" }, 402);
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS notes(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, body TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        if (GET) {
          const rs = await env.DB.prepare("SELECT rule_id, body FROM notes WHERE user_id = ? LIMIT 400").bind(user.id).all();
          const notes = {}; for (const r of rs.results) notes[r.rule_id] = r.body;
          return json({ notes });
        }
        if (POST) {
          const id = String(body.id || "");
          if (!/^r\d{1,4}$/.test(id)) return json({ error: "Ungültige Regel." }, 400);
          if (limited("note" + user.id, 120)) return json({ error: "Zu viele Anfragen. Bitte warte kurz." }, 429);
          const text = String(body.text == null ? "" : body.text).trim().slice(0, 2000);
          if (!text) { await env.DB.prepare("DELETE FROM notes WHERE user_id = ? AND rule_id = ?").bind(user.id, id).run(); return json({ ok: true }); }
          const have = await env.DB.prepare("SELECT 1 AS x FROM notes WHERE user_id = ? AND rule_id = ?").bind(user.id, id).first();
          if (!have) {
            const c = await env.DB.prepare("SELECT COUNT(*) AS n FROM notes WHERE user_id = ?").bind(user.id).first();
            if (c && c.n >= 300) return json({ error: "Du kannst höchstens 300 Notizen speichern." }, 400);
          }
          await env.DB.prepare("INSERT INTO notes(user_id, rule_id, body, updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id, rule_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at").bind(user.id, id, text, Date.now()).run();
          return json({ ok: true });
        }
      }
      // Übungsmodus: Lernstand pro Regel (0 = noch nicht sicher … 3 = sicher)
      if (path === "/api/cards") {
        if (!cfg.features.practice) return off();
        if (billingOn(env, cfg) && !(await hasFeature(env, cfg, user, "practice"))) return json({ error: cfg.billing.plusFeatures.practice && plusReady(env) ? "Der Übungsmodus gehört zu Plus und Pro." : "Der Übungsmodus gehört zu Pro.", code: "pro_required" }, 402);
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS cards(user_id INTEGER NOT NULL, rule_id TEXT NOT NULL, box INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id, rule_id))").run();
        if (GET) {
          const rs = await env.DB.prepare("SELECT rule_id, box FROM cards WHERE user_id = ? LIMIT 500").bind(user.id).all();
          const boxes = {}; for (const r of rs.results) boxes[r.rule_id] = r.box;
          return json({ boxes });
        }
        if (POST) {
          if (body.reset === true) { await env.DB.prepare("DELETE FROM cards WHERE user_id = ?").bind(user.id).run(); return json({ ok: true }); }
          const id = String(body.id || ""), box = Number(body.box);
          if (!/^r\d{1,4}$/.test(id) || !Number.isInteger(box) || box < 0 || box > 3) return json({ error: "Ungültige Angabe." }, 400);
          if (limited("card" + user.id, 300)) return json({ error: "Zu viele Anfragen. Bitte warte kurz." }, 429);
          await env.DB.prepare("INSERT INTO cards(user_id, rule_id, box, updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id, rule_id) DO UPDATE SET box = excluded.box, updated_at = excluded.updated_at").bind(user.id, id, box, Date.now()).run();
          return json({ ok: true });
        }
      }
      // Meine Kurse (Plus/Pro): Uploads, Kurs-Erstellung und Stimmen
      if (POST && (path === "/api/upload-url" || path === "/api/kurs" || path === "/api/karten" || path === "/api/tts")) {
        if (!cfg.features.practice) return off();
        // Plus: Kurse aus Regelheft-Themen, KI-Karten, Podcast – aber keine eigenen Dateien. Pro: eigene Dateien, höchstens KURS_MAX_FILES pro Kurs.
        const tier = !billingOn(env, cfg) || user.admin ? { pro: true } : await proState(env, user.id);
        const kursPro = !!tier.pro, kursPlus = !kursPro && !!tier.plus;
        if (!kursPro && !kursPlus) return json({ error: "Meine Kurse gibt es mit Plus oder Pro.", code: "pro_required" }, 402);
        if (path === "/api/upload-url" && !kursPro) return json({ error: "Eigene Lerndateien hochladen gibt es nur mit Pro.", code: "pro_required" }, 402);
        if (!env.GEMINI_API_KEY) return json({ error: "Für Kurse fehlt im Worker das Secret GEMINI_API_KEY." }, 503);

        if (path === "/api/upload-url") {
          if (!user.admin && limited("up" + user.id, 60)) return json({ error: "Zu viele Uploads. Bitte warte ein paar Minuten." }, 429);
          const res = await startUpload(env, body.name, Number(body.size), origin || siteUrl(env));
          return res.error ? json({ error: res.error }, res.status || 400) : json(res);
        }

        if (path === "/api/kurs") {
          if (!user.admin && limited("kurs" + user.id, 8)) return json({ error: "Du hast gerade viele Kurse erstellt. Bitte warte ein paar Minuten." }, 429);
          const topic = str(body.topic, 120).trim(), notes = str(body.notes, 20000).trim(), fachName = body.fach === "physik" ? "Physik" : "Mathematik";
          const rules = (Array.isArray(body.rules) ? body.rules : []).slice(0, 25).map(r => `## ${str(r.title, 120)} (${str(r.category, 60)})\n${str(r.text, 1200)}`).join("\n\n");
          if (Array.isArray(body.files) && body.files.length && !kursPro) return json({ error: "Eigene Lerndateien hochladen gibt es nur mit Pro.", code: "pro_required" }, 402);
          if (Array.isArray(body.files) && body.files.length > KURS_MAX_FILES) return json({ error: `Höchstens ${KURS_MAX_FILES} Dateien pro Kurs.` }, 400);
          const files = (Array.isArray(body.files) ? body.files : []).slice(0, KURS_MAX_FILES)
            .filter(f => f && /^files\/[\w-]+$/.test(f.name || "")).map(f => ({ name: f.name, mimeType: str(f.mimeType, 60), label: str(f.label, 200) || "Datei" }));
          if (!topic && !files.length && !notes) return json({ error: "Wähle ein Thema oder lade Unterlagen hoch." }, 400);
          return slowJson(cors, async () => {
            try {
              const ready = await waitFiles(env, files), parts = [];
              if (topic) parts.push({ text: "Thema: " + topic });
              if (rules) parts.push({ text: "Regeln aus dem Regelheft:\n" + rules });
              for (const f of ready) { parts.push({ text: (f.mimeType.startsWith("image/") ? "Bild: " : "Datei: ") + f.label }); parts.push({ fileData: { fileUri: f.uri, mimeType: f.mimeType } }); }
              if (notes) parts.push({ text: "Eigene Notizen:\n" + notes });
              parts.push({ text: "Erstelle jetzt den Kurs aus diesen Unterlagen." });
              return cleanKurs(await geminiKurs(env, kursSystem(fachName), parts), topic || "Mein Kurs");
            } finally { await dropFiles(env, files); }   // hochgeladene Dateien bei Google gleich wieder löschen
          }, env);
        }

        if (path === "/api/karten") {
          if (!user.admin && limited("karten" + user.id, 20)) return json({ error: "Du hast gerade viele Karten erstellt. Bitte warte ein paar Minuten." }, 429);
          const n = Math.min(20, Math.max(3, parseInt(body.count, 10) || 10)), art = ["aufgaben", "begriffe"].includes(body.art) ? body.art : "gemischt";
          const fachName = body.fach === "physik" ? "Physik" : "Mathematik", focus = str(body.focus, 200).trim();
          const rules = (Array.isArray(body.rules) ? body.rules : []).slice(0, 40).map(r => "- " + str(r.title, 120) + ": " + str(r.text, 600)).join("\n");
          const cards = (Array.isArray(body.cards) ? body.cards : []).slice(0, 150).map(c => "- " + str(c.front, 200) + " → " + str(c.back, 200)).join("\n");
          const text = "Kurs: " + str(body.title, 120) + "\n\nZusammenfassung:\n" + str(body.summary, 3000) + (rules ? "\n\nRegeln:\n" + rules : "") +
            (cards ? "\n\nSchon vorhandene Karten (nicht wiederholen):\n" + cards : "") + (focus ? "\n\nSchwerpunkt der neuen Karten: " + focus : "");
          return slowJson(cors, async () => {
            const j = await geminiKurs(env, kartenSystem(fachName, n, art), [{ text }], { schema: KARTEN_SCHEMA, tokens: 8000, timeout: 60000, check: j => Array.isArray(j.flashcards) && j.flashcards.length > 0 });
            return { flashcards: j.flashcards.filter(c => c && c.front && c.back).slice(0, n).map(c => ({ front: str(c.front, 300), back: str(c.back, 600), rule: str(c.rule, 120) })) };
          }, env);
        }

        if (!user.admin && limited("tts" + user.id, 40)) return json({ error: "Zu viele Aufnahmen. Bitte warte ein paar Minuten." }, 429);
        const lines = (Array.isArray(body.lines) ? body.lines : []).filter(l => ["Lena", "Max"].includes(l && l.speaker) && String(l.text || "").trim())
          .slice(0, 40).map(l => ({ speaker: l.speaker, text: str(l.text, 800).trim() }));
        if (!lines.length || lines.reduce((n, l) => n + l.text.length, 0) > 6000) return json({ error: "Ungültige Anfrage." }, 400);
        try {
          const r = await geminiSpeak(env, lines, body.calm === true);
          return new Response(r.body, { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
        } catch (e) { return json({ error: e.userMsg + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, e.status || 502); }
      }
      if (POST && path === "/api/ai") {
        if (!user.admin && (!cfg.features.ai || cfg.maintenance.enabled))
          return json({ error: cfg.maintenance.enabled ? cfg.maintenance.message : "Die KI-Aufgabenhilfe ist gerade deaktiviert." }, 503);
        return handleAI(env, user, body, json, cfg);
      }
      if (GET && path === "/api/chats") {
        const rs = await env.DB.prepare("SELECT id, title, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100").bind(user.id).all();
        return json({ chats: rs.results.map(r => ({ cid: r.id.slice(String(user.id).length + 1), title: r.title, updated_at: r.updated_at })) });
      }
      if (GET && path === "/api/chat") {
        const cid = url.searchParams.get("id") || "";
        const c = /^[A-Za-z0-9_-]{4,40}$/.test(cid) ? await env.DB.prepare("SELECT * FROM chats WHERE id = ? AND user_id = ?").bind(user.id + "-" + cid, user.id).first() : null;
        if (!c) return json({ error: "Chat nicht gefunden." }, 404);
        return json({ title: c.title, model: c.model, thumb: c.thumb, updated_at: c.updated_at, messages: JSON.parse(c.messages || "[]"), rule_ids: JSON.parse(c.rule_ids || "[]") });
      }
      if (POST && path === "/api/chat/delete") {
        if (typeof body.chatId === "string" && /^[A-Za-z0-9_-]{4,40}$/.test(body.chatId))
          await env.DB.prepare("DELETE FROM chats WHERE id = ? AND user_id = ?").bind(user.id + "-" + body.chatId, user.id).run();
        return json({ ok: true });
      }

      if (path.startsWith("/api/admin")) {
        if (!user.admin) return json({ error: "Nur für den Admin." }, 403);
        const db = env.DB;
        const ownerOnly = () => user.owner ? null : json({ error: "Nur für den Besitzer." }, 403);
        if (GET && path === "/api/admin/settings") {
          const no = ownerOnly(); if (no) return no;
          const n = async q => (await env.DB.prepare(q).first()).n;
          return json({ settings: cfg, keys: { scher: !!env.SCHER_API_KEY, gemini: !!env.GEMINI_API_KEY, groq: !!env.GROQ_API_KEY },
            system: { stripe: { ready: billingReady(env), secret: !!env.STRIPE_SECRET_KEY, webhook: !!env.STRIPE_WEBHOOK_SECRET, priceMonth: !!(env.STRIPE_PRO_PRICE_MONTH || env.STRIPE_PRICE_MONTH), priceYear: !!(env.STRIPE_PRO_PRICE_YEAR || env.STRIPE_PRICE_YEAR), plusMonth: !!env.STRIPE_PLUS_PRICE_MONTH, plusYear: !!env.STRIPE_PLUS_PRICE_YEAR, siteUrl: !!siteUrl(env) },
              mail: { ready: mailReady(env), provider: env.RESEND_API_KEY ? "Resend" : env.BREVO_API_KEY ? "Brevo" : null, from: !!env.MAIL_FROM },
              google: { ready: googleReady(env), id: !!env.GOOGLE_CLIENT_ID, secret: !!env.GOOGLE_CLIENT_SECRET } },
            priceErrors: env.STRIPE_SECRET_KEY ? await priceErrors(env) : {},
            stats: { proActive: await n("SELECT COUNT(*) AS n FROM subs WHERE (status IN ('active','trialing','past_due') AND period_end > " + Date.now() + ") OR grant_until > " + Date.now()),
              verified: await n("SELECT COUNT(*) AS n FROM emails WHERE verified = 1"), users: await n("SELECT COUNT(*) AS n FROM users") } });
        }
        if (POST && path === "/api/admin/pro") {   // Plus oder Pro schenken / entziehen
          const name = String(body.username || "").trim();
          const t = await env.DB.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE").bind(name).first();
          if (!t) return json({ error: "Diesen Benutzer gibt es nicht." }, 404);
          const plan = body.plan === "plus" ? "plus" : "pro";
          const days = Math.min(3650, Math.max(0, Math.floor(+body.days || 0)));
          const until = body.revoke === true || !days ? 0 : Date.now() + days * 864e5;
          await env.DB.prepare("INSERT INTO subs(user_id, grant_until, grant_plan, updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET grant_until = excluded.grant_until, grant_plan = excluded.grant_plan, updated_at = excluded.updated_at").bind(t.id, until || null, until ? plan : null, Date.now()).run();
          return json({ ok: true, until: until || null, plan: until ? plan : null });
        }
        if (GET && path === "/api/admin/users") {   // Nutzerliste mit Tarif (Suche über ?q=)
          const q = String(url.searchParams.get("q") || "").trim().slice(0, 30).replace(/[%_]/g, "");
          const rs = await env.DB.prepare("SELECT u.id, u.username, u.created_at, e.email FROM users u LEFT JOIN emails e ON e.user_id = u.id " + (q ? "WHERE u.username LIKE ? OR e.email LIKE ? " : "") + "ORDER BY u.id DESC LIMIT 40").bind(...(q ? ["%" + q + "%", "%" + q + "%"] : [])).all();
          const users = [];
          for (const r of rs.results) {
            const st = await proState(env, r.id), rl = await roleOf(env, r.username);
            users.push({ username: r.username, email: r.email || null, created_at: r.created_at, tier: st.pro ? "pro" : st.plus ? "plus" : "free", grant: st.grant, until: st.until, cancelAtEnd: st.cancelAtEnd, staff: rl.admin && !rl.owner, owner: rl.owner });
          }
          return json({ users });
        }
        if (POST && path === "/api/admin/staff") {   // Team-Zugriff aufs Dashboard geben / entziehen (nur Besitzer)
          const no = ownerOnly(); if (no) return no;
          const name = String(body.username || "").trim();
          const t = await env.DB.prepare("SELECT username FROM users WHERE username = ? COLLATE NOCASE").bind(name).first();
          if (!t) return json({ error: "Diesen Benutzer gibt es nicht." }, 404);
          if (isAdmin(env, t.username)) return json({ error: "Das ist der Besitzer." }, 400);
          const rest = (cfg.staff || []).filter(n => n.toLowerCase() !== t.username.toLowerCase());
          const c2 = await saveSettings(env, { ...cfg, staff: body.remove === true ? rest : [...rest, t.username] });
          return json({ ok: true, staff: c2.staff });
        }
        if (POST && path === "/api/admin/settings") {
          const no = ownerOnly(); if (no) return no;
          const clean_ = await saveSettings(env, { ...body.settings, staff: cfg.staff });
          return json({ ok: true, settings: clean_ });
        }
        if (GET && path === "/api/admin/overview") {
          const n = async sql => (await db.prepare(sql).first()).c;
          const all = async sql => (await db.prepare(sql).all()).results;
          return json({
            users: await n("SELECT COUNT(*) c FROM users"), chats: await n("SELECT COUNT(*) c FROM chats"), searches: await n("SELECT COUNT(*) c FROM events WHERE kind='search'"),
            topSearches: await all("SELECT value, COUNT(*) c FROM events WHERE kind='search' GROUP BY value ORDER BY c DESC, MAX(ts) DESC LIMIT 30"),
            topRules: await all("SELECT value, COUNT(*) c FROM events WHERE kind='open' GROUP BY value ORDER BY c DESC LIMIT 15"),
            newUsers: await all("SELECT username, created_at FROM users ORDER BY id DESC LIMIT 15"),
            pro: await n("SELECT COUNT(*) c FROM subs WHERE ((status IN ('active','trialing','past_due') AND period_end > " + Date.now() + ") OR grant_until > " + Date.now() + ")"), staff: user.owner ? cfg.staff : undefined, owner: !!user.owner,
          });
        }
        if (GET && path === "/api/admin/chats") {
          const rs = await db.prepare("SELECT c.id, c.title, c.model, c.updated_at, u.username FROM chats c JOIN users u ON u.id = c.user_id ORDER BY c.updated_at DESC LIMIT 200").all();
          return json({ chats: rs.results });
        }
        if (GET && path === "/api/admin/chat") {
          const c = await db.prepare("SELECT c.*, u.username FROM chats c JOIN users u ON u.id = c.user_id WHERE c.id = ?").bind(url.searchParams.get("id") || "").first();
          if (!c) return json({ error: "Chat nicht gefunden." }, 404);
          return json({ id: c.id, title: c.title, username: c.username, model: c.model, updated_at: c.updated_at, thumb: c.thumb,
            messages: JSON.parse(c.messages || "[]"), rule_ids: JSON.parse(c.rule_ids || "[]") });
        }
      }
      return json({ error: "Nicht gefunden." }, 404);
    } catch (e) {
      return json({ error: "Serverfehler." + (env.DEBUG === "1" ? " [" + e.message + "]" : "") }, 500);
    }
  },
};
