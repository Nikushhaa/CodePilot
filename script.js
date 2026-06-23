/* ============================================================
   CodePilot — script.js
   All tool logic for the Developer Toolbox
   ============================================================ */

"use strict";

// ── Tool Registry ────────────────────────────────────────────
const TOOLS = [
  { id: "json",        label: "JSON Formatter",          icon: "{ }",  cat: "Data" },
  { id: "regex",       label: "Regex Tester",            icon: ".*",   cat: "Text" },
  { id: "base64",      label: "Base64 Encode/Decode",    icon: "64",   cat: "Encoding" },
  { id: "password",    label: "Password Generator",      icon: "🔑",   cat: "Security" },
  { id: "uuid",        label: "UUID Generator",          icon: "⬡",   cat: "Generators" },
  { id: "timestamp",   label: "Timestamp Converter",     icon: "⏱",   cat: "Date/Time" },
  { id: "color",       label: "Color Converter",         icon: "🎨",   cat: "CSS" },
  { id: "markdown",    label: "Markdown Preview",        icon: "Md",   cat: "Text" },
  { id: "textcase",    label: "Text Case Converter",     icon: "Aa",   cat: "Text" },
  { id: "url",         label: "URL Encoder/Decoder",     icon: "🔗",   cat: "Encoding" },
  { id: "hash",        label: "Hash Generator",          icon: "#",    cat: "Security" },
  { id: "calc",        label: "Calculator",              icon: "∑",    cat: "Math" },
  { id: "lorem",       label: "Lorem Ipsum Generator",   icon: "¶",    cat: "Generators" },
  { id: "minifier",    label: "Code Minifier",           icon: "⚙",   cat: "Code" },
  { id: "notes",       label: "Notes & Snippets",        icon: "📝",   cat: "Productivity" },
  { id: "diff",        label: "Text Diff Checker",       icon: "≠",    cat: "Text" },
  { id: "numbase",     label: "Number Base Converter",   icon: "01",   cat: "Math" },
  { id: "wordcount",   label: "Word Counter",            icon: "Wc",   cat: "Text" },
  { id: "jwt",         label: "JWT Decoder",             icon: "🔓",   cat: "Security" },
  { id: "htmlentity",  label: "HTML Entity Encoder",     icon: "&",    cat: "Encoding" },
  { id: "cron",        label: "Cron Expression Parser",  icon: "⏲",   cat: "DevOps" },
  { id: "gradient",    label: "CSS Gradient Generator",  icon: "▦",   cat: "CSS" },
  { id: "charmap",     label: "Character Map",           icon: "⌨",   cat: "Text" },
  { id: "string",      label: "String Inspector",        icon: "🔍",   cat: "Text" },
];

let favorites = JSON.parse(localStorage.getItem("cp_favorites") || "[]");
let currentPanel = "home";
let minifyTab = "js";
let calcExpr = "";
let calcHistory = [];
let activeNoteId = null;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  buildSidebar();
  buildHomeGrid();
  updateFavBtn();
  startTimestampClock();
  initRegex();
  initGradient();
  initCharMap();
  initCaseGrid();
  loadNotes();
  generatePassword();
  generateUUID();
  updateGradient();

  document.getElementById("statTools").textContent = TOOLS.length;

  // Keyboard shortcut ⌘K / Ctrl+K → focus search
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("toolSearch").focus();
    }
  });

  document.getElementById("menuBtn").addEventListener("click", openSidebar);
  document.getElementById("sidebarClose").addEventListener("click", closeSidebar);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("favBtn").addEventListener("click", toggleFav);
  document.getElementById("toolSearch").addEventListener("input", filterTools);
});

// ── Sidebar & Navigation ──────────────────────────────────────
function buildSidebar() {
  const nav = document.getElementById("sidebarNav");
  const cats = [...new Set(TOOLS.map(t => t.cat))];
  nav.innerHTML = "";

  // Home link
  const homeLink = document.createElement("a");
  homeLink.className = "nav-item" + (currentPanel === "home" ? " active" : "");
  homeLink.innerHTML = `<span class="nav-icon">⚡</span> Home`;
  homeLink.addEventListener("click", () => navigateTo("home"));
  nav.appendChild(homeLink);

  cats.forEach(cat => {
    const catTools = TOOLS.filter(t => t.cat === cat);
    const group = document.createElement("div");
    group.className = "nav-group";
    group.innerHTML = `<div class="nav-cat">${cat}</div>`;
    catTools.forEach(tool => {
      const a = document.createElement("a");
      a.className = "nav-item" + (currentPanel === tool.id ? " active" : "");
      a.dataset.id = tool.id;
      a.innerHTML = `<span class="nav-icon">${tool.icon}</span> ${tool.label}`;
      a.addEventListener("click", () => navigateTo(tool.id));
      group.appendChild(a);
    });
    nav.appendChild(group);
  });
}

function buildHomeGrid() {
  const grid = document.getElementById("homeGrid");
  grid.innerHTML = "";
  TOOLS.forEach(tool => {
    const card = document.createElement("div");
    card.className = "tool-card";
    card.innerHTML = `
      <div class="tool-card-icon">${tool.icon}</div>
      <div class="tool-card-label">${tool.label}</div>
      <div class="tool-card-cat">${tool.cat}</div>
    `;
    card.addEventListener("click", () => navigateTo(tool.id));
    grid.appendChild(card);
  });
}

function navigateTo(id) {
  document.querySelectorAll(".tool-panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById(`panel-${id}`);
  if (panel) panel.classList.add("active");
  currentPanel = id;
  buildSidebar();
  updateFavBtn();
  closeSidebar();
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("visible");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("visible");
}

function filterTools(e) {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll("#sidebarNav .nav-item[data-id]").forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? "" : "none";
  });
  document.querySelectorAll(".nav-group").forEach(g => {
    const visible = [...g.querySelectorAll(".nav-item")].some(el => el.style.display !== "none");
    g.style.display = visible ? "" : "none";
  });
}

// ── Theme ─────────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  const btn = document.getElementById("themeToggle");
  btn.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  btn.querySelector("span:last-child").textContent = isDark ? "Light Mode" : "Dark Mode";
  localStorage.setItem("cp_theme", isDark ? "light" : "dark");
}

// ── Favorites ─────────────────────────────────────────────────
function toggleFav() {
  if (currentPanel === "home") return;
  const idx = favorites.indexOf(currentPanel);
  if (idx === -1) favorites.push(currentPanel);
  else favorites.splice(idx, 1);
  localStorage.setItem("cp_favorites", JSON.stringify(favorites));
  updateFavBtn();
}

function updateFavBtn() {
  const btn = document.getElementById("favBtn");
  btn.textContent = favorites.includes(currentPanel) ? "♥" : "♡";
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// ── Clipboard helpers ─────────────────────────────────────────
function copyField(id) {
  const el = document.getElementById(id);
  const text = el.value !== undefined ? el.value : el.textContent;
  copyText(text);
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast("Copied!")).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("Copied!");
  });
}

function clearField(inputId, outputId, statusId) {
  document.getElementById(inputId).value = "";
  if (outputId) document.getElementById(outputId).value = "";
  if (statusId) document.getElementById(statusId).textContent = "";
}

// ════════════════════════════════════════════════════════════════
// JSON FORMATTER
// ════════════════════════════════════════════════════════════════
function formatJSON() {
  const input = document.getElementById("jsonInput").value.trim();
  const status = document.getElementById("jsonStatus");
  const output = document.getElementById("jsonOutput");
  try {
    const parsed = JSON.parse(input);
    output.value = JSON.stringify(parsed, null, 2);
    status.textContent = "✓ Valid";
    status.style.color = "var(--green)";
  } catch (e) {
    output.value = "";
    status.textContent = "✗ " + e.message;
    status.style.color = "var(--red)";
  }
}

function minifyJSON() {
  const input = document.getElementById("jsonInput").value.trim();
  const status = document.getElementById("jsonStatus");
  const output = document.getElementById("jsonOutput");
  try {
    output.value = JSON.stringify(JSON.parse(input));
    status.textContent = "✓ Minified";
    status.style.color = "var(--green)";
  } catch (e) {
    status.textContent = "✗ " + e.message;
    status.style.color = "var(--red)";
  }
}

// ════════════════════════════════════════════════════════════════
// REGEX TESTER
// ════════════════════════════════════════════════════════════════
function initRegex() {
  ["regexPattern", "regexFlags", "regexInput"].forEach(id => {
    document.getElementById(id).addEventListener("input", runRegex);
  });
}

function runRegex() {
  const pattern = document.getElementById("regexPattern").value;
  const flags = document.getElementById("regexFlags").value;
  const input = document.getElementById("regexInput").value;
  const status = document.getElementById("regexStatus");
  const highlight = document.getElementById("regexHighlight");
  const matchList = document.getElementById("matchesList");

  if (!pattern) {
    highlight.textContent = input;
    matchList.innerHTML = "";
    status.textContent = "";
    return;
  }

  try {
    const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const matches = [...input.matchAll(re)];
    status.textContent = `${matches.length} match${matches.length !== 1 ? "es" : ""}`;
    status.style.color = matches.length ? "var(--green)" : "var(--yellow)";

    // Highlight
    let html = "";
    let last = 0;
    for (const m of matches) {
      html += escapeHtml(input.slice(last, m.index));
      html += `<mark>${escapeHtml(m[0])}</mark>`;
      last = m.index + m[0].length;
    }
    html += escapeHtml(input.slice(last));
    highlight.innerHTML = html;

    // Match list
    matchList.innerHTML = matches.map((m, i) =>
      `<div class="match-item"><span class="match-idx">${i + 1}</span><code>${escapeHtml(m[0])}</code><span class="match-pos">@${m.index}</span></div>`
    ).join("");
  } catch (e) {
    status.textContent = "✗ " + e.message;
    status.style.color = "var(--red)";
    highlight.textContent = input;
    matchList.innerHTML = "";
  }
}

function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ════════════════════════════════════════════════════════════════
// BASE64
// ════════════════════════════════════════════════════════════════
function encodeBase64() {
  try {
    document.getElementById("b64Output").value = btoa(unescape(encodeURIComponent(document.getElementById("b64Input").value)));
  } catch (e) {
    showToast("Encode error: " + e.message);
  }
}

function decodeBase64() {
  try {
    document.getElementById("b64Output").value = decodeURIComponent(escape(atob(document.getElementById("b64Input").value.trim())));
  } catch (e) {
    showToast("Invalid Base64 input");
  }
}

// ════════════════════════════════════════════════════════════════
// PASSWORD GENERATOR
// ════════════════════════════════════════════════════════════════
function generatePassword() {
  const len = parseInt(document.getElementById("pwLength").value);
  document.getElementById("passwordDisplay").textContent = buildPassword(len);
  document.getElementById("bulkPasswords").style.display = "none";
}

function generatePasswordBulk() {
  const len = parseInt(document.getElementById("pwLength").value);
  const bulk = Array.from({length: 10}, () => buildPassword(len)).join("\n");
  const el = document.getElementById("bulkPasswords");
  el.textContent = bulk;
  el.style.display = "block";
}

function buildPassword(len) {
  const sets = [];
  if (document.getElementById("pwUpper").checked) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (document.getElementById("pwLower").checked) sets.push("abcdefghijklmnopqrstuvwxyz");
  if (document.getElementById("pwNum").checked)   sets.push("0123456789");
  if (document.getElementById("pwSym").checked)   sets.push("!@#$%^&*()_+-=[]{}|;:,.<>?");
  if (!sets.length) return "Select at least one character set";
  const all = sets.join("");
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => all[v % all.length]).join("");
}

// ════════════════════════════════════════════════════════════════
// UUID GENERATOR
// ════════════════════════════════════════════════════════════════
function generateUUID() {
  document.getElementById("uuidDisplay").textContent = uuid4();
  document.getElementById("uuidBulk").style.display = "none";
}

function generateUUIDBulk() {
  const el = document.getElementById("uuidBulk");
  el.textContent = Array.from({length: 10}, uuid4).join("\n");
  el.style.display = "block";
}

function uuid4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 0xf;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ════════════════════════════════════════════════════════════════
// TIMESTAMP CONVERTER
// ════════════════════════════════════════════════════════════════
function startTimestampClock() {
  const el = document.getElementById("tsLive");
  const tick = () => el.textContent = Math.floor(Date.now() / 1000);
  tick();
  setInterval(tick, 1000);
}

function convertTsToDate() {
  const ts = parseInt(document.getElementById("tsToDate").value);
  const el = document.getElementById("tsDateResult");
  if (isNaN(ts)) { el.textContent = "Enter a valid timestamp"; return; }
  const d = new Date(ts * 1000);
  el.innerHTML = `
    <strong>UTC:</strong> ${d.toUTCString()}<br>
    <strong>Local:</strong> ${d.toLocaleString()}<br>
    <strong>ISO:</strong> ${d.toISOString()}
  `;
}

function convertDateToTs() {
  const val = document.getElementById("dateToTs").value;
  const el = document.getElementById("tsResult");
  if (!val) { el.textContent = "Pick a date/time"; return; }
  const ts = Math.floor(new Date(val).getTime() / 1000);
  el.innerHTML = `<strong>Unix:</strong> ${ts}`;
}

// ════════════════════════════════════════════════════════════════
// COLOR CONVERTER
// ════════════════════════════════════════════════════════════════
function colorPickerInput() {
  const hex = document.getElementById("colorPicker").value;
  updateColorOutputs(hex);
}

function parseColorManual() {
  const raw = document.getElementById("colorManual").value.trim();
  let hex;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    hex = raw.length === 4
      ? "#" + [...raw.slice(1)].map(c => c+c).join("")
      : raw;
  } else {
    const m = raw.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/i);
    if (m) hex = rgbToHex(+m[1], +m[2], +m[3]);
    else { showToast("Invalid color format"); return; }
  }
  document.getElementById("colorPicker").value = hex;
  updateColorOutputs(hex);
}

function updateColorOutputs(hex) {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  document.getElementById("colorPreview").style.background = hex;
  document.getElementById("hexVal").textContent = hex.toUpperCase();
  document.getElementById("rgbVal").textContent = `rgb(${r}, ${g}, ${b})`;
  document.getElementById("hslVal").textContent = `hsl(${h}, ${s}%, ${l}%)`;
  document.getElementById("cssVal").textContent = `color: ${hex.toUpperCase()};`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// ════════════════════════════════════════════════════════════════
// MARKDOWN PREVIEW
// ════════════════════════════════════════════════════════════════
function renderMarkdown() {
  const md = document.getElementById("mdInput").value;
  document.getElementById("mdPreview").innerHTML = parseMarkdown(md);
}

function parseMarkdown(md) {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^###### (.+)$/gm, "<h6>$1</h6>")
    .replace(/^##### (.+)$/gm, "<h5>$1</h5>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|o|b|l|p])(.+)$/gm, "<p>$1</p>");
}

// ════════════════════════════════════════════════════════════════
// TEXT CASE CONVERTER
// ════════════════════════════════════════════════════════════════
const CASES = [
  { label: "camelCase",    fn: s => words(s).map((w,i) => i===0 ? w.toLowerCase() : cap(w)).join("") },
  { label: "PascalCase",   fn: s => words(s).map(cap).join("") },
  { label: "snake_case",   fn: s => words(s).map(w => w.toLowerCase()).join("_") },
  { label: "SCREAMING",    fn: s => words(s).map(w => w.toUpperCase()).join("_") },
  { label: "kebab-case",   fn: s => words(s).map(w => w.toLowerCase()).join("-") },
  { label: "dot.case",     fn: s => words(s).map(w => w.toLowerCase()).join(".") },
  { label: "Title Case",   fn: s => words(s).map(cap).join(" ") },
  { label: "UPPERCASE",    fn: s => s.toUpperCase() },
  { label: "lowercase",    fn: s => s.toLowerCase() },
];

function words(s) { return s.replace(/[-_./\s]+/g, " ").replace(/([a-z])([A-Z])/g,"$1 $2").split(" ").filter(Boolean); }
function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }

function initCaseGrid() {
  const grid = document.getElementById("caseGrid");
  grid.innerHTML = CASES.map(c =>
    `<div class="case-item">
      <div class="case-label">${c.label}</div>
      <div class="case-output" id="case-${c.label.replace(/\W/g,"_")}">—</div>
      <button class="btn btn-copy sm" onclick="copyText(document.getElementById('case-${c.label.replace(/\W/g,"_")}').textContent)">⎘</button>
    </div>`
  ).join("");
}

function updateAllCases() {
  const input = document.getElementById("caseInput").value;
  CASES.forEach(c => {
    const el = document.getElementById(`case-${c.label.replace(/\W/g,"_")}`);
    if (el) el.textContent = c.fn(input);
  });
}

// ════════════════════════════════════════════════════════════════
// URL ENCODER / DECODER
// ════════════════════════════════════════════════════════════════
function encodeURL() {
  document.getElementById("urlOutput").value = encodeURIComponent(document.getElementById("urlInput").value);
}

function decodeURL() {
  try {
    document.getElementById("urlOutput").value = decodeURIComponent(document.getElementById("urlInput").value);
  } catch { showToast("Invalid URL encoding"); }
}

// ════════════════════════════════════════════════════════════════
// HASH GENERATOR
// ════════════════════════════════════════════════════════════════
async function generateHashes() {
  const input = document.getElementById("hashInput").value;
  const el = document.getElementById("hashResults");
  if (!input) { el.innerHTML = ""; return; }
  const enc = new TextEncoder().encode(input);
  const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
  el.innerHTML = "<div class='hash-loading'>Computing…</div>";
  const rows = await Promise.all(algos.map(async algo => {
    const buf = await crypto.subtle.digest(algo, enc);
    const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
    return `<div class="hash-row">
      <span class="hash-algo">${algo}</span>
      <code class="hash-val" id="hash-${algo}">${hex}</code>
      <button class="btn btn-copy sm" onclick="copyText('${hex}')">⎘</button>
    </div>`;
  }));
  el.innerHTML = rows.join("");
}

function clearHashes() { document.getElementById("hashResults").innerHTML = ""; }

// ════════════════════════════════════════════════════════════════
// CALCULATOR
// ════════════════════════════════════════════════════════════════
function calcInput(val) {
  const exprEl = document.getElementById("calcExpr");
  const resEl = document.getElementById("calcResult");

  if (val === "AC") { calcExpr = ""; exprEl.textContent = ""; resEl.textContent = "0"; return; }
  if (val === "⌫") { calcExpr = calcExpr.slice(0,-1); exprEl.textContent = calcExpr; return; }
  if (val === "=") {
    try {
      // Safe eval: only allow numbers and operators
      const safe = calcExpr.replace(/[^0-9+\-*/.()%\s]/g, "");
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${safe})`)();
      calcHistory.unshift(`${calcExpr} = ${result}`);
      if (calcHistory.length > 20) calcHistory.pop();
      updateCalcHistory();
      resEl.textContent = result;
      exprEl.textContent = calcExpr;
      calcExpr = String(result);
    } catch { resEl.textContent = "Error"; }
    return;
  }
  calcExpr += val;
  exprEl.textContent = calcExpr;
  try {
    const safe = calcExpr.replace(/[^0-9+\-*/.()%\s]/g, "");
    // eslint-disable-next-line no-new-func
    resEl.textContent = Function(`"use strict"; return (${safe})`)();
  } catch { /* partial input */ }
}

function updateCalcHistory() {
  const el = document.getElementById("calcHistory");
  el.innerHTML = calcHistory.map(h => `<div class="calc-hist-item">${escapeHtml(h)}</div>`).join("");
}

// ════════════════════════════════════════════════════════════════
// LOREM IPSUM
// ════════════════════════════════════════════════════════════════
const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");

function loremWord(i) { return LOREM_WORDS[i % LOREM_WORDS.length]; }

function loremSentence() {
  const len = 8 + Math.floor(Math.random() * 10);
  return Array.from({length: len}, (_,i) => loremWord(Math.floor(Math.random()*LOREM_WORDS.length)))
    .join(" ").replace(/^\w/, c => c.toUpperCase()) + ".";
}

function loremParagraph() {
  return Array.from({length: 4 + Math.floor(Math.random()*3)}, loremSentence).join(" ");
}

function generateLorem() {
  const type = document.getElementById("loremType").value;
  const count = parseInt(document.getElementById("loremCount").value);
  const classic = document.getElementById("loremClassic").checked;
  let result;
  if (type === "words") {
    const ws = Array.from({length: count}, (_,i) => loremWord(i));
    if (classic) ws.splice(0, Math.min(2, count), "Lorem", "ipsum");
    result = ws.join(" ");
  } else if (type === "sentences") {
    const ss = Array.from({length: count}, loremSentence);
    if (classic) ss[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
    result = ss.join(" ");
  } else {
    const pp = Array.from({length: count}, loremParagraph);
    if (classic) pp[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
    result = pp.join("\n\n");
  }
  document.getElementById("loremOutput").textContent = result;
}

// ════════════════════════════════════════════════════════════════
// CODE MINIFIER
// ════════════════════════════════════════════════════════════════
function setMinifyTab(tab) {
  minifyTab = tab;
  document.getElementById("tabJS").classList.toggle("active-tab", tab === "js");
  document.getElementById("tabCSS").classList.toggle("active-tab", tab === "css");
}

function minifyCode() {
  const input = document.getElementById("minifyInput").value;
  const status = document.getElementById("minifyStatus");
  let output;
  if (minifyTab === "js") {
    output = input
      .replace(/\/\/[^\n]*/g, "")                  // single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, "")             // multi-line comments
      .replace(/\s*([=+\-*/<>!&|,;:{}()\[\]])\s*/g, "$1")
      .replace(/\n+/g, "")
      .trim();
  } else {
    output = input
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s*([{};:,>+~])\s*/g, "$1")
      .replace(/\n+/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  const saved = input.length ? Math.round((1 - output.length / input.length) * 100) : 0;
  document.getElementById("minifyOutput").value = output;
  status.textContent = `${saved}% smaller`;
  status.style.color = "var(--green)";
}

// ════════════════════════════════════════════════════════════════
// NOTES & SNIPPETS
// ════════════════════════════════════════════════════════════════
function getNotes() { return JSON.parse(localStorage.getItem("cp_notes") || "{}"); }
function saveNotes(notes) { localStorage.setItem("cp_notes", JSON.stringify(notes)); }

function loadNotes() {
  const notes = getNotes();
  const list = document.getElementById("notesList");
  list.innerHTML = "";
  Object.entries(notes).forEach(([id, note]) => {
    const el = document.createElement("div");
    el.className = "note-item" + (id === activeNoteId ? " active" : "");
    el.textContent = note.title || "Untitled";
    el.dataset.id = id;
    el.addEventListener("click", () => openNote(id));
    list.appendChild(el);
  });
}

function newNote() {
  const id = Date.now().toString();
  const notes = getNotes();
  notes[id] = { title: "", body: "" };
  saveNotes(notes);
  activeNoteId = id;
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteBody").value = "";
  loadNotes();
}

function openNote(id) {
  const notes = getNotes();
  activeNoteId = id;
  document.getElementById("noteTitle").value = notes[id].title;
  document.getElementById("noteBody").value = notes[id].body;
  loadNotes();
}

function saveNote() {
  if (!activeNoteId) { newNote(); return; }
  const notes = getNotes();
  notes[activeNoteId] = {
    title: document.getElementById("noteTitle").value,
    body: document.getElementById("noteBody").value,
  };
  saveNotes(notes);
  loadNotes();
  showToast("Saved!");
}

function deleteNote() {
  if (!activeNoteId) return;
  const notes = getNotes();
  delete notes[activeNoteId];
  saveNotes(notes);
  activeNoteId = null;
  document.getElementById("noteTitle").value = "";
  document.getElementById("noteBody").value = "";
  loadNotes();
}

// ════════════════════════════════════════════════════════════════
// DIFF CHECKER
// ════════════════════════════════════════════════════════════════
function runDiff() {
  const a = document.getElementById("diffA").value.split("\n");
  const b = document.getElementById("diffB").value.split("\n");
  const out = document.getElementById("diffOutput");
  const maxLen = Math.max(a.length, b.length);
  let html = "";
  for (let i = 0; i < maxLen; i++) {
    const la = a[i] ?? "";
    const lb = b[i] ?? "";
    if (la === lb) {
      html += `<div class="diff-line diff-same"> &nbsp;${escapeHtml(la)}</div>`;
    } else {
      if (la !== undefined) html += `<div class="diff-line diff-del">− ${escapeHtml(la)}</div>`;
      if (lb !== undefined) html += `<div class="diff-line diff-add">+ ${escapeHtml(lb)}</div>`;
    }
  }
  out.innerHTML = html || "<em>No differences found.</em>";
}

// ════════════════════════════════════════════════════════════════
// NUMBER BASE CONVERTER
// ════════════════════════════════════════════════════════════════
function convertBase(from) {
  const fields = { dec: 10, bin: 2, oct: 8, hex: 16 };
  const val = document.getElementById(`base${from.charAt(0).toUpperCase()+from.slice(1)}`).value.trim();
  if (!val) { Object.keys(fields).forEach(k => { if(k!==from) document.getElementById(`base${k.charAt(0).toUpperCase()+k.slice(1)}`).value = ""; }); return; }
  const num = parseInt(val, fields[from]);
  if (isNaN(num)) { showToast("Invalid input"); return; }
  document.getElementById("baseDec").value = from === "dec" ? val : num.toString(10);
  document.getElementById("baseBin").value = from === "bin" ? val : num.toString(2);
  document.getElementById("baseOct").value = from === "oct" ? val : num.toString(8);
  document.getElementById("baseHex").value = from === "hex" ? val : num.toString(16).toUpperCase();
}

// ════════════════════════════════════════════════════════════════
// WORD COUNTER
// ════════════════════════════════════════════════════════════════
function updateWordCount() {
  const text = document.getElementById("wcInput").value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSp = text.replace(/\s/g,"").length;
  const lines = text ? text.split("\n").length : 0;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  document.getElementById("wcWords").textContent = words;
  document.getElementById("wcChars").textContent = chars;
  document.getElementById("wcCharsNoSp").textContent = charsNoSp;
  document.getElementById("wcLines").textContent = lines;
  document.getElementById("wcSentences").textContent = sentences;
  document.getElementById("wcRead").textContent = readTime + " min";
}

// ════════════════════════════════════════════════════════════════
// JWT DECODER
// ════════════════════════════════════════════════════════════════
function decodeJWT() {
  const token = document.getElementById("jwtInput").value.trim();
  const parts = token.split(".");
  if (parts.length !== 3) {
    ["jwtHeader","jwtPayload","jwtSig"].forEach(id => document.getElementById(id).textContent = "—");
    return;
  }
  try {
    const decode = part => JSON.stringify(JSON.parse(atob(part.replace(/-/g,"+").replace(/_/g,"/"))), null, 2);
    document.getElementById("jwtHeader").textContent = decode(parts[0]);
    document.getElementById("jwtPayload").textContent = decode(parts[1]);
    document.getElementById("jwtSig").textContent = parts[2];
  } catch { showToast("Invalid JWT"); }
}

// ════════════════════════════════════════════════════════════════
// HTML ENTITY ENCODER
// ════════════════════════════════════════════════════════════════
function encodeHTMLEntities() {
  const s = document.getElementById("htmlEntityInput").value;
  document.getElementById("htmlEntityOutput").value = s
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function decodeHTMLEntities() {
  const s = document.getElementById("htmlEntityInput").value;
  const el = document.createElement("textarea");
  el.innerHTML = s;
  document.getElementById("htmlEntityOutput").value = el.value;
}

// ════════════════════════════════════════════════════════════════
// CRON EXPRESSION PARSER
// ════════════════════════════════════════════════════════════════
function parseCron() {
  const expr = document.getElementById("cronInput").value.trim();
  const el = document.getElementById("cronResult");
  const parts = expr.split(/\s+/);
  if (parts.length !== 5) { el.textContent = "A cron expression needs exactly 5 fields: min hour day month weekday"; return; }
  const [min, hour, dom, month, dow] = parts;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const desc = field => {
    if (field === "*") return "every";
    if (field.includes("/")) { const [,step] = field.split("/"); return `every ${step}`; }
    if (field.includes("-")) { const [a,b] = field.split("-"); return `${a}–${b}`; }
    if (field.includes(",")) return field.split(",").join(", ");
    return field;
  };

  el.innerHTML = `
    <strong>Schedule:</strong><br>
    At minute <em>${desc(min)}</em>,
    hour <em>${desc(hour)}</em>,
    day of month <em>${desc(dom)}</em>,
    month <em>${desc(month)}</em>,
    day of week <em>${desc(dow)}</em>.
  `;

  document.getElementById("cronParts").innerHTML = [
    ["Minute", min, "0–59"],
    ["Hour", hour, "0–23"],
    ["Day of Month", dom, "1–31"],
    ["Month", month, "1–12"],
    ["Day of Week", dow, "0–6 (Sun=0)"],
  ].map(([label, val, range]) =>
    `<div class="cron-part"><span class="cron-label">${label}</span><code class="cron-val">${val}</code><span class="cron-range">${range}</span></div>`
  ).join("");
}

// ════════════════════════════════════════════════════════════════
// CSS GRADIENT GENERATOR
// ════════════════════════════════════════════════════════════════
function initGradient() { updateGradient(); }

function updateGradient() {
  const type = document.getElementById("gradType").value;
  const dir  = document.getElementById("gradDir").value;
  const c1   = document.getElementById("gradColor1").value;
  const c2   = document.getElementById("gradColor2").value;
  let css;
  if (type === "linear")  css = `linear-gradient(${dir}, ${c1}, ${c2})`;
  else if (type === "radial") css = `radial-gradient(circle, ${c1}, ${c2})`;
  else css = `conic-gradient(${c1}, ${c2})`;
  document.getElementById("gradientPreview").style.background = css;
  document.getElementById("gradientCode").textContent = `background: ${css};`;
}

// ════════════════════════════════════════════════════════════════
// CHARACTER MAP
// ════════════════════════════════════════════════════════════════
const CHAR_CATS = {
  "Arrows":    "← → ↑ ↓ ↔ ↕ ⇐ ⇒ ⇑ ⇓ ⇔ ➔ ➜ ➝ ➞ ➟",
  "Math":      "± × ÷ ∑ ∏ √ ∞ ∫ ≈ ≠ ≤ ≥ ∅ ∈ ∉ ∩ ∪ ⊂ ⊃",
  "Currency":  "$ € £ ¥ ₹ ₽ ₿ ¢ ¤ ₩ ₪ ₫ ₡ ₦",
  "Symbols":   "© ® ™ § ¶ • † ‡ ° ′ ″ ‰ … ‹ › « »",
  "Emoji":     "⭐ ❤️ 🔥 ✅ ❌ ⚠️ 💡 🎉 🚀 🔑 🔒 🔓 📝 ⚙️ 🎨",
  "Brackets":  "( ) [ ] { } ⟨ ⟩ ⌈ ⌉ ⌊ ⌋ ⟦ ⟧",
  "Greek":     "α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω",
  "Diacritics":"à á â ã ä å æ ç è é ê ë ì í î ï ð ñ ò ó ô õ ö ø ù ú û ü ý þ ÿ",
};

function initCharMap() {
  const cats = document.getElementById("charCategories");
  cats.innerHTML = Object.keys(CHAR_CATS).map((cat, i) =>
    `<button class="btn btn-ghost sm char-cat-btn${i===0?" active-tab":""}" data-cat="${cat}" onclick="showCharCat('${cat}', this)">${cat}</button>`
  ).join("");
  showCharCat(Object.keys(CHAR_CATS)[0], cats.firstChild);
}

function showCharCat(cat, btn) {
  document.querySelectorAll(".char-cat-btn").forEach(b => b.classList.remove("active-tab"));
  btn.classList.add("active-tab");
  const chars = CHAR_CATS[cat].split(" ");
  document.getElementById("charGrid").innerHTML = chars.map(c =>
    `<button class="char-cell" title="${c}" onclick="selectChar('${c}')">${c}</button>`
  ).join("");
}

function selectChar(c) {
  const el = document.getElementById("charSelected");
  el.innerHTML = `<span class="char-big">${c}</span> <code>U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4,"0")}</code> <button class="btn btn-copy sm" onclick="copyText('${c}')">⎘ Copy</button>`;
}

// ════════════════════════════════════════════════════════════════
// STRING INSPECTOR
// ════════════════════════════════════════════════════════════════
function inspectString() {
  const s = document.getElementById("stringInput").value;
  const stats = document.getElementById("stringStats");
  stats.innerHTML = `
    <div class="stat-box"><span>${s.length}</span><span>Length</span></div>
    <div class="stat-box"><span>${new Blob([s]).size}</span><span>Bytes</span></div>
    <div class="stat-box"><span>${(s.match(/\S+/g)||[]).length}</span><span>Words</span></div>
    <div class="stat-box"><span>${[...new Set(s)].length}</span><span>Unique Chars</span></div>
  `;
}

function transformString(op) {
  const s = document.getElementById("stringInput").value;
  const out = document.getElementById("stringOutput");
  const ops = {
    reverse:    s => [...s].reverse().join(""),
    escape:     s => JSON.stringify(s).slice(1,-1),
    unescape:   s => { try { return JSON.parse(`"${s}"`); } catch { return s; } },
    rot13:      s => s.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))),
    trim:       s => s.trim(),
    removeDups: s => [...new Set(s)].join(""),
    sortLines:  s => s.split("\n").sort().join("\n"),
    dedupLines: s => [...new Set(s.split("\n"))].join("\n"),
  };
  out.textContent = ops[op] ? ops[op](s) : s;
}