import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "web");

await import(new URL("../web/calc.js", import.meta.url).href);
const { calcProfit, evaluate, round2, BELKA } = globalThis.LKCalc;

let totalChecks = 0;
let passCount = 0;
let failCount = 0;
const failures = [];

function check(category, testName, condition, detail = "") {
  totalChecks += 1;
  if (condition) {
    passCount += 1;
  } else {
    failCount += 1;
    failures.push(`[${category}] ${testName}${detail ? " -> " + detail : ""}`);
  }
}

function near(actual, expected, tol = 0.01) {
  return Math.abs(actual - expected) <= tol;
}

console.log("==============================================================");
console.log("   KOMPLEKSOWY NIEZALEZNY PAKIET TESTOW QA (Codertest)");
console.log("   Porownywarka Lokat i Kont Oszczednosciowych");
console.log("==============================================================");

// ==============================================================
// SEKCJA 1: MATEMATYKA FINANSOWA I PODATKOWA (calc.js)
// ==============================================================
console.log("\n[1/4] Testowanie matematyki finansowej i podatkowej...");

// 1.1 Podatek Belki 19%
check("MATEMATYKA", "Stawka podatku Belki wynosi 19%", BELKA === 0.19);

// 1.2 Zaokraglanie round2 (half-up)
check("MATEMATYKA", "round2(1.005) === 1.01", round2(1.005) === 1.01);
check("MATEMATYKA", "round2(1.004) === 1.00", round2(1.004) === 1.00);
check("MATEMATYKA", "round2(0.000) === 0.00", round2(0.000) === 0.00);
check("MATEMATYKA", "round2(-1.005) === -1.01", round2(-1.005) === -1.01);

// 1.3 Lokaty (kapitalizacja na koniec okresu - at_maturity)
// Wzory niezalezne:
// Gross = Amount * (Rate / 100) * (Months / 12)
// Tax = round2(Gross * 0.19)
// Net = Gross - Tax
const lokataCases = [
  { amount: 10000, rate: 6.0, months: 12, expGross: 600.00, expTax: 114.00, expNet: 486.00 },
  { amount: 50000, rate: 7.0, months: 3, expGross: 875.00, expTax: 166.25, expNet: 708.75 },
  { amount: 25000, rate: 7.1, months: 6, expGross: 887.50, expTax: 168.63, expNet: 718.87 }, // 887.5 * 0.19 = 168.625 -> 168.63
  { amount: 100000, rate: 5.5, months: 12, expGross: 5500.00, expTax: 1045.00, expNet: 4455.00 },
  { amount: 12345.67, rate: 5.85, months: 5, expGross: 300.93, expTax: 57.18, expNet: 243.75 },
  { amount: 1000, rate: 8.0, months: 1, expGross: 6.67, expTax: 1.27, expNet: 5.40 },
  { amount: 500000, rate: 6.5, months: 24, expGross: 65000.00, expTax: 12350.00, expNet: 52650.00 },
];

for (const c of lokataCases) {
  const res = calcProfit(c.amount, c.rate, c.months, "at_maturity");
  const lbl = `${c.amount} PLN, ${c.rate}%, ${c.months}M`;
  check("MATEMATYKA", `Lokata brutto: ${lbl}`, near(res.gross, c.expGross, 0.02), `${res.gross} vs ${c.expGross}`);
  check("MATEMATYKA", `Lokata podatek: ${lbl}`, near(res.tax, c.expTax, 0.02), `${res.tax} vs ${c.expTax}`);
  check("MATEMATYKA", `Lokata netto: ${lbl}`, near(res.net, c.expNet, 0.02), `${res.net} vs ${c.expNet}`);
  check("MATEMATYKA", `Lokata wyplata koncowa: ${lbl}`, near(res.final, c.amount + res.net, 0.02));
  check("MATEMATYKA", `Lokata relacja netto = brutto - podatek: ${lbl}`, near(res.net, res.gross - res.tax, 0.01));
}

// 1.4 Konta oszczednosciowe (kapitalizacja miesieczna - monthly z procentem skladanym)
// Weryfikacja: zysk netto dla KO musi byc wyzszy niz dla lokaty o tych samych parametrach
const koCompareCases = [
  { amount: 10000, rate: 6.0, months: 12 },
  { amount: 50000, rate: 7.0, months: 3 },
  { amount: 25000, rate: 7.1, months: 6 },
  { amount: 100000, rate: 5.5, months: 12 },
];

for (const c of koCompareCases) {
  const resMaturity = calcProfit(c.amount, c.rate, c.months, "at_maturity");
  const resMonthly = calcProfit(c.amount, c.rate, c.months, "monthly");
  const lbl = `${c.amount} PLN, ${c.rate}%, ${c.months}M`;
  check("MATEMATYKA", `KO przewyzsza lokate netto dzieki procentowi skladanemu: ${lbl}`, resMonthly.net > resMaturity.net, `KO: ${resMonthly.net} vs Lokata: ${resMaturity.net}`);
  check("MATEMATYKA", `KO brutto wyzsze niz lokata: ${lbl}`, resMonthly.gross > resMaturity.gross);
  check("MATEMATYKA", `KO relacja netto = final - amount: ${lbl}`, near(resMonthly.net, resMonthly.final - c.amount, 0.01));
}

// 1.5 Wartosci brzegowe i wyjatkowe w calcProfit
check("MATEMATYKA", "Kwota 0 PLN -> net = 0, final = 0", calcProfit(0, 7.0, 3, "at_maturity").net === 0);
check("MATEMATYKA", "Kwota ujemna -> net = 0", calcProfit(-500, 7.0, 3, "at_maturity").net === 0);
check("MATEMATYKA", "Oprocentowanie 0% -> net = 0, final = kwota", calcProfit(10000, 0, 6, "at_maturity").net === 0 && calcProfit(10000, 0, 6, "at_maturity").final === 10000);
check("MATEMATYKA", "Okres 0 miesiecy -> net = 0", calcProfit(10000, 7.0, 0, "at_maturity").net === 0);
check("MATEMATYKA", "Okres ujemny -> net = 0", calcProfit(10000, 7.0, -1, "monthly").net === 0);

// 1.6 Weryfikacja funkcji evaluate (limity kwoty, min_amount, max_amount, skrocony horyzont)
const testOffer = {
  id: "test-lokata-1",
  bank: "Bank Testowy",
  name: "Lokata Promocyjna",
  type: "lokata",
  rate: 7.0,
  period_months: 6,
  min_amount: 1000,
  max_amount: 50000,
  capitalization: "at_maturity",
  conditions: { new_clients_only: false, new_funds_only: false, personal_account_required: false, activity_required: false, details: "" },
  url: "https://example.com",
  updated_at: "2026-10-29",
  status: "active"
};

// Poniżej min_amount
const evalUnderMin = evaluate(testOffer, 500, 6);
check("MATEMATYKA", "evaluate: kwota < min_amount -> tooSmall = true", evalUnderMin.tooSmall === true);

// W przedziale min-max
const evalNormal = evaluate(testOffer, 20000, 6);
check("MATEMATYKA", "evaluate: kwota w limicie -> tooSmall = false, capped = false", evalNormal.tooSmall === false && evalNormal.capped === false);
check("MATEMATYKA", "evaluate: kwota liczona = kwota uzytkownika", evalNormal.principal === 20000);
check("MATEMATYKA", "evaluate: horyzont 6M = okres oferty 6M -> shortened = false", evalNormal.shortened === false);

// Powyżej max_amount
const evalAboveMax = evaluate(testOffer, 80000, 6);
check("MATEMATYKA", "evaluate: kwota > max_amount -> capped = true", evalAboveMax.capped === true);
check("MATEMATYKA", "evaluate: kwota liczona obcieta do max_amount (50000)", evalAboveMax.principal === 50000);
check("MATEMATYKA", "evaluate: zysk wyliczony z 50000 a nie 80000", near(evalAboveMax.net, calcProfit(50000, 7.0, 6, "at_maturity").net));

// Horyzont krotszy niz okres oferty
const evalShortHorizon = evaluate(testOffer, 20000, 3);
check("MATEMATYKA", "evaluate: horyzont 3M < okres 6M -> shortened = true", evalShortHorizon.shortened === true);
check("MATEMATYKA", "evaluate: wyliczone miesiace = 3", evalShortHorizon.months === 3);

// Oferta bez limitu max_amount (null)
const testOfferNoMax = { ...testOffer, max_amount: null };
const evalNoMax = evaluate(testOfferNoMax, 1000000, 6);
check("MATEMATYKA", "evaluate: max_amount null -> capped = false dla 1 000 000 PLN", evalNoMax.capped === false && evalNoMax.principal === 1000000);

// ==============================================================
// SEKCJA 2: SPOJNOSC DANYCH BAZY (offers.json)
// ==============================================================
console.log("\n[2/4] Testowanie spojnosci i poprawnosci bazy ofert...");

const dataPath = path.join(root, "data", "offers.json");
const webDataPath = path.join(web, "data", "offers.json");
const seedPath = path.join(web, "data", "offers-data.js");

check("BAZA", "Plik data/offers.json istnieje", fs.existsSync(dataPath));
check("BAZA", "Plik web/data/offers.json istnieje", fs.existsSync(webDataPath));
check("BAZA", "Plik web/data/offers-data.js istnieje", fs.existsSync(seedPath));

const db = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const webDb = JSON.parse(fs.readFileSync(webDataPath, "utf8"));

check("BAZA", "Synchronizacja data/offers.json z web/data/offers.json (identyczna zawartosc)", JSON.stringify(db) === JSON.stringify(webDb));
check("BAZA", "Metadane: waluta to PLN", db.currency === "PLN");
check("BAZA", "Metadane: data aktualizacji w formacie YYYY-MM-DD", /^\d{4}-\d{2}-\d{2}$/.test(db.last_updated));
check("BAZA", "Liczba ofert = 22", db.offers && db.offers.length === 22, `Znaleziono: ${db.offers?.length}`);

const seenIds = new Set();
let lokataCount = 0;
let koCount = 0;
const banksSet = new Set();

db.offers.forEach((o, idx) => {
  const prefix = `Oferta #${idx + 1} (${o.id || "brak id"})`;
  
  // ID
  check("BAZA", `${prefix}: Unikalny ID`, !seenIds.has(o.id));
  seenIds.add(o.id);
  check("BAZA", `${prefix}: ID w formacie kebab-case`, /^[a-z0-9-]+$/.test(o.id));

  // Bank i nazwa
  check("BAZA", `${prefix}: Prawidlowa nazwa banku`, typeof o.bank === "string" && o.bank.length > 2);
  check("BAZA", `${prefix}: Prawidlowa nazwa produktu`, typeof o.name === "string" && o.name.length > 2);
  banksSet.add(o.bank);

  // Typ
  check("BAZA", `${prefix}: Typ lokata lub konto_oszczednosciowe`, ["lokata", "konto_oszczednosciowe"].includes(o.type));
  if (o.type === "lokata") lokataCount++;
  if (o.type === "konto_oszczednosciowe") koCount++;

  // Oprocentowanie i okres
  check("BAZA", `${prefix}: Oprocentowanie realne (1% - 15%)`, typeof o.rate === "number" && o.rate >= 1.0 && o.rate <= 15.0, `${o.rate}%`);
  check("BAZA", `${prefix}: Okres miesiecy > 0 (int)`, Number.isInteger(o.period_months) && o.period_months > 0, `${o.period_months}M`);

  // Kwoty
  check("BAZA", `${prefix}: min_amount >= 0`, typeof o.min_amount === "number" && o.min_amount >= 0);
  check("BAZA", `${prefix}: max_amount null lub > min_amount`, o.max_amount === null || (typeof o.max_amount === "number" && o.max_amount > o.min_amount));

  // Kapitalizacja powiazana z typem
  check("BAZA", `${prefix}: capitalization to monthly lub at_maturity`, ["monthly", "at_maturity"].includes(o.capitalization));

  // Flagi warunkow
  check("BAZA", `${prefix}: conditions.new_clients_only jest boolean`, typeof o.conditions?.new_clients_only === "boolean");
  check("BAZA", `${prefix}: conditions.new_funds_only jest boolean`, typeof o.conditions?.new_funds_only === "boolean");
  check("BAZA", `${prefix}: conditions.personal_account_required jest boolean`, typeof o.conditions?.personal_account_required === "boolean");
  check("BAZA", `${prefix}: conditions.activity_required jest boolean`, typeof o.conditions?.activity_required === "boolean");
  check("BAZA", `${prefix}: conditions.details jest niepustym stringiem`, typeof o.conditions?.details === "string" && o.conditions.details.length > 0);

  // URL i data
  check("BAZA", `${prefix}: URL poprawny HTTPS/HTTP`, /^https?:\/\/.+/.test(o.url));
  check("BAZA", `${prefix}: updated_at format YYYY-MM-DD`, /^\d{4}-\d{2}-\d{2}$/.test(o.updated_at));
  check("BAZA", `${prefix}: status active`, o.status === "active");
});

check("BAZA", "Liczba lokat wynosi 12", lokataCount === 12, `${lokataCount}`);
check("BAZA", "Liczba kont oszczednosciowych wynosi 10", koCount === 10, `${koCount}`);
check("BAZA", "Liczba unikalnych bankow >= 10", banksSet.size >= 10, `${banksSet.size} bankow`);

// ==============================================================
// SEKCJA 3: FUNKCJONALNOSC, FILTRY I SORTOWANIE (app.js)
// ==============================================================
console.log("\n[3/4] Testowanie logiki filtrowania, wyszukiwania i sortowania...");

// Symulacja logiki filtrowania z app.js
function filterOffers(offers, amount, horizon, typeFilter, conditionFilters, query = "") {
  return offers
    .map(o => evaluate(o, amount, horizon))
    .filter(res => {
      if (res.tooSmall) return false;
      if (typeFilter !== "all" && res.offer.type !== typeFilter) return false;
      const c = res.offer.conditions;
      if (conditionFilters.noAccount && c.personal_account_required) return false;
      if (conditionFilters.existing && c.new_clients_only) return false;
      if (conditionFilters.noNewFunds && c.new_funds_only) return false;
      if (conditionFilters.noActivity && c.activity_required) return false;
      if (query) {
        const text = (res.offer.bank + " " + res.offer.name + " " + res.offer.conditions.details).toLowerCase();
        if (!text.includes(query.toLowerCase())) return false;
      }
      return true;
    });
}

function sortList(list, sortKey) {
  const sorted = list.slice();
  sorted.sort((a, b) => {
    let diff = 0;
    if (sortKey === "rate") diff = b.offer.rate - a.offer.rate;
    else if (sortKey === "max") {
      const am = a.offer.max_amount == null ? Infinity : a.offer.max_amount;
      const bm = b.offer.max_amount == null ? Infinity : b.offer.max_amount;
      diff = bm === am ? 0 : (bm > am ? 1 : -1);
    } else if (sortKey === "annual") diff = b.effective - a.effective;
    else if (sortKey === "period") diff = a.offer.period_months - b.offer.period_months;
    else diff = b.net - a.net; // profit
    if (diff !== 0) return diff;
    if (b.net !== a.net) return b.net - a.net;
    if (b.offer.rate !== a.offer.rate) return b.offer.rate - a.offer.rate;
    return a.offer.bank.localeCompare(b.offer.bank, "pl");
  });
  return sorted;
}

const allActive = db.offers.filter(o => o.status === "active");

// 3.1 Filtry typu dla 25 000 PLN i 12M
const filterAll = filterOffers(allActive, 25000, 12, "all", {});
const filterLokaty = filterOffers(allActive, 25000, 12, "lokata", {});
const filterKO = filterOffers(allActive, 25000, 12, "konto_oszczednosciowe", {});

check("FILTRY", "Filtr 'all' zawiera wszystkie pasujace oferty", filterAll.length === 22);
check("FILTRY", "Filtr 'lokata' zawiera tylko lokaty (12)", filterLokaty.length === 12 && filterLokaty.every(r => r.offer.type === "lokata"));
check("FILTRY", "Filtr 'konto_oszczednosciowe' zawiera tylko KO (10)", filterKO.length === 10 && filterKO.every(r => r.offer.type === "konto_oszczednosciowe"));
check("FILTRY", "Suma lokaty + KO rowna sie all", filterLokaty.length + filterKO.length === filterAll.length);

// 3.2 Filtry warunkow
const filterNoAccount = filterOffers(allActive, 25000, 12, "all", { noAccount: true });
check("FILTRY", "Filtr 'Bez konta osobistego' wyklucza oferty z personal_account_required", filterNoAccount.every(r => r.offer.conditions.personal_account_required === false));
check("FILTRY", "Istnieja oferty bez wymaganego konta osobistego", filterNoAccount.length > 0 && filterNoAccount.length < 22, `${filterNoAccount.length} ofert`);

const filterExisting = filterOffers(allActive, 25000, 12, "all", { existing: true });
check("FILTRY", "Filtr 'Dla obecnych klientow' wyklucza new_clients_only", filterExisting.every(r => r.offer.conditions.new_clients_only === false));
check("FILTRY", "Istnieja oferty dla obecnych klientow", filterExisting.length > 0 && filterExisting.length < 22, `${filterExisting.length} ofert`);

const filterNoNewFunds = filterOffers(allActive, 25000, 12, "all", { noNewFunds: true });
check("FILTRY", "Filtr 'Bez nowych srodkow' wyklucza new_funds_only", filterNoNewFunds.every(r => r.offer.conditions.new_funds_only === false));

const filterNoActivity = filterOffers(allActive, 25000, 12, "all", { noActivity: true });
check("FILTRY", "Filtr 'Bez wymogu aktywnosci' wyklucza activity_required", filterNoActivity.every(r => r.offer.conditions.activity_required === false));

// Kombinacja restrykcyjna: bez konta + dla obecnych + bez nowych srodkow
const filterStrict = filterOffers(allActive, 25000, 12, "all", { noAccount: true, existing: true, noNewFunds: true });
check("FILTRY", "Kombinacja filtrow dziala logicznie koniunkcyjnie (AND)", filterStrict.every(r => !r.offer.conditions.personal_account_required && !r.offer.conditions.new_clients_only && !r.offer.conditions.new_funds_only));

// 3.3 Sortowanie
// Sortowanie wg zysku netto (profit)
const sortedByProfit = sortList(filterAll, "profit");
for (let i = 0; i < sortedByProfit.length - 1; i++) {
  check("SORTOWANIE", `Zysk netto malejaco: pozycja ${i + 1} >= ${i + 2}`, sortedByProfit[i].net >= sortedByProfit[i + 1].net);
}

// Sortowanie wg stawki oprocentowania (rate)
const sortedByRate = sortList(filterAll, "rate");
for (let i = 0; i < sortedByRate.length - 1; i++) {
  check("SORTOWANIE", `Oprocentowanie malejaco: pozycja ${i + 1} (${sortedByRate[i].offer.rate}%) >= ${i + 2} (${sortedByRate[i + 1].offer.rate}%)`, sortedByRate[i].offer.rate >= sortedByRate[i + 1].offer.rate);
}

// Sortowanie wg kwoty maksymalnej (max)
const sortedByMax = sortList(filterAll, "max");
// Pierwsze powinny byc null (bez limitu)
check("SORTOWANIE", "Oferty bez limitu (null) na poczatku przy sortowaniu wg max_amount", sortedByMax[0].offer.max_amount === null);

// 3.4 Modul porownania A/B
const offerA = db.offers.find(o => o.id === "nest-bank-nest-lokata-witaj-6m");
const offerB = db.offers.find(o => o.id === "velobank-eko-nowe-srodki");
check("POROWNYWARKA", "Znaleziono oferte A do testu porownania (Nest)", !!offerA);
check("POROWNYWARKA", "Znaleziono oferte B do testu porownania (Velo)", !!offerB);

const evalA = evaluate(offerA, 50000, 6);
const evalB = evaluate(offerB, 50000, 6);

// Oferta A: Nest 6M, 7.1%, max 25k (capped do 25k)
// Oferta B: Velo 3M, 7.0%, max 100k, 3M promocyjne (shortened do 3M)
check("POROWNYWARKA", "Oferta A posiada flage capped przy 50k", evalA.capped === true && evalA.principal === 25000);
check("POROWNYWARKA", "Oferta B wykorzystuje maksymalny okres 3M oferty przy horyzoncie 6M", evalB.months === 3 && evalB.shortened === false);
const evalBShort = evaluate(offerB, 50000, 2);
check("POROWNYWARKA", "Oferta B posiada flage shortened przy horyzoncie 2M < 3M", evalBShort.shortened === true && evalBShort.months === 2);
check("POROWNYWARKA", "Porownanie zysku netto: weryfikacja wskazania lepszej oferty", evalB.net !== evalA.net);
const winner = evalA.net > evalB.net ? evalA : evalB;
check("POROWNYWARKA", "Zwyciezca porownania ma scisle wiekszy zysk netto", winner.net === Math.max(evalA.net, evalB.net));

// ==============================================================
// SEKCJA 4: WERYFIKACJA ASSETOW I PLIKOW WEBOWYCH
// ==============================================================
console.log("\n[4/4] Testowanie assetow webowych i PWA...");

const requiredWebFiles = [
  "index.html",
  "style.css",
  "app.js",
  "calc.js",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-maskable.svg",
  "data/offers.json",
  "data/offers-data.js"
];

for (const file of requiredWebFiles) {
  const fullPath = path.join(web, file);
  check("ASSETY", `Plik ${file} istnieje w katalogu web/`, fs.existsSync(fullPath));
  if (fs.existsSync(fullPath)) {
    const size = fs.statSync(fullPath).size;
    check("ASSETY", `Plik ${file} nie jest pusty (rozmiar: ${size} B)`, size > 0);
  }
}

// Podsumowanie wynikow
console.log("\n" + "=".repeat(62));
console.log(`WYNIK TESTOW QA: ${passCount} PASS, ${failCount} FAIL (Lacznie sprawdzen: ${totalChecks})`);
if (failures.length) {
  console.log("\nWYKRYTE BLEDY:");
  failures.forEach(f => console.log(" - " + f));
} else {
  console.log("STATUS: WSZYSTKIE TESTY ZAKONCZONE SUKCESEM (PASS)");
}
console.log("=".repeat(62));

process.exit(failCount === 0 ? 0 : 1);

