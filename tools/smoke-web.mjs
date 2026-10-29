/*
 * Smoke test w prawdziwej przeglądarce (Chrome headless + CDP).
 * Sprawdza render, interakcje (filtry, porównanie, kalkulator, motyw), brak błędów konsoli
 * i brak poziomego przewijania na telefonie. Zapisuje zrzuty ekranu.
 *
 * Uruchomienie (serwer statyczny musi działać na porcie 8765):
 *   python -m http.server 8765 --bind 127.0.0.1   (w katalogu web/)
 *   node tools/smoke-web.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const URL_APP = process.env.APP_URL || "http://127.0.0.1:8765/";
const PORT = 9333;
const OUT_DIR = process.env.OUT_DIR || "D:\\openbot\\build\\lokaty-smoke";
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "lk-chrome-"));
fs.mkdirSync(OUT_DIR, { recursive: true });

let pass = 0;
let fail = 0;
const failures = [];
const consoleErrors = [];

function check(name, condition, detail = "") {
  if (condition) pass += 1;
  else {
    fail += 1;
    failures.push(name + (detail ? " — " + detail : ""));
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(fn, timeout = 15000, interval = 150) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      /* jeszcze niegotowe */
    }
    await sleep(interval);
  }
  throw new Error("Timeout oczekiwania");
}

if (!CHROME) {
  console.error("Nie znaleziono Chrome/Edge.");
  process.exit(2);
}

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--remote-debugging-port=" + PORT,
  "--user-data-dir=" + profile,
  "about:blank",
], { stdio: "ignore" });

let ws;
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + " " + (result.exceptionDetails.exception?.description || ""));
  }
  return result.result.value;
}

async function screenshot(name, width, height, mobile = false) {
  await send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: mobile ? 2 : 1, mobile,
  });
  await sleep(450);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = path.join(OUT_DIR, name);
  fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
  return file;
}

try {
  await waitFor(async () => {
    const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    return response.ok;
  }, 20000);

  const targetResponse = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_APP)}`, { method: "PUT" });
  const target = await targetResponse.json();

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      consoleErrors.push("exception: " + (details.exception?.description || details.text));
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      consoleErrors.push("console.error: " + message.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      consoleErrors.push("log: " + message.params.entry.text);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  await send("Page.navigate", { url: URL_APP });
  await waitFor(async () => (await evaluate("document.readyState")) === "complete");
  await waitFor(async () => (await evaluate("document.querySelectorAll('#cards .card').length")) > 0);

  /* --- render --- */
  const cardCount = await evaluate("document.querySelectorAll('#cards .card').length");
  check("karty ofert wyrenderowane", cardCount >= 15, String(cardCount));
  const topProfit = await evaluate("document.getElementById('topProfit').textContent.trim()");
  check("kalkulator pokazuje zysk", /^\+\s?\d/.test(topProfit), topProfit);
  const summary = await evaluate("document.getElementById('resultSummary').textContent.trim()");
  check("podsumowanie wyników", /ofer/.test(summary), summary);
  const pill = await evaluate("document.getElementById('dataPillText').textContent.trim()");
  check("data bazy w nagłówku", /22 ofert/.test(pill), pill);
  const rateBest = await evaluate("document.getElementById('statBest').textContent.trim()");
  check("najwyższa stawka", /^\d+,\d{2}%$/.test(rateBest), rateBest);
  const bars = await evaluate("document.getElementById('statBanks').textContent.trim()");
  check("liczba banków", Number(bars) >= 10, bars);

  /* --- kalkulator: 50 000 zł na 12 mies. --- */
  await evaluate(`(() => {
    const input = document.getElementById('amount');
    input.value = '50000';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    return true;
  })()`);
  await sleep(350);
  const profit50k = await evaluate("document.getElementById('topProfit').textContent.trim()");
  check("zysk przelicza się po zmianie kwoty", profit50k !== topProfit && /^\+\s?\d/.test(profit50k), profit50k);
  const outAmount = await evaluate("document.getElementById('outAmount').textContent.trim()");
  check("kwota w panelu wyniku", /50\s?000/.test(outAmount), outAmount);
  const amountField = await evaluate("document.getElementById('amount').value");
  check("kwota sformatowana w polu", /50\s?000/.test(amountField), amountField);

  /* --- filtr typu --- */
  await evaluate("document.querySelector('[data-type=\"lokata\"]').click()");
  await sleep(250);
  const lokataCards = await evaluate("document.querySelectorAll('#cards .card').length");
  const lokataCount = Number(await evaluate("document.querySelector('[data-count=\"lokata\"]').textContent"));
  check("filtr Lokaty zawęża listę", lokataCards === lokataCount && lokataCards > 0, `${lokataCards} vs ${lokataCount}`);
  const allLokaty = await evaluate("[...document.querySelectorAll('#cards .type-pill')].every(n => n.textContent.includes('Lokata'))");
  check("filtr Lokaty: brak kont oszcz.", allLokaty === true);

  await evaluate("document.querySelector('[data-type=\"all\"]').click()");
  await sleep(200);

  /* --- filtr warunków --- */
  const beforeCond = await evaluate("document.querySelectorAll('#cards .card').length");
  await evaluate("document.querySelector('[data-cond=\"noAccount\"]').click()");
  await sleep(200);
  const afterCond = await evaluate("document.querySelectorAll('#cards .card').length");
  check("filtr warunków zawęża listę", afterCond > 0 && afterCond <= beforeCond, `${beforeCond} -> ${afterCond}`);
  await evaluate("document.getElementById('resetFilters').click()");
  await sleep(200);
  const afterReset = await evaluate("document.querySelectorAll('#cards .card').length");
  check("reset filtrów przywraca listę", afterReset === beforeCond, `${afterReset} vs ${beforeCond}`);

  /* --- sortowanie --- */
  const profits = await evaluate(`(() => {
    const select = document.getElementById('sort');
    select.value = 'rate';
    select.dispatchEvent(new Event('change'));
    return [...document.querySelectorAll('#cards .rate')].slice(0, 4).map(n => parseFloat(n.textContent.replace(',', '.')));
  })()`);
  check("sortowanie po stawce malejąco", profits.every((v, i, arr) => i === 0 || arr[i - 1] >= v), JSON.stringify(profits));
  await evaluate(`(() => { const s = document.getElementById('sort'); s.value = 'profit'; s.dispatchEvent(new Event('change')); })()`);
  await sleep(150);

  /* --- porównanie 2 ofert --- */
  await evaluate("document.querySelectorAll('[data-compare]')[0].click()");
  await sleep(220);
  await evaluate("document.querySelectorAll('[data-compare]')[1].click()");
  await sleep(260);
  const barVisible = await evaluate("!document.getElementById('compareBar').hidden");
  check("pasek porównania widoczny", barVisible === true);
  const compareEnabled = await evaluate("!document.getElementById('compareOpen').disabled");
  check("przycisk porównania aktywny", compareEnabled === true);
  await evaluate("document.getElementById('compareOpen').click()");
  await sleep(320);
  const dialogOpen = await evaluate("document.getElementById('compareDialog').open");
  const rows = await evaluate("document.querySelectorAll('#compareBody .cmp-table tbody tr').length");
  check("dialog porównania otwarty", dialogOpen === true);
  check("tabela porównania ma wiersze", rows >= 10, String(rows));
  const winBadges = await evaluate("document.querySelectorAll('#compareBody .cmp-win').length");
  check("wskazano lepszą ofertę", winBadges === 1, String(winBadges));
  await send("Page.captureScreenshot", { format: "png" }).then((s) => fs.writeFileSync(path.join(OUT_DIR, "porownanie.png"), Buffer.from(s.data, "base64")));
  await evaluate("document.getElementById('compareDialog').close()");

  /* --- widok tabeli --- */
  await evaluate("document.querySelector('[data-view=\"table\"]').click()");
  await sleep(250);
  check("widok tabeli pokazuje wiersze", (await evaluate("document.querySelectorAll('#tableBody tr').length")) > 0);
  await evaluate("document.querySelector('[data-view=\"cards\"]').click()");
  await sleep(200);

  /* --- wczytywanie pliku JSON (baza lokalna) --- */
  const testBase = path.join(OUT_DIR, "test-offers.json");
  const now = new Date().toISOString().slice(0, 10);
  const testOffers = {
    version: "test",
    last_updated: now,
    currency: "PLN",
    offers: [
      { id: "test-a", bank: "Bank Testowy A", name: "Lokata Testowa 6M", type: "lokata", rate: 8.5, period_months: 6, min_amount: 1000, max_amount: 50000, capitalization: "at_maturity", conditions: { new_clients_only: false, new_funds_only: false, personal_account_required: false, activity_required: false, details: "Oferta testowa." }, url: "https://example.com/a", updated_at: now, status: "active" },
      { id: "test-b", bank: "Bank Testowy B", name: "Konto Testowe", type: "konto_oszczednosciowe", rate: 7.0, period_months: 3, min_amount: 1, max_amount: null, capitalization: "monthly", conditions: { new_clients_only: true, new_funds_only: true, personal_account_required: true, activity_required: true, details: "Oferta testowa 2." }, url: "https://example.com/b", updated_at: now, status: "active" },
      { id: "test-c", bank: "Bank Testowy C", name: "Lokata Testowa 12M", type: "lokata", rate: 6.0, period_months: 12, min_amount: 5000, max_amount: 100000, capitalization: "at_maturity", conditions: { new_clients_only: false, new_funds_only: true, personal_account_required: true, activity_required: false, details: "Oferta testowa 3." }, url: "https://example.com/c", updated_at: now, status: "active" },
    ],
  };
  fs.writeFileSync(testBase, JSON.stringify(testOffers, null, 2));

  await send("DOM.enable");
  const domRoot = (await send("DOM.getDocument", { depth: 1 })).root;
  const fileNode = await send("DOM.querySelector", { nodeId: domRoot.nodeId, selector: "#fileInput" });
  await send("DOM.setFileInputFiles", { files: [testBase], nodeId: fileNode.nodeId });
  await sleep(500);
  const loadedCards = await evaluate("document.querySelectorAll('#cards .card').length");
  check("wczytanie pliku JSON: 3 oferty", loadedCards === 3, String(loadedCards));
  const localPill = await evaluate("document.getElementById('dataPill').classList.contains('is-local')");
  check("oznaczenie bazy lokalnej", localPill === true);
  const restoreVisible = await evaluate("!document.getElementById('restoreData').hidden");
  check("przycisk przywrócenia bazy", restoreVisible === true);
  await evaluate("document.getElementById('restoreData').click()");
  await sleep(500);
  const restoredCards = await evaluate("document.querySelectorAll('#cards .card').length");
  check("przywrócenie bazy domyślnej", restoredCards >= 15, String(restoredCards));

  /* --- motyw --- */
  const themeBefore = await evaluate("document.documentElement.getAttribute('data-theme')");
  await evaluate("document.getElementById('themeBtn').click()");
  await sleep(200);
  const theme = await evaluate("document.documentElement.getAttribute('data-theme')");
  check("przełącznik motywu działa", (theme === "dark" || theme === "light") && theme !== themeBefore, `${themeBefore} -> ${theme}`);
  await evaluate(`document.documentElement.setAttribute('data-theme','dark')`);
  await sleep(120);
  await evaluate("window.scrollTo(0, document.getElementById('oferty').offsetTop - 70)");
  await sleep(400);
  fs.writeFileSync(path.join(OUT_DIR, "karty-ciemne.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  /* --- zrzuty --- */
  await evaluate("window.scrollTo(0, 0)");
  await sleep(250);
  const deskLight = await screenshot("desktop.png", 1440, 1000, false);
  await evaluate("document.documentElement.setAttribute('data-theme','light')");
  const desk2 = await screenshot("desktop-jasny.png", 1440, 1000, false);
  const mobile = await screenshot("mobile.png", 390, 844, true);
  const overflow = await evaluate("document.documentElement.scrollWidth");
  check("brak poziomego przewijania na 390 px", overflow <= 391, String(overflow));
  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 2, mobile: true });
  await sleep(300);
  const overflow360 = await evaluate("document.documentElement.scrollWidth");
  const offenders = await evaluate(`[...document.querySelectorAll('body *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.right > document.documentElement.clientWidth + 1;
  }).slice(0, 5).map(el => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ':' + Math.round(el.getBoundingClientRect().right)).join(', ')`);
  check("brak poziomego przewijania na 360 px", overflow360 <= 361, String(overflow360) + " — " + offenders);
  const layoutInfo = await evaluate(`(() => {
    const g = document.querySelector('.calc-grid');
    const w = document.querySelector('.calc-section');
    return { inner: window.innerWidth, client: document.documentElement.clientWidth, wrap: Math.round(w.getBoundingClientRect().width),
      cols: getComputedStyle(g).gridTemplateColumns, gridW: Math.round(g.getBoundingClientRect().width),
      cardW: Math.round(document.querySelector('.calc-card').getBoundingClientRect().width), mq960: matchMedia('(max-width: 960px)').matches };
  })()`);
  check("układ mobilny kalkulatora", layoutInfo.cols.split(" ").length === 1, JSON.stringify(layoutInfo));
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await sleep(300);
  const mobileTiles = await evaluate("document.querySelectorAll('#cards .card').length");
  check("karty widoczne na telefonie", mobileTiles > 0, String(mobileTiles));
  await evaluate("window.scrollTo(0, document.getElementById('oferty').offsetTop - 60)");
  await sleep(400);
  fs.writeFileSync(path.join(OUT_DIR, "mobile-karty.png"), Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  /* --- tryb offline (service worker) --- */
  await evaluate("document.documentElement.setAttribute('data-theme','dark')");
  await send("Emulation.clearDeviceMetricsOverride");
  const swReady = await waitFor(async () => {
    const controller = await evaluate("navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then(r => r.length)");
    return controller > 0;
  }, 6000).catch(() => 0);
  check("service worker zarejestrowany", swReady > 0, String(swReady));

  check("brak błędów w konsoli", consoleErrors.length === 0, consoleErrors.join(" | "));

  console.log("=".repeat(62));
  console.log(`Smoke test przeglądarki: ${pass} PASS, ${fail} FAIL`);
  if (failures.length) {
    console.log("\nNiepowodzenia:");
    failures.forEach((f) => console.log(" - " + f));
  }
  console.log("Zrzuty: " + [deskLight, desk2, mobile].join(", "));
  console.log("=".repeat(62));
  process.exitCode = fail === 0 ? 0 : 1;
} catch (error) {
  console.error("BŁĄD smoke testu:", error.message);
  if (consoleErrors.length) console.error("Błędy konsoli:", consoleErrors);
  process.exitCode = 1;
} finally {
  try { ws && ws.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
}
