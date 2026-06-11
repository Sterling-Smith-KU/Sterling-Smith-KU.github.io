/* =========================================================================
   BlindSpots 2026 — app logic. No dependencies.

   State lives in the URL hash (#p=therapist&v=day&d=2026-06-10) so any
   moment of the site is shareable as a plain link. The chosen profession
   is also kept in localStorage so returning visitors skip the gate.
   ========================================================================= */

(() => {
  "use strict";

  const YEAR = 2026;
  const STORE_KEY = "blindspots.profession";
  const DOWS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // Day-chip palette, in the spirit of the reference calendar.
  const PALETTE = [
    "#e8b13c", "#4f86c6", "#e2845c", "#16284f", "#f0d33f", "#cf4f3e",
    "#edc788", "#a93644", "#bfe3e0", "#cfc8bd", "#c2b280", "#9aa37f",
    "#5d2114", "#f3ec86", "#6a6fc3", "#5fae57", "#5f7470", "#df6e34",
    "#8a3bb3", "#dcdcd6", "#3f8f7f", "#a3d977", "#2f7d32", "#8fd3f4",
    "#d9b3e6", "#566e1f", "#c84b85", "#4a3327", "#23272b", "#7a9e3b",
    "#d0e8c0", "#b65c2e", "#88b6e0", "#f2a93b", "#7f4fc9", "#46b1a1",
    "#94322a", "#3b5ba5", "#d8c451", "#b34f73"
  ];

  const professions = (window.BLINDSPOTS || []).slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const $ = (sel) => document.querySelector(sel);
  const app = $("#app");

  // ---- State -------------------------------------------------------------
  const state = { prof: null, view: "day", date: defaultDate() };

  function defaultDate() {
    const now = new Date();
    if (now.getFullYear() === YEAR) return new Date(YEAR, now.getMonth(), now.getDate());
    return new Date(YEAR, 0, 1);
  }

  // ---- Date helpers --------------------------------------------------------
  const clampDate = (d) => {
    if (d.getFullYear() < YEAR) return new Date(YEAR, 0, 1);
    if (d.getFullYear() > YEAR) return new Date(YEAR, 11, 31);
    return d;
  };
  const addDays = (d, n) => clampDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
  const dayOfYear = (d) => Math.round((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromIso = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : clampDate(d);
  };
  const ordinal = (n) => {
    const s = ["TH", "ST", "ND", "RD"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const longDate = (d) =>
    d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // ---- Per-day assignments -------------------------------------------------
  const dayColor = (d) => PALETTE[(dayOfYear(d) * 11 + 7) % PALETTE.length];

  function dayStat(d) {
    const p = professions.find((x) => x.id === state.prof);
    if (!p) return null;
    const profIdx = professions.indexOf(p);
    return p.stats[(dayOfYear(d) * 3 + profIdx) % p.stats.length];
  }

  // Perceived luminance, for picking light or dark text on a chip.
  function isDark(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.56;
  }

  // ---- URL hash sync ---------------------------------------------------------
  function readHash() {
    const q = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
    const p = q.get("p");
    if (p && professions.some((x) => x.id === p)) state.prof = p;
    const v = q.get("v");
    if (["day", "week", "month", "year"].includes(v)) state.view = v;
    const d = fromIso(q.get("d"));
    if (d) state.date = d;
  }

  function writeHash() {
    const q = new URLSearchParams();
    if (state.prof) q.set("p", state.prof);
    q.set("v", state.view);
    q.set("d", iso(state.date));
    history.replaceState(null, "", "#" + q.toString());
  }

  // ---- SVG charts -------------------------------------------------------------
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtNum = (v) => Math.abs(v) >= 1000 ? v.toLocaleString("en-US") : String(v);
  const fmtVal = (v, unit) => {
    unit = unit || "";
    if (unit.startsWith("$")) return "$" + fmtNum(v) + unit.slice(1);
    return fmtNum(v) + (/^[a-z]/i.test(unit) && unit.length > 2 ? " " + unit : unit);
  };

  function chartDonut(c) {
    const W = 480, H = 230, R = 78, CX = W / 2, CY = H / 2, SW = 20;
    const circ = 2 * Math.PI * R;
    // Percent-like values fill proportionally; other magnitudes show a full ring.
    const frac = c.unit === "%" ? Math.min(Math.max(c.value, 0), 100) / 100 : 0.72;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.caption || "")}">
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="${SW}"/>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="currentColor" stroke-width="${SW}"
        stroke-linecap="round" stroke-dasharray="${(frac * circ).toFixed(1)} ${circ.toFixed(1)}"
        transform="rotate(-90 ${CX} ${CY})"/>
      <text x="${CX}" y="${CY - 2}" text-anchor="middle" font-family="Fraunces, serif" font-size="40" font-weight="600" fill="currentColor">${esc(fmtVal(c.value, c.unit))}</text>
      <text x="${CX}" y="${CY + 26}" text-anchor="middle" font-size="12" fill="currentColor" opacity=".75">${esc(c.unit === "%" ? "of the whole" : "")}</text>
    </svg>`;
  }

  function chartBar(c) {
    const rows = c.labels.length;
    const W = 480, ROW = 56, PAD = 8, H = rows * ROW + PAD;
    const min = Math.min(0, ...c.values), max = Math.max(0, ...c.values);
    const span = (max - min) || 1;
    const x0 = ((0 - min) / span) * (W - 120) + 10; // baseline x
    let out = "";
    c.values.forEach((v, i) => {
      const y = PAD + i * ROW;
      const len = (Math.abs(v) / span) * (W - 120);
      const bx = v >= 0 ? x0 : x0 - len;
      out += `
      <text x="10" y="${y + 12}" font-size="12" font-weight="600" fill="currentColor" opacity=".8">${esc(c.labels[i])}</text>
      <rect x="${bx}" y="${y + 20}" width="${Math.max(len, 3).toFixed(1)}" height="18" rx="9" fill="currentColor" opacity="${v >= 0 ? ".9" : ".55"}"/>
      <text x="${(v >= 0 ? bx + Math.max(len, 3) + 8 : bx - 8).toFixed(1)}" y="${y + 34}" font-size="13" font-weight="700"
        text-anchor="${v >= 0 ? "start" : "end"}" fill="currentColor">${esc(fmtNum(v))}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.caption || "")}">${out}</svg>`;
  }

  function chartLine(c) {
    const W = 480, H = 220, L = 36, R = 24, T = 30, B = 36;
    const n = c.values.length;
    const min = Math.min(...c.values), max = Math.max(...c.values);
    const span = (max - min) || 1;
    const px = (i) => L + (i / (n - 1)) * (W - L - R);
    const py = (v) => T + (1 - (v - min) / span) * (H - T - B);
    const pts = c.values.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
    const area = `${L},${H - B} ${pts} ${px(n - 1).toFixed(1)},${H - B}`;
    let marks = "";
    c.values.forEach((v, i) => {
      marks += `
      <circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="4.5" fill="currentColor"/>
      <text x="${px(i).toFixed(1)}" y="${(py(v) - 12).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">${esc(fmtNum(v))}</text>
      <text x="${px(i).toFixed(1)}" y="${H - 12}" text-anchor="middle" font-size="11.5" fill="currentColor" opacity=".7">${esc(c.labels[i])}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.caption || "")}">
      <polygon points="${area}" fill="currentColor" opacity=".12"/>
      <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${marks}
    </svg>`;
  }

  const chart = (c) => c.type === "donut" ? chartDonut(c) : c.type === "line" ? chartLine(c) : chartBar(c);

  // ---- Shared pieces -------------------------------------------------------
  function navRow(main, sub, onPrevNext) {
    return `
    <div class="navrow">
      <button class="navrow__btn" data-nav="-1" type="button" aria-label="Previous ${esc(onPrevNext)}">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="navrow__title">
        <div class="navrow__main">${esc(main)}</div>
        ${sub ? `<div class="navrow__sub">${esc(sub)}</div>` : ""}
      </div>
      <button class="navrow__btn" data-nav="1" type="button" aria-label="Next ${esc(onPrevNext)}">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`;
  }

  function statCard(d, lightCard) {
    const s = dayStat(d);
    if (!s) return "";
    const p = professions.find((x) => x.id === state.prof);
    const tone = s.tone === "bright" ? "Bright spot" : "Blind spot";
    const idx = p.stats.indexOf(s) + 1;
    return `
    <article class="statcard${lightCard ? " on-light-card" : ""}">
      <div class="statcard__top">
        <span class="statcard__tone">${tone}</span>
        <span class="statcard__kicker">No. ${idx} / ${p.stats.length}</span>
      </div>
      <h2 class="statcard__title">${esc(s.t)}</h2>
      <div class="statcard__chart">${chart(s.chart)}</div>
      <p class="statcard__caption">${esc(s.chart.caption || "")}</p>
      <p class="statcard__text">${esc(s.s)}</p>
      <hr class="statcard__rule"/>
      <div class="statcard__foot">
        <span class="statcard__date">${esc(longDate(d))}</span>
        <a class="statcard__src" href="${esc(s.src.u)}" target="_blank" rel="noopener">
          Source: ${esc(s.src.n)}
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
    </article>`;
  }

  // ---- Views ------------------------------------------------------------------
  function renderDay() {
    const d = state.date;
    const color = dayColor(d);
    const dark = isDark(color);
    const p = professions.find((x) => x.id === state.prof);
    document.body.style.setProperty("--daycolor", color);
    document.body.classList.toggle("on-dark", dark);
    app.innerHTML = `
      ${navRow(`${MONTHS[d.getMonth()]} ${YEAR}`, "", "day")}
      <section class="dayview" style="color:${dark ? "#fff" : "#1c2430"}">
        <div class="dayview__meta">
          <span class="dayview__year">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            ${YEAR}
          </span>
          <button class="dayview__prof" id="profChip" type="button" title="Switch profession">${esc(p.name)}</button>
        </div>
        <div class="dayview__num">${d.getDate()}</div>
        <div class="dayview__month">${MONTHS[d.getMonth()].toUpperCase()}</div>
        ${statCard(d, !dark)}
      </section>`;
    bindNav((dir) => { state.date = addDays(state.date, dir); update(); });
    $("#profChip").addEventListener("click", openGate);
  }

  function renderWeek() {
    const d = state.date;
    // Unclamped on purpose: the week strip may reach into the neighbor year,
    // where days render as disabled placeholders.
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    let chips = "";
    for (let i = 0; i < 7; i++) {
      const cd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const inYear = cd.getFullYear() === YEAR;
      const color = inYear ? dayColor(cd) : "#e7eaef";
      const dark = inYear && isDark(color);
      const sel = inYear && iso(cd) === iso(d);
      chips += `
      <button class="weekday${sel ? " is-selected" : ""}" type="button" ${inYear ? `data-date="${iso(cd)}"` : "disabled"}
        style="background:${color};color:${dark ? "#fff" : "#1c2430"}" aria-label="${esc(longDate(cd))}">
        <span class="weekday__dow">${DOWS[i]}</span>
        <span class="weekday__num">${cd.getDate()}</span>
      </button>`;
    }
    const color = dayColor(d);
    const dark = isDark(color);
    app.innerHTML = `
      ${navRow(`${MONTHS[d.getMonth()]} ${YEAR}`, `Week of ${ordinal(d.getDate())}`, "week")}
      <section class="weekview">
        <div class="weekstrip">${chips}</div>
        <div class="weekview__card" style="background:${color};color:${dark ? "#fff" : "#1c2430"}">
          <div class="weekview__cardmeta">
            <span class="dayview__year">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              ${YEAR}
            </span>
            <button class="dayview__prof" id="profChip" type="button" title="Switch profession">${esc(professions.find((x) => x.id === state.prof).name)}</button>
          </div>
          <div class="weekview__num">${d.getDate()}</div>
          <div class="weekview__month">${MONTHS[d.getMonth()].toUpperCase()}</div>
          ${statCard(d, !dark)}
        </div>
      </section>`;
    bindNav((dir) => { state.date = addDays(state.date, dir * 7); update(); });
    $("#profChip").addEventListener("click", openGate);
    app.querySelectorAll(".weekday[data-date]").forEach((b) =>
      b.addEventListener("click", () => { state.date = fromIso(b.dataset.date); update(); }));
  }

  function monthCells(monthIdx, chipClass, withDows) {
    const first = new Date(YEAR, monthIdx, 1);
    const days = new Date(YEAR, monthIdx + 1, 0).getDate();
    let cells = "";
    for (let i = 0; i < first.getDay(); i++) cells += `<span class="${chipClass} ${chipClass}--empty"></span>`;
    for (let day = 1; day <= days; day++) {
      const cd = new Date(YEAR, monthIdx, day);
      const color = dayColor(cd);
      const dark = isDark(color);
      const sel = iso(cd) === iso(state.date);
      cells += `<button class="${chipClass}${sel ? " is-selected" : ""}" type="button" data-date="${iso(cd)}"
        style="background:${color};color:${dark ? "#fff" : "#1c2430"}" aria-label="${esc(longDate(cd))}">${day}</button>`;
    }
    return cells;
  }

  function renderMonth() {
    const m = state.date.getMonth();
    app.innerHTML = `
      ${navRow(`${MONTHS[m]} ${YEAR}`, "", "month")}
      <section class="monthview">
        <div class="monthpanel">
          <div class="monthpanel__dows">${DOWS.map((x) => `<span class="monthpanel__dow">${x}</span>`).join("")}</div>
          <div class="monthgrid">${monthCells(m, "monthcell", true)}</div>
        </div>
      </section>`;
    bindNav((dir) => {
      const nm = Math.min(11, Math.max(0, m + dir));
      state.date = new Date(YEAR, nm, Math.min(state.date.getDate(), new Date(YEAR, nm + 1, 0).getDate()));
      update();
    });
    bindDayChips();
  }

  function renderYear() {
    let months = "";
    for (let m = 0; m < 12; m++) {
      months += `
      <div class="yearmonth">
        <h3 class="yearmonth__name">${MONTHS[m]}</h3>
        <div class="yearmonth__grid">${monthCells(m, "daychip", false)}</div>
      </div>`;
    }
    app.innerHTML = `
      <section class="yearview">
        <h2 class="yearview__head">${YEAR} Overview</h2>
        <div class="yeargrid">${months}</div>
      </section>`;
    bindDayChips();
  }

  function bindDayChips() {
    app.querySelectorAll("[data-date]").forEach((b) =>
      b.addEventListener("click", () => {
        state.date = fromIso(b.dataset.date);
        state.view = "day";
        update();
      }));
  }

  function bindNav(fn) {
    app.querySelectorAll("[data-nav]").forEach((b) =>
      b.addEventListener("click", () => fn(+b.dataset.nav)));
  }

  // ---- Gate ------------------------------------------------------------------
  const gate = $("#gate"), gateSelect = $("#gateSelect"), gateGo = $("#gateGo");

  function openGate() {
    gateSelect.value = state.prof || "";
    gateGo.disabled = !gateSelect.value;
    gate.hidden = false;
  }

  function initGate() {
    professions.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id; o.textContent = p.name;
      gateSelect.appendChild(o);
    });
    gateSelect.addEventListener("change", () => { gateGo.disabled = !gateSelect.value; });
    gateGo.addEventListener("click", () => {
      if (!gateSelect.value) return;
      state.prof = gateSelect.value;
      try { localStorage.setItem(STORE_KEY, state.prof); } catch (e) {}
      gate.hidden = true;
      update();
    });
  }

  // ---- Top bar ----------------------------------------------------------------
  function initTopbar() {
    document.querySelectorAll(".tab").forEach((t) =>
      t.addEventListener("click", () => { state.view = t.dataset.view; update(); }));
    $("#btnProf").addEventListener("click", openGate);
    $("#brandLink").addEventListener("click", (e) => {
      e.preventDefault();
      state.view = "day"; state.date = defaultDate();
      update();
    });
    $("#btnShare").addEventListener("click", async () => {
      writeHash();
      try {
        await navigator.clipboard.writeText(location.href);
        toast("Link copied. It opens straight to this day.");
      } catch (e) {
        toast(location.href);
      }
    });
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  // ---- Render loop --------------------------------------------------------------
  function update() {
    document.body.className = "view-" + state.view;
    if (state.view !== "day") {
      document.body.style.removeProperty("--daycolor");
      document.body.classList.remove("on-dark");
    }
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("is-active", t.dataset.view === state.view));
    if (!state.prof) { app.innerHTML = ""; openGate(); return; }
    if (state.view === "day") renderDay();
    else if (state.view === "week") renderWeek();
    else if (state.view === "month") renderMonth();
    else renderYear();
    writeHash();
    window.scrollTo({ top: 0 });
  }

  // ---- Boot ---------------------------------------------------------------------
  initGate();
  initTopbar();
  try { state.prof = localStorage.getItem(STORE_KEY) || null; } catch (e) {}
  readHash(); // URL beats storage, so shared links open exactly as sent
  if (state.prof) { try { localStorage.setItem(STORE_KEY, state.prof); } catch (e) {} }
  update();

  window.addEventListener("hashchange", () => { readHash(); update(); });
})();
