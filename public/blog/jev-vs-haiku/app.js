"use strict";
/* Jev pilot replays. Each <figure class="replay"> gets its own player: condition toggles, a game
   stepper with an optional play-all mode, boards, per-model answer logs, transport, results.
   All times are recorded game time in milliseconds. Data: window.JEV_DATA (site/build.py). */

const D = window.JEV_DATA || {};
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sec = (ms) => (ms / 1000).toFixed(2) + " s";
const clockTxt = (ms) => { const s = Math.max(0, ms) / 1000; return s >= 60 ? `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}` : s.toFixed(1) + " s"; };
const pc = (x, d = 0) => (x == null ? "–" : (100 * x).toFixed(d) + "%");
const p2 = (pm) => (pm / 1000).toFixed(2);
const HOLD = 1500;
const SPEEDS = [0.5, 1, 4, 16, 64, 256];
const ICON = {
  play: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>',
  pause: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor"/></svg>',
  prev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
};

function hiDPI(canvas, w, h) {
  const r = 2;
  canvas.width = w * r; canvas.height = h * r;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(r, 0, 0, r, 0, 0);
  return ctx;
}

/* ---------- one replay figure ---------- */
const PLAYERS = [];
function makeReplay(fig, game) {
  const R = { game, sel: { ...game.defaults }, item: 0, all: true, t: 0, dur: 1, segs: [], playing: false, speed: 1 };
  PLAYERS.push(R);

  // options (segmented toggles with a plain-language line under each)
  if (game.options.length) {
    const opts = el("div", "opts");
    for (const o of game.options) {
      const box = el("div", "opt");
      box.append(el("span", "opt-label", o.label));
      const seg = el("div", "seg");
      seg.setAttribute("role", "radiogroup");
      seg.setAttribute("aria-label", o.label);
      const help = el("p", "help");
      for (const c of o.choices) {
        const b = el("button", "", c.t);
        b.type = "button";
        b.setAttribute("role", "radio");
        b.addEventListener("click", () => { R.sel[o.key] = c.v; refreshOpts(); rebuild(); });
        b._v = c.v;
        seg.append(b);
      }
      box.append(seg, help);
      box._o = o; box._seg = seg; box._help = help;
      opts.append(box);
    }
    fig.append(opts);
    R.optsEl = opts;
  }
  function refreshOpts() {
    if (!R.optsEl) return;
    for (const box of R.optsEl.children) {
      const o = box._o;
      for (const b of box._seg.children) b.setAttribute("aria-checked", String(b._v === R.sel[o.key]));
      box._help.textContent = o.choices.find((c) => c.v === R.sel[o.key]).help;
    }
  }

  // game picker
  const picker = el("div", "picker");
  const prev = el("button", "iconbtn", ICON.prev), next = el("button", "iconbtn", ICON.next);
  prev.type = next.type = "button";
  prev.setAttribute("aria-label", `Previous ${game.unit}`);
  next.setAttribute("aria-label", `Next ${game.unit}`);
  const what = el("div", "what");
  what.setAttribute("aria-live", "polite");
  const stepper = el("div", "stepper");
  stepper.append(prev, next);
  const sw = el("label", "switch");
  const swIn = document.createElement("input");
  swIn.type = "checkbox";
  swIn.checked = true;  // play all games by default
  sw.append(swIn, document.createTextNode(`Play all ${game.units} in a row`));
  picker.append(stepper, what, sw);
  fig.append(picker);
  prev.addEventListener("click", () => go(R.item - 1));
  next.addEventListener("click", () => go(R.item + 1));
  swIn.addEventListener("change", () => { R.all = swIn.checked; rebuild(true); });

  // boards
  const stage = el("div", "stage");
  fig.append(stage);

  // transport
  const tr = el("div", "transport");
  const play = el("button", "play", ICON.play);
  play.type = "button";
  play.setAttribute("aria-label", "Play");
  const scrub = document.createElement("input");
  scrub.type = "range"; scrub.min = 0; scrub.max = 1000; scrub.value = 0; scrub.className = "scrub";
  scrub.setAttribute("aria-label", "Timeline");
  const time = el("span", "time", "0.0 s");
  const speed = el("div", "speed");
  speed.setAttribute("role", "radiogroup");
  speed.setAttribute("aria-label", "Playback speed");
  for (const s of SPEEDS) {
    const b = el("button", "", `${s}×`);
    b.type = "button";
    b.setAttribute("role", "radio");
    b.addEventListener("click", () => { R.speed = s; for (const x of speed.children) x.setAttribute("aria-checked", String(x === b)); });
    b.setAttribute("aria-checked", String(s === 1));
    speed.append(b);
  }
  tr.append(play, scrub, time, speed);
  if (game.overlay) {
    const ov = el("label", "switch");
    const ovIn = document.createElement("input");
    ovIn.type = "checkbox"; ovIn.checked = true;
    ov.append(ovIn, document.createTextNode(game.overlay));
    ovIn.addEventListener("change", () => { R.overlay = ovIn.checked; draw(true); });
    R.overlay = true;
    tr.append(ov);
  }
  fig.append(tr);
  if (game.note) fig.append(el("p", "legend", game.note));
  const results = el("div", "tablewrap");
  fig.append(results);

  play.addEventListener("click", () => { if (R.t >= R.dur) R.t = 0; setPlaying(!R.playing); });
  scrub.addEventListener("input", () => { R.t = (scrub.value / 1000) * R.dur; draw(); });

  function setPlaying(on) {
    R.playing = on;
    play.innerHTML = on ? ICON.pause : ICON.play;
    play.setAttribute("aria-label", on ? "Pause" : "Play");
  }
  function items() { return game.items(R.sel); }
  function go(i) {
    const n = items().length;
    i = Math.max(0, Math.min(n - 1, i));
    if (R.all) { R.t = R.segs[i].off; R.item = i; draw(true); }
    else { R.item = i; rebuild(); }
  }
  function rebuild(keepItem) {
    const its = items();
    R.item = Math.min(R.item, its.length - 1);
    R.view = game.mount(stage, R.sel, R);
    const keys = R.all ? its.map((_, i) => i) : [R.item];
    let off = 0;
    R.segs = keys.map((i) => { const s = { i, off, len: game.len(R.sel, its[i].key) }; off += s.len + HOLD; return s; });
    R.dur = Math.max(1, off - HOLD);
    R.t = R.all && keepItem ? (R.segs[R.item] || R.segs[0]).off : 0;
    R.logItem = -1;
    results.innerHTML = game.summary(R.sel);
    draw(true);
  }
  function locate() {
    let s = R.segs[0];
    for (const x of R.segs) { if (R.t >= x.off) s = x; else break; }
    return { s, local: Math.min(R.t - s.off, s.len) };
  }
  function draw(force) {
    const { s, local } = locate();
    const its = items(), it = its[s.i];
    if (R.all) R.item = s.i;
    what.innerHTML = `<b>${esc(it.label)}</b><span>${esc(it.sub)}</span>`;
    prev.disabled = s.i === 0; next.disabled = s.i === its.length - 1;
    if (R.logItem !== s.i) { game.fillLogs(R.view, R.sel, it.key); R.logItem = s.i; R.logIdx = null; }
    game.draw(R.view, R.sel, it.key, local, R);
    updateLogs(local);
    scrub.value = Math.round((R.t / R.dur) * 1000);
    time.textContent = `${clockTxt(R.t)} / ${clockTxt(R.dur)}`;
  }
  function updateLogs(local) {
    for (const lg of R.view.logs || []) {
      const rows = lg.rows;
      let k = -1;
      for (let i = 0; i < rows.length; i++) { if (rows[i].t <= local) k = i; else break; }
      if (lg.k === k) continue;
      rows.forEach((r, i) => { r.el.classList.toggle("future", i > k); r.el.classList.toggle("cur", i === k); });
      lg.k = k;
      lg.count.textContent = k < 0 ? "nothing yet" : `${rows[k].n ?? k + 1} of ${lg.total ?? rows.length}`;
      if (lg.details.open && k >= 0) rows[k].el.scrollIntoView({ block: "nearest" });
    }
  }
  R.tick = (dt) => {
    if (R.playing) {
      R.t += dt * R.speed;
      if (R.t >= R.dur) { R.t = R.dur; setPlaying(false); }
      draw();
    }
  };
  R.redraw = () => {  // keep open answer logs open across a theme switch
    const open = (R.view.logs || []).map((l) => l.details.open);
    R.view = game.mount(stage, R.sel, R); R.logItem = -1;
    (R.view.logs || []).forEach((l, i) => { l.details.open = !!open[i]; });
    draw(true);
  };
  refreshOpts();
  rebuild();
}

/* board panel with header, canvas or custom body, status line and an answer log */
function panel(stage, name, model, cond, logTitle) {
  const b = el("div", "board");
  b.innerHTML = `<div class="board-head"><span class="key ${model}"></span><span class="name">${esc(name)}</span><span class="cond">${esc(cond)}</span></div>`;
  const body = el("div", "body");
  const status = el("div", "status");
  const det = el("details", "out");
  const count = el("span", "mono", "");
  const sum = el("summary");
  sum.append(document.createTextNode(logTitle + " "), count);
  const log = el("div", "log");
  log.setAttribute("tabindex", "0");
  log.setAttribute("aria-label", logTitle);
  det.append(sum, log);
  b.append(body, status, det);
  stage.append(b);
  return { root: b, body, status, log: { box: log, details: det, count, rows: [], k: null } };
}
function setRows(lg, rows) {
  lg.box.innerHTML = "";
  lg.rows = rows.map((r) => { const d = el("div", "future", r.html); lg.box.append(d); return { t: r.t, n: r.n, el: d }; });
  lg.k = null;
}

/* ---------- Snake ---------- */
const DIRS = ["up", "right", "down", "left"];
const snakeRun = (model, sel) => D.snake.runs.find((r) => r.id === `${model}_${sel.board}_${sel.pace === "turn" ? "turn" : "rt2"}`);
const CAUSE = { wall: "hit the wall", self: "ran into itself", move_cap: "reached the 500-move limit", board_full: "filled the board" };
const SnakeGame = {
  unit: "game", units: "20 games",
  defaults: { board: "facts", pace: "turn" },
  options: [
    { key: "pace", label: "Pace", choices: [
      { v: "turn", t: "Turn-based", help: "The game waits for each answer, so speed does not matter, only the quality of the move." },
      { v: "realtime", t: "Real time (2 moves a second)", help: "The snake moves every 0.5 s whether or not the model has answered. A late answer is thrown away and the snake keeps going straight." }] },
    { key: "board", label: "What the model is told", choices: [
      { v: "facts", t: "Board + move facts", help: "Code adds, for each possible move, whether it is safe, how many steps to the food, and how much room is left. The model still chooses." },
      { v: "raw", t: "Board only", help: "The model sees the board as text and has to work out every move itself." }] },
  ],
  items(sel) {
    const J = snakeRun("jev", sel), H = snakeRun("haiku", sel);
    return Object.keys(J.seeds).map((k, i) => ({ key: k, label: `Game ${i + 1} of 20`,
      sub: `Jev ate ${J.seeds[k].eaten}, Haiku ate ${H.seeds[k].eaten}` }));
  },
  len(sel, k) { return Math.max(snakeRun("jev", sel).seeds[k].end_ms, snakeRun("haiku", sel).seeds[k].end_ms); },
  mount(stage, sel) {
    stage.innerHTML = "";
    const boards = el("div", "boards");
    stage.append(boards);
    const cond = `${sel.pace === "turn" ? "turn-based" : "real time"}, ${sel.board === "facts" ? "with move facts" : "board only"}`;
    const v = { sides: [], logs: [] };
    for (const [model, name] of [["jev", "Jev"], ["haiku", "Haiku"]]) {
      const p = panel(boards, name, model, cond, `${name}'s answers`);
      const c = document.createElement("canvas");
      p.body.append(c);
      p.ctx = hiDPI(c, 320, 320);
      c.setAttribute("role", "img");
      c.setAttribute("aria-label", `${name}'s board`);
      p.model = model;
      v.sides.push(p); v.logs.push(p.log);
    }
    return v;
  },
  fillLogs(v, sel, k) {
    v.sides.forEach((p) => {
      const s = snakeRun(p.model, sel).seeds[k], rows = [];
      s.ticks.forEach((t, i) => {
        const head = `<span class="k">move ${i + 1}</span>`;
        if (!t[7]) { rows.push({ t: t[4], html: `${head}  no answer by the tick: kept going ${DIRS[t[11]]}` }); return; }
        if (p.model === "jev") {
          const probs = t[9].map((x, d) => [DIRS[d], x]).filter((x) => x[1] >= 0).sort((a, b) => b[1] - a[1]);
          rows.push({ t: t[4], html: `${head}  ${sec(t[5])}  ${probs.map(([d, x]) => `${d} ${p2(x)}`).join(" · ")}  confidence ${p2(t[6])}  → ${DIRS[t[8]]}${t[10] ? "" : " (not the oracle's move)"}` });
        } else {
          rows.push({ t: t[4], html: `${head}  ${sec(t[5])}  {"move": "${DIRS[t[8]]}", "confidence": ${p2(t[6])}}${t[10] ? "" : "  (not the oracle's move)"}` });
        }
      });
      for (const [at, d, lat] of s.late) rows.push({ t: at, html: `<span class="k">late</span>  {"move": "${DIRS[d] || "?"}"} arrived after ${sec(lat)}: discarded` });
      rows.sort((a, b) => a.t - b.t);
      setRows(p.log, rows);
    });
  },
  draw(v, sel, k, local) {
    v.sides.forEach((p) => {
      const s = snakeRun(p.model, sel).seeds[k], c = p.ctx, cs = 20;
      let i = -1;
      for (let j = 0; j < s.ticks.length; j++) { if (s.ticks[j][4] <= local) i = j; else break; }
      const done = local >= s.end_ms;
      const t = s.ticks[Math.max(i, 0)];
      let body, food = null;
      if (done) body = s.final_body;
      else { const hi = 2 + Math.max(i, 0); body = s.trail.slice(hi - t[0] + 1, hi + 1).reverse(); food = t[1] >= 0 ? [t[1], t[2]] : null; }
      c.fillStyle = css("--cell-open"); c.fillRect(0, 0, 320, 320);
      c.strokeStyle = css("--grid"); c.lineWidth = 1;
      for (let x = 1; x < 16; x++) { c.beginPath(); c.moveTo(x * cs + 0.5, 0); c.lineTo(x * cs + 0.5, 320); c.moveTo(0, x * cs + 0.5); c.lineTo(320, x * cs + 0.5); c.stroke(); }
      if (food) { c.fillStyle = css("--mine"); c.beginPath(); c.arc(food[0] * cs + 10, food[1] * cs + 10, 6, 0, Math.PI * 2); c.fill(); }
      const ink = css(p.model === "jev" ? "--jev" : "--haiku");
      body.forEach(([x, y], j) => {
        if (x < 0 || y < 0 || x > 15 || y > 15) return;
        c.globalAlpha = j === 0 ? 1 : 0.55;
        c.fillStyle = ink;
        c.fillRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4);
      });
      c.globalAlpha = 1;
      if (body[0] && body[0][0] >= 0 && body[0][0] < 16 && body[0][1] >= 0 && body[0][1] < 16) {  // eye on the head
        c.fillStyle = css("--sheet"); c.beginPath(); c.arc(body[0][0] * cs + 10, body[0][1] * cs + 10, 2.5, 0, Math.PI * 2); c.fill();
      }
      let line1 = `move ${Math.max(i, 0) + 1} · food ${done ? s.eaten : t[3]}`, line2;
      if (done) line2 = `<span class="${s.cause === "move_cap" ? "good" : "bad"}">Game over: ${CAUSE[s.cause] || s.cause} after ${s.moves} moves, ${s.eaten} food</span>`;
      else if (t[7]) line2 = `${DIRS[t[8]]} · confidence ${p2(t[6])} · ${sec(t[5])}`;
      else line2 = `<span class="wait">no answer in time: keeps going ${DIRS[t[11]]}</span>`;
      p.status.innerHTML = `${line1}<br>${line2}`;
    });
  },
  summary(sel) {
    const rows = [["turn", "facts"], ["turn", "raw"], ["realtime", "facts"], ["realtime", "raw"]].map(([pace, board]) => {
      const J = snakeRun("jev", { pace, board }).summary, H = snakeRun("haiku", { pace, board }).summary;
      const on = pace === sel.pace && board === sel.board;
      return `<tr class="${on ? "on" : ""}"><td>${pace === "turn" ? "Turn-based" : "Real time"}, ${board === "facts" ? "facts" : "board only"}</td>
        <td class="num">${J.food_mean.toFixed(1)}</td><td class="num">${H.food_mean.toFixed(1)}</td>
        <td class="num">${pc(J.answered_rate)}</td><td class="num">${pc(H.answered_rate)}</td></tr>`;
    }).join("");
    return `<table><thead><tr><th scope="col">Condition</th><th class="num"><span class="key jev"></span>Jev food</th><th class="num"><span class="key haiku"></span>Haiku food</th><th class="num">Jev on time</th><th class="num">Haiku on time</th></tr></thead><tbody>${rows}</tbody></table>`;
  },
  note: "Each log line is what the model returned for that move, as parsed from the recording (Jev: a probability per direction; Haiku: its JSON answer). The oracle is a shortest-path player used as a reference.",
};

/* ---------- Chess ---------- */
// both colours use the solid glyphs (white ones are filled light and outlined); \uFE0E asks for text, not emoji, rendering
const SOLID = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const BAR = 16;  // px for the evaluation bar plus its gap
const GLYPH = (ch) => SOLID[ch.toLowerCase()] + "\uFE0E";
const TERM = { insufficient_material: "too few pieces left to mate", checkmate: "checkmate", threefold_repetition: "threefold repetition", time: "out of time", ply_cap: "move limit" };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// The recorded games replayed under 30 s + 1 s byo-yomi: same moves and answer times, another clock.
// The models were never told the time, so their play does not depend on it.
const BYO_MAIN = 30000, BYO_PERIOD = 1000;
function byoFlag(g) {  // {i: ply on which a side runs out of time (-1 if none), bank: main time it had left}
  if (g._byo) return g._byo;
  const bank = { jev: BYO_MAIN, haiku: BYO_MAIN };
  g._byo = { i: -1, bank: 0 };
  for (let i = 0; i < g.plies.length; i++) {
    const w = g.plies[i][0], t = g.plies[i][4];
    if (t <= bank[w]) bank[w] -= t;
    else if (t <= bank[w] + BYO_PERIOD) bank[w] = 0;
    else { g._byo = { i, bank: bank[w] }; break; }
  }
  return g._byo;
}
function chessResult(g, clk) {
  const f = clk === "byo" ? byoFlag(g) : { i: -1 };
  if (f.i < 0) return { winner: g.winner, why: TERM[g.termination] || g.termination, plies: g.plies.length, out: null };
  const out = g.plies[f.i][0];
  return { winner: out === "jev" ? "haiku" : "jev", why: `${cap(out)} ran out of time`, plies: f.i, out };
}
const ChessGame = {
  unit: "game", units: "20 games", defaults: { clock: "played" }, overlay: "Engine evaluation",
  options: [{ key: "clock", label: "Clock", choices: [
    { v: "played", t: "As played (10 s + 1 s per move)", help: "Each side starts with 10 s and gains 1 s after every move. Both models answered in under 1 s on average, so neither ran short of time." },
    { v: "byo", t: "30 s, then 1 s per move (byo-yomi)", help: "The same recorded moves under a stricter clock: 30 s each in total, then every move must come within 1 s or the game is lost on time. The models were never told the time, so their moves would not change." }] }],
  items(sel) {
    return D.chess.games.map((g, i) => { const r = chessResult(g, sel.clock);
      return { key: i, label: `Game ${i + 1} of 20`,
        sub: `${cap(g.white)} white, ${cap(g.black)} black · ${r.winner === "draw" ? "draw" : cap(r.winner) + " won"} (${r.why})` }; });
  },
  len(sel, k) {
    const g = D.chess.games[k], f = sel.clock === "byo" ? byoFlag(g) : { i: -1 };
    if (f.i >= 0) return g.plies[f.i][3] + f.bank + BYO_PERIOD + 2500;
    const p = g.plies.at(-1); return p[3] + p[4] + 2500;
  },
  mount(stage) {
    stage.innerHTML = "";
    const wrap = el("div", "chess");
    const left = el("div", "board"), right = el("div");
    const c = document.createElement("canvas");
    left.append(c);
    const ctx = hiDPI(c, 416 + BAR, 416);  // evaluation bar on the left, then the board
    c.setAttribute("role", "img"); c.setAttribute("aria-label", "Chess board");
    const black = el("div", "clock"), white = el("div", "clock"), card = el("div", "movecard");
    const det = el("details", "out"), sum = el("summary"), count = el("span", "mono"), log = el("div", "log");
    sum.append(document.createTextNode("Both models' answers "), count);
    log.setAttribute("tabindex", "0");
    det.append(sum, log);
    right.append(black, white, card, det);
    wrap.append(left, right);
    stage.append(wrap);
    return { ctx, black, white, card, logs: [{ box: log, details: det, count, rows: [], k: null }] };
  },
  fillLogs(v, sel, k) {
    const g = D.chess.games[k], f = sel.clock === "byo" ? byoFlag(g) : { i: -1 }, rows = [{ t: 0, n: g.opening.length, html: `<span class="k">opening</span>  ${g.opening.join(" ")}  (random, from the game's seed)` }];
    g.plies.forEach((p, i) => {
      const n = g.opening.length + i + 1, side = p[0] === g.white ? "white" : "black";
      if (f.i >= 0 && i > f.i) return;
      if (i === f.i) { rows.push({ t: p[3] + f.bank + BYO_PERIOD, n, html: `<span class="k">ply ${n} ${cap(p[0])} (${side})</span>  out of time: its answer took ${sec(p[4])}, with ${sec(f.bank + BYO_PERIOD)} left` }); return; }
      const sf = p[8] == null ? "" : `  Stockfish: lost ${p[8]} cp${p[1] === p[9] ? " (best move)" : `, best ${p[9]}`}`;
      const ans = p[0] === "jev"
        ? `${p[1]}  confidence ${p2(p[7])}  top: ${(p[14] || []).map(([m, x]) => `${m} ${p2(x)}`).join(" · ")}`
        : `{"move": "${p[1]}", "confidence": ${p2(p[7])}}`;
      rows.push({ t: p[3] + p[4], n, html: `<span class="k">ply ${n} ${cap(p[0])} (${side})</span>  ${sec(p[4])}  ${ans}${p[12] ? "  INVALID: random legal move played" : ""}${sf}` });
    });
    setRows(v.logs[0], rows);
    v.logs[0].total = g.opening.length + (f.i >= 0 ? f.i + 1 : g.plies.length);
  },
  draw(v, sel, k, local, R) {
    const g = D.chess.games[k], c = v.ctx, sq = 52;
    const byo = sel.clock === "byo", f = byo ? byoFlag(g) : { i: -1 };
    const start = byo ? BYO_MAIN : g.base * 1000, clock = { white: start, black: start };
    const bank = { jev: BYO_MAIN, haiku: BYO_MAIN }, period = { white: false, black: false };
    let fen = g.start, last = -1, thinking = -1, timedOut = null;
    for (let i = 0; i < g.plies.length; i++) {
      const p = g.plies[i], side = p[0] === g.white ? "white" : "black", who = p[0], el = local - p[3];
      if (local < p[3]) break;
      if (byo) {
        if (i === f.i && el >= bank[who] + BYO_PERIOD) { clock[side] = 0; period[side] = true; timedOut = who; break; }
        if (local < p[3] + p[4]) {
          thinking = i; period[side] = el >= bank[who];
          clock[side] = period[side] ? BYO_PERIOD - (el - bank[who]) : bank[who] - el; break;
        }
        bank[who] = Math.max(0, bank[who] - p[4]); period[side] = bank[who] === 0;
        clock[side] = period[side] ? BYO_PERIOD : bank[who];
      } else {
        if (local < p[3] + p[4]) { thinking = i; clock[side] = p[5] - (local - p[3]); break; }
        clock[side] = p[6] + g.inc * 1000;
      }
      fen = p[11]; last = i;
    }
    const lp = last >= 0 ? g.plies[last] : null, hl = lp ? [lp[2].slice(0, 2), lp[2].slice(2, 4)] : [];
    const rows = fen.split("/");
    c.clearRect(0, 0, 416 + BAR, 416);
    if (R.overlay) {  // Stockfish evaluation bar, white's share from the bottom (logistic on centipawns, as on lichess)
      const cp = lp && lp[10] != null ? lp[10] : 0, white = 1 / (1 + Math.exp(-cp / 250));
      c.fillStyle = "#1C1917"; c.fillRect(0, 0, BAR - 5, 416);
      c.fillStyle = "#FBF8F1"; c.fillRect(0, 416 * (1 - white), BAR - 5, 416 * white);
      c.fillStyle = css("--muted"); c.fillRect(0, 207.5, BAR - 5, 1);  // the level line
      c.strokeStyle = css("--muted"); c.lineWidth = 1; c.strokeRect(0.5, 0.5, BAR - 6, 415);  // outline, so the white share shows on paper
    }
    c.save(); c.translate(BAR, 0);
    for (let r = 0; r < 8; r++) {
      let f = 0;
      for (const ch of rows[r]) {
        const n = /\d/.test(ch) ? +ch : 1;
        for (let j = 0; j < n; j++) {
          const name = "abcdefgh"[f] + (8 - r);
          c.fillStyle = (f + r) % 2 ? css("--dark-sq") : css("--light-sq");
          c.fillRect(f * sq, r * sq, sq, sq);
          if (hl.includes(name)) { c.fillStyle = css("--accent"); c.globalAlpha = 0.28; c.fillRect(f * sq, r * sq, sq, sq); c.globalAlpha = 1; }
          if (!/\d/.test(ch)) {
            c.font = "40px 'Noto Sans Symbols 2', 'Segoe UI Symbol', serif"; c.textAlign = "center"; c.textBaseline = "middle";
            c.fillStyle = ch === ch.toUpperCase() ? "#FBF8F1" : "#1C1917";
            if (ch === ch.toUpperCase()) {  // all-white piece; a soft shadow keeps it visible on light squares
              c.shadowColor = "rgba(28,25,23,.55)"; c.shadowBlur = 3; c.shadowOffsetY = 1;
              c.strokeStyle = "#FBF8F1"; c.lineWidth = 1.4; c.lineJoin = "round"; c.strokeText(GLYPH(ch), f * sq + sq / 2, r * sq + sq / 2 + 2);
            }
            c.fillText(GLYPH(ch), f * sq + sq / 2, r * sq + sq / 2 + 2);
            c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetY = 0;
          }
          f++;
        }
      }
    }
    c.font = "500 10px 'IBM Plex Mono', monospace"; c.textBaseline = "alphabetic"; c.globalAlpha = 0.85;
    for (let i = 0; i < 8; i++) {  // coordinates in the corner squares, so "a1 to e1" can be found
      c.fillStyle = i % 2 ? css("--dark-sq") : css("--light-sq");  // rank 1: a1 is dark, so its label is light
      c.textAlign = "right"; c.fillText("abcdefgh"[i], i * sq + sq - 3, 416 - 4);
      c.fillStyle = i % 2 ? css("--light-sq") : css("--dark-sq");
      c.textAlign = "left"; c.fillText(String(8 - i), 3, i * sq + 12);
    }
    c.globalAlpha = 1;
    c.restore();
    for (const side of ["black", "white"]) {
      const box = v[side], name = g[side], low = clock[side] < 3000;
      box.className = `clock ${name}` + (thinking >= 0 && g.plies[thinking][0] === name ? " thinking" : "") + (low ? " low" : "");
      box.innerHTML = `<span class="who"><span class="key ${name}"></span>${cap(name)} <span class="side">${side}${period[side] ? ", 1 s per move" : ""}${thinking >= 0 && g.plies[thinking][0] === name ? ", thinking" : ""}</span></span><span class="t">${clockTxt(clock[side])}</span>`;
    }
    const res = chessResult(g, sel.clock), over = timedOut || (f.i < 0 && local >= g.plies.at(-1)[3] + g.plies.at(-1)[4]);
    if (over) v.card.innerHTML = `<span class="san">${res.winner === "draw" ? "Draw" : cap(res.winner) + " won"}</span><span>${cap(res.why)}, ${res.plies + g.opening.length} plies</span>`;
    else if (lp) v.card.innerHTML = `<span class="lbl">Last move</span><span class="san">${esc(lp[1])}</span><span>${cap(lp[0])}: ${esc(lp[13] || "")}</span><span>confidence ${p2(lp[7])} · ${sec(lp[4])}</span>` +
      (R.overlay && lp[8] != null ? `<span>Stockfish: lost ${lp[8]} cp${lp[1] === lp[9] ? ", the best move" : `, best was ${esc(lp[9])}`}</span>` : "") +
      (R.overlay && lp[10] != null ? `<span>Position: ${Math.abs(lp[10]) < 25 ? "about level" : `${lp[10] > 0 ? "White" : "Black"} ahead by ${(Math.abs(lp[10]) / 100).toFixed(1)} pawns`}</span>` : "");
    else v.card.innerHTML = `<span class="san">Opening</span><span>${g.opening.join(" ")} (random, from the game's seed)</span>`;
  },
  summary() {
    const s = D.chess.summary, wdl = (n) => {  // won / drawn / lost under the byo-yomi replay
      const r = D.chess.games.filter((g) => [g.white, g.black].includes(n)).map((g) => chessResult(g, "byo").winner);
      return `${r.filter((w) => w === n).length} / ${r.filter((w) => w === "draw").length} / ${r.filter((w) => w !== n && w !== "draw").length}`; };
    const row = (n) => `<tr><td><span class="nw"><span class="key ${n}"></span>${cap(n)}</span></td><td class="num">${s[n].won} / ${s[n].drawn} / ${s[n].lost}</td><td class="num">${wdl(n)}</td><td class="num">${s[n].acpl}</td><td class="num">${pc(s[n].best_rate)}</td><td class="num">${(s[n].latency_p50_ms / 1000).toFixed(2)} s</td></tr>`;
    return `<table><thead><tr><th scope="col">Player</th><th class="num">As played (W / D / L)</th><th class="num">Byo-yomi (W / D / L)</th><th class="num">Avg loss (cp)</th><th class="num">Best move</th><th class="num">Time per move</th></tr></thead><tbody>${row("jev")}${row("haiku")}</tbody></table>`;
  },
  note: "The bar left of the board is Stockfish's evaluation: the more white it shows, the better White stands. Clocks run only while that side's model is answering. The log counts plies (single moves), opening included. W / D / L = won / drawn / lost. cp = centipawns: 100 is one pawn of value lost against Stockfish's best move; best move is how often a model played it.",
};

/* ---------- Minesweeper ---------- */
const msRun = (id) => D.minesweeper.runs.find((r) => r.id === id);
const cellName = (ix) => `r${Math.floor(ix / 16) + 1}c${(ix % 16) + 1}`;
const MinesGame = {
  unit: "game", units: "20 games", defaults: { rival: "haiku", src: "cal" }, overlay: "Show mine probabilities",
  options: [
    { key: "rival", label: "Jev against", choices: [
      { v: "haiku", t: "Haiku", help: "Both models get the board and, for each opened number, its hidden neighbours and how many mines they still hold." },
      { v: "exact", t: "Exact solver", help: "A program that computes every cell's true mine probability: the best any player could do with this information." }] },
    { key: "src", label: "Colour the cells by", choices: [
      { v: "cal", t: "Calibrated probability", help: "The model's answer rescaled by its track record on separate games. The opening rule used this: open every cell at 5% or less." },
      { v: "raw", t: "Model's own number", help: "The probability exactly as the model gave it, before rescaling." },
      { v: "exact", t: "True probability", help: "What the exact solver computed for the same cells: compare with the model's colours." }] },
  ],
  items(sel) {
    const J = msRun("jev"), O = msRun(sel.rival);
    const res = (s) => (s.won ? "won" : `${Math.round(100 * s.revealed_frac)}% cleared`);
    return Object.keys(J.seeds).map((k, i) => ({ key: k, label: `Game ${i + 1} of 20`, sub: `Jev ${res(J.seeds[k])}, ${O.model} ${res(O.seeds[k])}` }));
  },
  len(sel, k) { const end = (s) => { const c = s.calls.at(-1); return c ? c[8] + c[9] : 0; }; return Math.max(end(msRun("jev").seeds[k]), end(msRun(sel.rival).seeds[k])) + 1000; },
  mount(stage, sel) {
    stage.innerHTML = "";
    const boards = el("div", "boards");
    stage.append(boards);
    const v = { sides: [], logs: [] };
    for (const id of ["jev", sel.rival]) {
      const run = msRun(id);
      const p = panel(boards, run.model, id === "exact" ? "exact" : id, id === "exact" ? "reference" : "7 lives, no clock", id === "exact" ? "Solver's probabilities" : `${run.model}'s answers`);
      const c = document.createElement("canvas");
      p.body.append(c);
      p.ctx = hiDPI(c, 320, 320);
      c.setAttribute("role", "img"); c.setAttribute("aria-label", `${run.model}'s board`);
      p.id = id;
      v.sides.push(p); v.logs.push(p.log);
    }
    return v;
  },
  fillLogs(v, sel, k) {
    v.sides.forEach((p) => {
      const s = msRun(p.id).seeds[k], rows = [];
      s.calls.forEach((c, i) => {
        const names = c[1].map(cellName), cal = c[3] || c[2];
        const order = c[1].map((_, j) => j).sort((a, b) => cal[a] - cal[b]);
        let ans;
        if (p.id === "haiku") {
          const shown = order.slice(0, 6).map((j) => `"${names[j]}": ${p2(c[2][j])}`).join(", ");
          ans = `{${shown}${names.length > 6 ? `, … ${names.length - 6} more` : ""}}`;
        } else {
          ans = `lowest: ${order.slice(0, 5).map((j) => `${names[j]} ${p2(c[2][j])}${c[3] ? ` (calibrated ${p2(c[3][j])})` : ""}`).join(" · ")}`;
        }
        const act = c[7] ? `guessed ${cellName(c[5][0])}` : `opened ${c[5].length} cell${c[5].length > 1 ? "s" : ""} at 5% or less`;
        rows.push({ t: c[8] + c[9], html: `<span class="k">call ${i + 1}</span>  ${sec(c[9])}  ${names.length} cells asked  ${ans}  → ${act}${c[6] >= 0 ? `: <b>mine at ${cellName(c[6])}</b>` : ""}` });
      });
      setRows(p.log, rows);
    });
  },
  draw(v, sel, k, local, R) {
    v.sides.forEach((p) => {
      const s = msRun(p.id).seeds[k], c = p.ctx, cs = 20;
      let i = -1;
      for (let j = 0; j < s.calls.length; j++) { if (s.calls[j][8] + s.calls[j][9] <= local) i = j; else break; }
      const grid = i + 1 < s.calls.length ? s.calls[i + 1][0] : s.final, done = i === s.calls.length - 1;
      const flying = !done && local >= s.calls[i + 1][8], last = i >= 0 ? s.calls[i] : null;
      const heat = {};
      if (R.overlay && last && !done) {
        const src = sel.src === "raw" ? last[2] : sel.src === "exact" ? last[4] : (last[3] || last[2]);
        last[1].forEach((ix, j) => { if (src[j] >= 0) heat[ix] = src[j] / 1000; });
      }
      const mines = new Set(s.mines), chosen = new Set(last ? last[5] : []);
      c.fillStyle = css("--cell-open"); c.fillRect(0, 0, 320, 320);
      for (let ix = 0; ix < 256; ix++) {
        const x = (ix % 16) * cs, y = Math.floor(ix / 16) * cs, ch = grid[ix];
        if (ch === "#") {
          let col = css("--cell");
          if (done && mines.has(ix)) col = css("--fg-2");
          c.fillStyle = col; c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          if (ix in heat) {  // probability as a tinted fill: safe green to mine red
            const pr = heat[ix];
            c.fillStyle = pr <= 0.05 ? css("--safe") : css("--mine");
            c.globalAlpha = pr <= 0.05 ? 0.75 : 0.15 + 0.7 * pr;
            c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
            c.globalAlpha = 1;
          }
        } else if (ch === "X") {
          c.fillStyle = css("--mine"); c.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          c.strokeStyle = css("--sheet"); c.lineWidth = 2;
          c.beginPath(); c.moveTo(x + 6, y + 6); c.lineTo(x + 14, y + 14); c.moveTo(x + 14, y + 6); c.lineTo(x + 6, y + 14); c.stroke();
        } else if (ch !== ".") {
          c.fillStyle = css("--fg-2"); c.font = "500 12px 'IBM Plex Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
          c.fillText(ch, x + 10, y + 11);
        }
        if (chosen.has(ix) && !done) { c.strokeStyle = css("--" + p.id); c.lineWidth = 2; c.strokeRect(x + 2, y + 2, cs - 4, cs - 4); }
      }
      const opened = [...grid].filter((g) => g !== "#" && g !== "X").length, lives = last ? last[10] : s.lives;
      let line2;
      if (done) line2 = s.won ? `<span class="good">Won: every safe cell opened in ${clockTxt(s.clock_ms)}</span>` : `<span class="bad">Out of lives with ${Math.round(100 * s.revealed_frac)}% of safe cells opened</span>`;
      else if (flying) line2 = `<span class="wait">thinking about ${s.calls[i + 1][1].length} cells…</span>`;
      else if (last) line2 = (last[7] ? `guessed its lowest cell` : `opened ${last[5].length} cell${last[5].length > 1 ? "s" : ""} rated 5% or less`) + (last[6] >= 0 ? `: <span class="bad">mine</span>` : "");
      else line2 = "starting";
      p.status.innerHTML = `call ${i + 1} of ${s.calls.length} · ${opened} of 216 safe cells · lives ${lives} of ${s.lives}<br>${line2}`;
    });
  },
  summary(sel) {
    const row = (id) => { const r = msRun(id), s = r.summary;
      return `<tr class="${id === "jev" || id === sel.rival ? "on" : ""}"><td><span class="nw"><span class="key ${id}"></span>${r.model}</span></td><td class="num">${pc(s.win_rate)}</td><td class="num">${pc(s.revealed_frac)}</td><td class="num">${s.calls_per_game.toFixed(0)}</td><td class="num">${clockTxt(s.clock_mean_s * 1000)}</td><td class="num">${s.cost_per_game ? "$" + s.cost_per_game.toFixed(3) : "–"}</td></tr>`; };
    return `<table><thead><tr><th scope="col">Player</th><th class="num">Won</th><th class="num">Safe cells opened</th><th class="num">Calls per game</th><th class="num">Time per game</th><th class="num">Cost per game</th></tr></thead><tbody>${row("jev")}${row("haiku")}${row("exact")}</tbody></table>`;
  },
  note: "Green cells: 5% or less (the rule opens these). Red deepens with the chance of a mine. Outlined: the cells the last answer opened. A crossed cell is a mine that was hit; each costs one of 7 lives. In the logs, cells are named by row and column from the top left: r3c12 is row 3, column 12.",
};

/* ---------- Codenames ---------- */
const CN_REVEAL = 1000;
const cnP = (name) => D.codenames.players[name];
const CNGame = {
  unit: "round", units: "100 rounds", defaults: { rival: "haiku" }, overlay: "Show probabilities",
  options: [{ key: "rival", label: "Jev against", choices: [
    { v: "haiku", t: "Haiku", help: "Both guessers get the same 25 words, the clue and its number, and give a probability for every word. Each picks its top words." },
    { v: "random", t: "Random guesser", help: "Picks words at random: the floor any real guesser should beat." }] }],
  items(sel) {
    return D.codenames.rounds.map((r, i) => {
      const J = cnP("jev").rounds[r.id], O = cnP(sel.rival).rounds[r.id];
      return { key: i, label: `Board ${r.board + 1}, clue ${r.clue_no + 1} of 5: “${r.clue}” for ${r.number}`,
        sub: `Jev found ${J[3]} of ${r.number}, ${sel.rival === "haiku" ? "Haiku" : "random"} ${O[3]} of ${r.number}` };
    });
  },
  len(sel, k) { const id = D.codenames.rounds[k].id; return Math.max(cnP("jev").rounds[id][2], cnP(sel.rival).rounds[id][2]) + CN_REVEAL + 2500; },
  mount(stage, sel) {
    stage.innerHTML = "";
    const clue = el("div", "clue");
    const words = el("div", "words");
    const legend = el("div", "legend");
    const rival = sel.rival === "haiku" ? "Haiku" : "Random";
    legend.innerHTML = `<span><span class="key jev"></span>top bar: Jev</span><span><span class="key ${sel.rival}"></span>bottom bar: ${rival}</span><span>outlined bar: picked</span><span>once both have answered, borders show the true colours:</span><span><span class="sw t"></span>own team</span><span><span class="sw o"></span>opponent</span><span><span class="sw n"></span>neutral</span><span><span class="sw a"></span>assassin</span>`;
    const logs = el("div", "boards");
    const v = { clue, tiles: [], logs: [] };
    for (const [name, label] of [["jev", "Jev"], [sel.rival, rival]]) {
      const p = panel(logs, label, name, "", `${label}'s answer`);
      p.root.querySelector(".board-head").remove();
      p.status.remove();
      v.logs.push(p.log);
    }
    for (let i = 0; i < 25; i++) {
      const t = el("div", "word");
      t.innerHTML = `<span class="w"></span><span class="bar a"><i style="background:var(--jev)"></i></span><span class="bar b"><i style="background:var(${sel.rival === "haiku" ? "--haiku" : "--exact"})"></i></span>`;
      words.append(t);
      v.tiles.push(t);
    }
    stage.append(clue, words, legend, logs);
    return v;
  },
  fillLogs(v, sel, k) {
    const r = D.codenames.rounds[k];
    [["jev", 0], [sel.rival, 1]].forEach(([name, j]) => {
      const x = cnP(name).rounds[r.id];
      const top = r.words.map((w, i) => [w, x[0][i]]).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const body = name === "haiku" ? `{${top.map(([w, p]) => `"${w}": ${p2(p)}`).join(", ")}, …}` : top.map(([w, p]) => `${w} ${p2(p)}`).join(" · ");
      setRows(v.logs[j], [{ t: x[2], html: `<span class="k">${sec(x[2])}</span>  ${body}  → picked ${x[1].join(", ")}  (${x[3]} of ${r.number} intended)` }]);
    });
  },
  draw(v, sel, k, local, R) {
    const r = D.codenames.rounds[k], J = cnP("jev").rounds[r.id], O = cnP(sel.rival).rounds[r.id];
    const reveal = local >= Math.max(J[2], O[2]) + CN_REVEAL, rival = sel.rival === "haiku" ? "Haiku" : "Random";
    const st = (x, n) => (local >= x[2] ? `${n} answered in ${sec(x[2])}` : `<span class="wait">${n} thinking…</span>`);
    v.clue.innerHTML = `<span class="c">“${esc(r.clue)}” for ${r.number}</span><span class="mono">${st(J, "Jev")} · ${st(O, rival)}</span>` +
      (reveal ? `<span class="mono">intended: ${r.targets.join(", ")} · Jev ${J[3]} of ${r.number}, ${rival} ${O[3]} of ${r.number}</span>` : "");
    r.words.forEach((w, i) => {
      const t = v.tiles[i];
      t.className = "word" + (reveal ? " c-" + r.colours[i] : "") + (reveal && r.targets.includes(w) ? " intended" : "");
      t.children[0].textContent = w;
      [[J, 1], [O, 2]].forEach(([x, j]) => {
        const bar = t.children[j], show = local >= x[2];
        bar.firstChild.style.width = show && R.overlay ? `${x[0][i] / 10}%` : "0%";
        bar.classList.toggle("picked", show && x[1].includes(w));
      });
    });
  },
  summary(sel) {
    const row = (n, label) => { const s = cnP(n).summary;
      return `<tr class="${n === "jev" || n === sel.rival ? "on" : ""}"><td><span class="nw"><span class="key ${n === "random" ? "exact" : n}"></span>${label}</span></td><td class="num">${pc(s.intended_hit, 1)}</td><td class="num">${pc(s.rounds_all_right)}</td><td class="num">${pc(s.pick_opponent)}</td><td class="num">${s.assassin_rounds}</td><td class="num">${n === "random" ? "–" : sec(s.latency_p50 * 1000)}</td></tr>`; };
    return `<table><thead><tr><th scope="col">Guesser</th><th class="num">Intended words found</th><th class="num">Rounds fully right</th><th class="num">Opponent picks</th><th class="num">Assassin hit</th><th class="num">Time per round</th></tr></thead><tbody>${row("jev", "Jev")}${row("haiku", "Haiku")}${row("random", "Random")}</tbody></table>`;
  },
  note: "The spymaster (Sonnet 5) wrote every clue once, with the words it meant; a guess can be reasonable and still miss them.",
};

/* ---------- wiring ---------- */
const GAMES = { snake: SnakeGame, chess: ChessGame, minesweeper: MinesGame, codenames: CNGame };
let lastNow = null;
function loop(now) {
  const dt = lastNow == null ? 0 : Math.min(100, now - lastNow);
  lastNow = now;
  for (const R of PLAYERS) R.tick(dt);
  requestAnimationFrame(loop);
}
// canvases repaint when the theme changes (the toggle itself belongs to the page: site Nav or index.html)
new MutationObserver(() => { for (const R of PLAYERS) R.redraw(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
if (!D.snake) {
  document.querySelectorAll("figure.replay").forEach((f) => { f.textContent = "Replay data missing: run site/build.py."; });
} else {
  document.querySelectorAll("figure.replay").forEach((f) => makeReplay(f, GAMES[f.dataset.game]));
  requestAnimationFrame(loop);
}
