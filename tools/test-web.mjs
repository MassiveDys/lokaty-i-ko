/*
 * Testy frontendu (bez przeglądarki): logika finansowa, zgodność bazy, kompletność plików.
 * Uruchomienie: node tools/test-web.mjs
 * Wartości referencyjne policzone tools/update_offers.py (calculate_profit).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "web");

await import(new URL("../web/calc.js", import.meta.url).href);
const { calcProfit, evaluate, round2 } = globalThis.LKCalc;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass += 1;
  } else {
    fail += 1;
    failures.push(name + (detail ? " — " + detail : ""));
  }
}

function near(actual, expected, tol = 0.005) {
  return Math.abs(actual - expected) <= tol;
}

/* 1. Zgodność z referencją Pythona (tolerancja 2 gr: Python round() stosuje
   zaokrąglanie bankierskie, UI — handlowe half-up; różnice tylko na granicy grosza) */
const reference = [
  { amount: 50000, rate: 7.0, months: 3, maturity: { gross: 875.0, tax: 166.25, net: 708.75 }, monthly: { gross: 879.14, tax: 167.04, net: 712.1 } },
  { amount: 25000, rate: 7.1, months: 6, maturity: { gross: 887.5, tax: 168.62, net: 718.88 }, monthly: { gross: 898.2, tax: 170.65, net: 727.55 } },
  { amount: 100000, rate: 5.5, months: 12, maturity: { gross: 5500.0, tax: 1045.0, net: 4455.0 }, monthly: { gross: 5613.7, tax: 1066.6, net: 4547.1 } },
  { amount: 5000, rate: 6.8, months: 2, maturity: { gross: 56.67, tax: 10.77, net: 45.9 }, monthly: { gross: 56.8, tax: 10.79, net: 46.01 } },
  { amount: 12345.67, rate: 5.85, months: 5, maturity: { gross: 300.93, tax: 57.18, net: 243.75 }, monthly: { gross: 303.31, tax: 57.64, net: 245.67 } },
  { amount: 200000, rate: 7.0, months: 3.5, maturity: { gross: 4083.33, tax: 775.83, net: 3307.5 }, monthly: { gross: 4100.1, tax: 779.02, net: 3321.08 } },
];

for (const testCase of reference) {
  for (const [capitalization, expected] of [["at_maturity", testCase.maturity], ["monthly", testCase.monthly]]) {
    const res = calcProfit(testCase.amount, testCase.rate, testCase.months, capitalization);
    const label = `${testCase.amount} zł @ ${testCase.rate}% / ${testCase.months} mies. (${capitalization})`;
    check("brutto: " + label, near(res.gross, expected.gross), `${res.gross} vs ${expected.gross}`);
    check("podatek: " + label, near(res.tax, expected.tax, 0.02), `${res.tax} vs ${expected.tax}`);
    check("netto: " + label, near(res.net, expected.net, 0.02), `${res.net} vs ${expected.net}`);
    check("kwota końcowa: " + label, near(res.final, testCase.amount + expected.net, 0.02), `${res.final}`);
  }
}

/* 2. Własności ogólne */
const sample = calcProfit(10000, 6, 12, "monthly");
check("netto < brutto", sample.net < sample.gross);
check("podatek = 19% brutto (±1 gr)", Math.abs(sample.tax - sample.gross * 0.19) <= 0.02, `${sample.tax} vs ${sample.gross * 0.19}`);
check("kapitalizacja miesięczna bije na koniec", sample.net > calcProfit(10000, 6, 12, "at_maturity").net);
check("zero miesięcy = brak zysku", calcProfit(10000, 6, 0, "monthly").net === 0);
check("round2 zaokrągla do grosza", round2(1.005) === 1.01 && round2(1.004) === 1.0);

/* 3. evaluate: limity kwoty, minimum, skrócony horyzont */
const offer = {
  id: "x", bank: "Test", name: "Test", type: "lokata", rate: 7, period_months: 12,
  min_amount: 1000, max_amount: 25000, capitalization: "at_maturity",
  conditions: { new_clients_only: false, new_funds_only: false, personal_account_required: false, activity_required: false, details: "" },
  url: "", updated_at: "2026-10-29", status: "active",
};

const capped = evaluate(offer, 50000, 6);
check("capped: kwota liczona = limit", capped.principal === 25000, String(capped.principal));
check("capped: flaga", capped.capped === true);
check("capped: horyzont 6 < okres 12", capped.months === 6 && capped.shortened === true);
check("capped: zysk policzony od limitu", near(capped.net, calcProfit(25000, 7, 6, "at_maturity").net));

const belowMin = evaluate(offer, 500, 12);
check("poniżej minimum = niedostępna", belowMin.tooSmall === true);

const full = evaluate(offer, 10000, 12);
check("pełny okres", full.months === 12 && full.shortened === false && full.capped === false);
check("stopa netto w skali roku < stawka brutto", full.effective < 7 && full.effective > 5, String(full.effective));

/* 4. Baza ofert: JSON = kopia seed, poprawne rekordy */
const jsonData = JSON.parse(fs.readFileSync(path.join(root, "data", "offers.json"), "utf8"));
const webData = JSON.parse(fs.readFileSync(path.join(web, "data", "offers.json"), "utf8"));
const seedSource = fs.readFileSync(path.join(web, "data", "offers-data.js"), "utf8");

check("web/data/offers.json = data/offers.json", JSON.stringify(jsonData) === JSON.stringify(webData));
check("seed zawiera 22 oferty", (seedSource.match(/"id":/g) || []).length === jsonData.offers.length);
check("seed ma window.LK_OFFERS_SEED", seedSource.includes("window.LK_OFFERS_SEED"));
check("baza ma >= 15 ofert", jsonData.offers.length >= 15, String(jsonData.offers.length));

const ids = new Set();
let invalid = 0;
for (const item of jsonData.offers) {
  if (ids.has(item.id)) invalid += 1;
  ids.add(item.id);
  if (!(item.rate > 0 && item.period_months > 0 && item.min_amount >= 0)) invalid += 1;
  if (!["lokata", "konto_oszczednosciowe"].includes(item.type)) invalid += 1;
  if (!["monthly", "at_maturity"].includes(item.capitalization)) invalid += 1;
  if (item.max_amount != null && item.max_amount <= item.min_amount) invalid += 1;
}
check("baza bez błędów strukturalnych", invalid === 0, `${invalid} błędów`);

/* 5. Pliki i referencje w index.html */
const html = fs.readFileSync(path.join(web, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
for (const ref of refs) {
  check("istnieje plik: " + ref, fs.existsSync(path.join(web, ref)));
}
for (const file of ["style.css", "app.js", "calc.js", "sw.js", "manifest.webmanifest", "icon.svg", "icon-maskable.svg"]) {
  check("istnieje plik: " + file, fs.existsSync(path.join(web, file)));
}

const app = fs.readFileSync(path.join(web, "app.js"), "utf8");
check("app.js nie używa frameworków", !/from\s+["'](react|vue|svelte|jquery)/i.test(app));
check("app.js nie ładuje CDN", !/https?:\/\/(unpkg|cdn|fonts\.googleapis)/i.test(app));
check("sw.js cache zawiera index.html", fs.readFileSync(path.join(web, "sw.js"), "utf8").includes('"./index.html"'));

/* Podsumowanie */
console.log("=".repeat(62));
console.log(`Testy frontendu: ${pass} PASS, ${fail} FAIL`);
if (failures.length) {
  console.log("\nNiepowodzenia:");
  failures.forEach((item) => console.log(" - " + item));
}
console.log("=".repeat(62));
process.exit(fail === 0 ? 0 : 1);
