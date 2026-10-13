/* Shared helpers: API call + ranking. Loaded by index.html and leaderboard.html. */
const Quiz = (() => {
  const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
  const parseDate = s => Date.parse(String(s || "").replace(/(\.\d{3})\d+/, "$1")) || 0;

  async function api(payload) {
    const r = await fetch(QUIZ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Api-Token": QUIZ_API_KEY },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }

  // Most correct answers wins, then least time spent on correct answers, then earliest finish.
  const cmp = (a, b) => b.correct - a.correct || a.time - b.time || a.fin - b.fin;

  // One entry per player (their best attempt), ranked. Equal score and time share a rank.
  function standings(rows) {
    const best = new Map();
    const attempts = new Map();
    (rows || []).forEach(r => {
      const o = { ...r, correct: num(r.correct), wrong: num(r.wrong), points: num(r.points),
                  time: num(r.time), attempt: num(r.attempt), fin: parseDate(r.finished) };
      const k = o.key || o.rid;
      attempts.set(k, (attempts.get(k) || 0) + 1);
      const c = best.get(k);
      if (!c || cmp(o, c) < 0) best.set(k, o);
    });
    const list = [...best.values()].sort(cmp);
    list.forEach((p, i) => {
      p.played = attempts.get(p.key || p.rid);
      p.rank = i && list[i - 1].correct === p.correct && list[i - 1].time === p.time ? list[i - 1].rank : i + 1;
    });
    return list;
  }

  const fmtTime = s => (num(s)).toFixed(1) + "s";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ordinal = n => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

  // Personal / free / disposable mail providers are not accepted. Mirrored (shorter) in the recipe.
  const PERSONAL = /^(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|passport|icloud|me|mac|aol|aim|proton|protonmail|pm|gmx|mail|email|inbox|fastmail|hey|tutanota|tuta|hushmail|zoho|yandex|rediffmail|qq|163|126|sina|naver|daum|web|t-online|orange|free|libero|att|sbcglobal|verizon|comcast|btinternet|bellsouth|cox|rogers|shaw|mailinator|guerrillamail|10minutemail|tempmail|yopmail|trashmail|sharklasers|getnada|maildrop|dispostable)\.[a-z.]+$/i;
  function workEmailProblem(email) {
    const e = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return "Enter a valid email address.";
    const domain = e.split("@")[1];
    if (PERSONAL.test(domain)) return "Use your company email address. Personal email providers such as Gmail, Hotmail or Yahoo are not accepted.";
    return "";
  }

  return { api, standings, fmtTime, esc, ordinal, workEmailProblem, num };
})();
