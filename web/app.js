/* ==========================================================================
   Lokaty i KO — logika interfejsu
   Bez frameworków i zależności. Dane: data/offers.json + zapasowo data/offers-data.js
   ========================================================================== */
(function () {
  "use strict";

  var C = window.LKCalc;
  var STORAGE_KEY = "lk-prefs-v1";
  var MAX_COMPARE = 2;

  var state = {
    data: null,
    source: "seed",
    custom: false,
    amount: 25000,
    horizon: 12,
    type: "all",
    conditions: { noAccount: false, existing: false, noNewFunds: false, noActivity: false },
    sort: "profit",
    query: "",
    view: "cards",
    compare: [],
    theme: null,
  };

  var moneyFmt = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
  var money0Fmt = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 0, maximumFractionDigits: 0, useGrouping: "always" });
  var num2Fmt = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var num1Fmt = new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  var groupFmt = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0, useGrouping: "always" });

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $$(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  function money(value) { return moneyFmt.format(Number(value) || 0); }
  function money0(value) { return money0Fmt.format(Number(value) || 0); }
  function group(value) { return groupFmt.format(Number(value) || 0); }
  function pct(value) { return num2Fmt.format(Number(value) || 0) + "%"; }
  function pctShort(value) { return num1Fmt.format(Number(value) || 0) + "%"; }

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function datePL(iso) {
    if (!iso) return "—";
    var parts = String(iso).split("-");
    if (parts.length !== 3) return String(iso);
    return parts[2] + "." + parts[1] + "." + parts[0];
  }

  function monthLabel(months) {
    if (months === 12) return "12 mies. (rok)";
    if (months === 24) return "24 mies.";
    return months + " mies.";
  }

  /* ------------------------------------------------------------- dane */
  function normalize(raw) {
    var payload = Array.isArray(raw) ? { offers: raw } : raw;
    if (!payload || !Array.isArray(payload.offers)) {
      throw new Error("Plik nie zawiera tablicy „offers”.");
    }
    var offers = [];
    var skipped = 0;

    payload.offers.forEach(function (item) {
      if (!item || typeof item !== "object") { skipped += 1; return; }
      var rate = Number(item.rate);
      var period = Number(item.period_months);
      var minAmount = Number(item.min_amount);
      if (!item.id || !item.bank || !item.name || !item.type || !(rate > 0) || !(period > 0)) {
        skipped += 1;
        return;
      }
      if (item.type !== "lokata" && item.type !== "konto_oszczednosciowe") { skipped += 1; return; }
      var cond = item.conditions && typeof item.conditions === "object" ? item.conditions : {};
      offers.push({
        id: String(item.id),
        bank: String(item.bank),
        name: String(item.name),
        type: item.type,
        rate: rate,
        period_months: period,
        min_amount: Number.isFinite(minAmount) ? minAmount : 0,
        max_amount: item.max_amount == null ? null : Number(item.max_amount),
        capitalization: item.capitalization === "monthly" ? "monthly" : "at_maturity",
        conditions: {
          new_clients_only: cond.new_clients_only === true,
          new_funds_only: cond.new_funds_only === true,
          personal_account_required: cond.personal_account_required === true,
          activity_required: cond.activity_required === true,
          details: cond.details ? String(cond.details) : "",
        },
        url: typeof item.url === "string" ? item.url : "",
        updated_at: item.updated_at || "",
        status: item.status === "expired" ? "expired" : "active",
      });
    });

    if (!offers.length) throw new Error("Baza nie zawiera poprawnych ofert.");
    return {
      meta: {
        version: payload.version || "—",
        lastUpdated: payload.last_updated || offers[0].updated_at || "",
        currency: payload.currency || "PLN",
      },
      offers: offers,
      skipped: skipped,
    };
  }

  async function fetchData() {
    var raw = null;
    var source = "seed";
    try {
      var response = await fetch("data/offers.json", { cache: "no-store" });
      if (response.ok) {
        raw = await response.json();
        source = "json";
      }
    } catch (error) {
      /* plik:// lub offline — używamy wbudowanej kopii */
    }
    if (!raw && window.LK_OFFERS_SEED) {
      raw = window.LK_OFFERS_SEED;
      source = "seed";
    }
    if (!raw) throw new Error("Nie udało się wczytać bazy ofert.");
    var normalized = normalize(raw);
    normalized.source = source;
    return normalized;
  }

  /* ------------------------------------------------------- filtrowanie */
  function activeOffers() {
    return state.data.offers.filter(function (offer) { return offer.status !== "expired"; });
  }

  function passesConditions(offer) {
    var cond = offer.conditions;
    var f = state.conditions;
    if (f.noAccount && cond.personal_account_required) return false;
    if (f.existing && cond.new_clients_only) return false;
    if (f.noNewFunds && cond.new_funds_only) return false;
    if (f.noActivity && cond.activity_required) return false;
    return true;
  }

  function computeAll() {
    return activeOffers().map(function (offer) {
      var result = C.evaluate(offer, state.amount, state.horizon);
      result.position = 0;
      return result;
    });
  }

  function sortResults(list) {
    var sorted = list.slice();
    sorted.sort(function (a, b) {
      var diff = 0;
      if (state.sort === "rate") diff = b.offer.rate - a.offer.rate;
      else if (state.sort === "max") {
        var am = a.offer.max_amount == null ? Infinity : a.offer.max_amount;
        var bm = b.offer.max_amount == null ? Infinity : b.offer.max_amount;
        diff = bm === am ? 0 : (bm > am ? 1 : -1);
      } else if (state.sort === "annual") diff = b.effective - a.effective;
      else if (state.sort === "period") diff = a.offer.period_months - b.offer.period_months;
      else diff = b.net - a.net;
      if (diff !== 0) return diff;
      if (b.net !== a.net) return b.net - a.net;
      if (b.offer.rate !== a.offer.rate) return b.offer.rate - a.offer.rate;
      return a.offer.bank.localeCompare(b.offer.bank, "pl");
    });
    sorted.forEach(function (item, index) { item.position = index + 1; });
    return sorted;
  }

  function currentResults() {
    var all = computeAll();
    var available = all.filter(function (item) { return !item.tooSmall; });
    var excluded = all.length - available.length;
    var list = available.filter(function (item) {
      if (state.type !== "all" && item.offer.type !== state.type) return false;
      if (!passesConditions(item.offer)) return false;
      if (state.query) {
        var haystack = (item.offer.bank + " " + item.offer.name + " " + item.offer.conditions.details).toLowerCase();
        if (haystack.indexOf(state.query.toLowerCase()) === -1) return false;
      }
      return true;
    });
    return { list: sortResults(list), excluded: excluded, total: all.length };
  }

  /* ------------------------------------------------------------- karty */
  function tagList(offer) {
    var tags = [];
    if (offer.conditions.new_clients_only) tags.push({ label: "Nowi klienci", tone: "warn" });
    if (offer.conditions.new_funds_only) tags.push({ label: "Nowe środki", tone: "warn" });
    if (offer.conditions.personal_account_required) tags.push({ label: "Konto osobiste", tone: "" });
    if (offer.conditions.activity_required) tags.push({ label: "Wymóg aktywności", tone: "warn" });
    if (!offer.conditions.new_clients_only && !offer.conditions.new_funds_only) tags.push({ label: "Bez nowych środków", tone: "good" });
    if (!offer.conditions.personal_account_required) tags.push({ label: "Bez konta osobistego", tone: "good" });
    if (offer.max_amount == null) tags.push({ label: "Bez limitu kwoty", tone: "good" });
    return tags;
  }

  function cardHtml(item, isTop) {
    var offer = item.offer;
    var tags = tagList(offer);
    var selected = state.compare.indexOf(offer.id) !== -1;
    var notes = [];
    if (item.capped) notes.push("Limit promocji " + money0(offer.max_amount) + " — liczone od tej kwoty.");
    if (item.shortened) notes.push("Okres oferty to " + offer.period_months + " mies. — policzono " + item.months + " mies.");

    return "" +
      '<article class="card' + (isTop ? " is-top" : "") + (selected ? " is-selected" : "") + '" data-id="' + esc(offer.id) + '">' +
        '<div class="card-top">' +
          '<div class="bank">' +
            '<span class="bank-name">' + esc(offer.bank) + '</span>' +
            '<h3 class="product-name">' + esc(offer.name) + '</h3>' +
          '</div>' +
          '<div class="card-badges">' +
            '<span class="rank-badge">#' + item.position + '</span>' +
            '<span class="type-pill' + (offer.type === "konto_oszczednosciowe" ? " is-ko" : "") + '">' +
              (offer.type === "lokata" ? "Lokata" : "Konto oszcz.") +
            '</span>' +
          '</div>' +
        '</div>' +
        '<div class="rate-row">' +
          '<span class="rate">' + pct(offer.rate) + '<small>p.a.</small></span>' +
          '<span class="period">' + offer.period_months + ' mies.</span>' +
        '</div>' +
        '<div class="profit-box">' +
          '<p class="profit-label">Twój zysk na czysto</p>' +
          '<p class="profit-value">+' + money(item.net) + '</p>' +
          '<p class="profit-meta">Wypłata ' + money(item.final) + ' · netto ' + pct(item.effective) + ' w skali roku</p>' +
        '</div>' +
        (notes.length ? '<p class="card-note"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><span>' + esc(notes.join(" ")) + '</span></p>' : "") +
        '<div class="tags">' + tags.map(function (tag) {
          return '<span class="tag' + (tag.tone ? " is-" + tag.tone : "") + '">' + esc(tag.label) + '</span>';
        }).join("") + '</div>' +
        (offer.conditions.details ? '<p class="card-details" title="' + esc(offer.conditions.details) + '">' + esc(offer.conditions.details) + '</p>' : "") +
        '<div class="card-foot">' +
          '<button type="button" class="btn' + (selected ? " is-on" : "") + '" data-compare="' + esc(offer.id) + '" aria-pressed="' + selected + '">' +
            (selected ? "W porównaniu" : "Porównaj") +
          '</button>' +
          (offer.url ? '<a class="card-link" href="' + esc(offer.url) + '" target="_blank" rel="noopener noreferrer">Strona banku ↗</a>' : "") +
        '</div>' +
      '</article>';
  }

  function tableRowHtml(item) {
    var offer = item.offer;
    var conditions = tagList(offer).map(function (t) { return t.label; }).join(", ");
    return "<tr>" +
      '<td class="rank">' + item.position + "</td>" +
      '<td><div class="t-bank">' + esc(offer.bank) + '</div><div class="t-name">' + esc(offer.name) + "</div></td>" +
      '<td><strong>' + pct(offer.rate) + "</strong><br><span class=\"t-bank\">p.a.</span></td>" +
      "<td>" + offer.period_months + " mies.<br><span class=\"t-bank\">" + (offer.capitalization === "monthly" ? "kap. mies." : "na koniec") + "</span></td>" +
      '<td class="num t-profit">+' + money(item.net) + "</td>" +
      '<td class="num">' + (offer.max_amount == null ? "bez limitu" : money0(offer.max_amount)) + "</td>" +
      '<td class="t-tags">' + esc(conditions) + "</td>" +
      '<td><a href="' + esc(offer.url) + '" target="_blank" rel="noopener noreferrer">Otwórz ↗</a></td>' +
    "</tr>";
  }

  /* ------------------------------------------------------------ render */
  function render() {
    if (!state.data) return;
    var results = currentResults();
    var list = results.list;

    renderHeaderStats();
    renderTypeCounts();
    renderCalcOut(list, results);
    renderCards(list);
    renderTable(list);
    renderSummary(results);

    $("#cards").hidden = state.view !== "cards";
    $("#tableWrap").hidden = state.view !== "table";
    $("#emptyState").hidden = list.length > 0;

    var note = $("#excludedNote");
    if (results.excluded > 0) {
      note.hidden = false;
      note.textContent = results.excluded + " ofert pominięto — minimalna kwota lub okres nie pasuje do podanych kryteriów.";
    } else {
      note.hidden = true;
    }
  }

  function renderHeaderStats() {
    var offers = activeOffers();
    var banks = {};
    var sum = 0;
    var best = offers[0];
    offers.forEach(function (offer) {
      banks[offer.bank] = true;
      sum += offer.rate;
      if (offer.rate > best.rate) best = offer;
    });
    var count = offers.length;
    var bankCount = Object.keys(banks).length;
    $("#statCount").textContent = count;
    $("#statBest").textContent = pct(best.rate);
    $("#statBanks").textContent = bankCount;
    $("#heroBankCount").textContent = bankCount;
    $("#statAvg").textContent = pct(sum / count);
    $("#heroDate").textContent = datePL(state.data.meta.lastUpdated);

    $("#dataPillText").textContent = "baza " + datePL(state.data.meta.lastUpdated) + " · " + count + " ofert";
    $("#dataPill").classList.toggle("is-local", state.custom);
    $("#dataPill").title = state.custom
      ? "Wczytana baza lokalna (plik JSON)"
      : "Dane z pliku data/offers.json (wersja " + state.data.meta.version + ")";

    $("#dataInfo").textContent = count + " ofert · " + bankCount + " banków · wersja " + state.data.meta.version +
      " · aktualizacja " + datePL(state.data.meta.lastUpdated) + (state.custom ? " · baza wczytana z pliku" : " · źródło: data/offers.json");
  }

  function renderTypeCounts() {
    var offers = activeOffers();
    var counts = { all: offers.length, lokata: 0, konto_oszczednosciowe: 0 };
    offers.forEach(function (offer) { counts[offer.type] += 1; });
    $$("[data-count]").forEach(function (node) {
      node.textContent = counts[node.getAttribute("data-count")] || 0;
    });
  }

  function renderCalcOut(list, results) {
    var top = list.slice().sort(function (a, b) { return b.net - a.net; })[0];
    var outNote = $("#outNote");
    $("#outAmount").textContent = money0(state.amount);
    $("#outHorizon").textContent = monthLabel(state.horizon);

    if (!top) {
      $("#topProfit").textContent = "—";
      $("#topOffer").textContent = list.length ? "Brak dopasowania do kryteriów" : "Brak ofert spełniających kryteria";
      $("#outTax").textContent = "—";
      outNote.textContent = "Zmień kwotę, horyzont lub filtry, aby zobaczyć wynik.";
      return;
    }

    $("#topProfit").textContent = "+" + money(top.net);
    $("#topOffer").textContent = top.offer.bank + " · " + top.offer.name;
    $("#outTax").textContent = money(top.tax) + " (19%)";
    outNote.textContent = top.monthly
      ? "Kapitalizacja miesięczna — podatek Belki pobierany po każdym miesiącu; " + top.months + " mies. przy stawce " + pct(top.offer.rate) + "."
      : "Odsetki wypłacane na koniec okresu: " + top.months + " mies. przy stawce " + pct(top.offer.rate) + ".";
    if (top.capped) outNote.textContent += " Kwota ograniczona limitem promocji (" + money0(top.offer.max_amount) + ").";
    if (results.excluded > 0) outNote.textContent += " Pominięto " + results.excluded + " ofert poza limitem kwotowym.";
  }

  function renderCards(list) {
    var isProfitSort = state.sort === "profit";
    $("#cards").innerHTML = list.map(function (item, index) {
      return cardHtml(item, isProfitSort && index === 0);
    }).join("");
  }

  function renderTable(list) {
    $("#tableBody").innerHTML = list.map(tableRowHtml).join("");
  }

  function sortLabel() {
    var labels = {
      profit: "zysk netto (zł)",
      annual: "stopa netto (% w skali roku)",
      rate: "stawka brutto (% p.a.)",
      max: "maksymalna kwota",
      period: "okres",
    };
    return labels[state.sort] || labels.profit;
  }

  function renderSummary(results) {
    var activeConditions = Object.keys(state.conditions).filter(function (key) { return state.conditions[key]; }).length;
    var parts = [
      results.list.length + " " + plural(results.list.length, "oferta", "oferty", "ofert") + " spełnia kryteria",
      "sortowanie: " + sortLabel(),
    ];
    if (activeConditions) parts.push(activeConditions + " " + plural(activeConditions, "filtr warunków", "filtry warunków", "filtrów warunków"));
    if (state.query) parts.push("szukaj: „" + state.query + "”");
    $("#resultSummary").textContent = parts.join(" · ");
    $("#compareOpen").textContent = "Porównaj 2 oferty";
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    var rest = n % 10;
    var tens = n % 100;
    if (rest >= 2 && rest <= 4 && (tens < 12 || tens > 14)) return few;
    return many;
  }

  /* ---------------------------------------------------------- porównanie */
  function renderCompareBar() {
    var bar = $("#compareBar");
    var chips = $("#compareChips");
    if (!state.compare.length) {
      bar.hidden = true;
      document.body.classList.remove("has-compare");
      return;
    }
    bar.hidden = false;
    document.body.classList.add("has-compare");
    chips.innerHTML = state.compare.map(function (id) {
      var item = findItem(id);
      var label = item ? item.offer.bank + " — " + item.offer.name : id;
      return '<span class="compare-chip"><span>' + esc(label) + '</span>' +
        '<button type="button" data-remove="' + esc(id) + '" aria-label="Usuń z porównania">×</button></span>';
    }).join("");
    $("#compareOpen").disabled = state.compare.length < 2;
  }

  function findItem(id) {
    var offer = state.data.offers.filter(function (o) { return o.id === id; })[0];
    if (!offer) return null;
    return C.evaluate(offer, state.amount, state.horizon);
  }

  function toggleCompare(id) {
    var index = state.compare.indexOf(id);
    if (index !== -1) {
      state.compare.splice(index, 1);
    } else {
      if (state.compare.length >= MAX_COMPARE) {
        toast("Możesz porównać maksymalnie " + MAX_COMPARE + " oferty. Usuń jedną z wybranych.", true);
        return;
      }
      state.compare.push(id);
    }
    render();
    renderCompareBar();
  }

  function compareRow(label, a, b, cls) {
    return "<tr><th scope=\"row\">" + label + "</th><td" + (cls ? ' class="' + cls + '"' : "") + ">" + a + "</td><td" + (cls ? ' class="' + cls + '"' : "") + ">" + b + "</td></tr>";
  }

  function openCompare() {
    var items = state.compare.map(findItem).filter(Boolean);
    if (items.length < 2) return;
    var a = items[0];
    var b = items[1];
    var bestNet = Math.max(a.net, b.net);

    function condList(item) {
      var offer = item.offer;
      var flags = [];
      flags.push(offer.conditions.new_clients_only ? "tylko nowi klienci" : "także obecni klienci");
      flags.push(offer.conditions.new_funds_only ? "wymagane nowe środki" : "bez wymogu nowych środków");
      flags.push(offer.conditions.personal_account_required ? "wymagane konto osobiste" : "bez konta osobistego");
      flags.push(offer.conditions.activity_required ? "wymagana aktywność" : "bez wymogu aktywności");
      return '<div class="cmp-cond"><ul><li>' + flags.join("</li><li>") + "</li></ul>" +
        (offer.conditions.details ? "<p style=\"margin-top:8px\">" + esc(offer.conditions.details) + "</p>" : "") + "</div>";
    }

    function profitCell(item) {
      return "+" + money(item.net) + (item.net === bestNet ? '<span class="cmp-win">lepszy</span>' : "");
    }

    function linkCell(item) {
      return item.offer.url ? '<a href="' + esc(item.offer.url) + '" target="_blank" rel="noopener noreferrer">Strona banku ↗</a>' : "—";
    }

    var head = "<thead><tr><th></th><th>" + esc(a.offer.bank) + "</th><th>" + esc(b.offer.bank) + "</th></tr></thead>";
    var body = "<tbody>" +
      compareRow("Produkt", esc(a.offer.name), esc(b.offer.name)) +
      compareRow("Typ", a.offer.type === "lokata" ? "Lokata" : "Konto oszczędnościowe", b.offer.type === "lokata" ? "Lokata" : "Konto oszczędnościowe") +
      compareRow("Oprocentowanie", pct(a.offer.rate) + " p.a.", pct(b.offer.rate) + " p.a.") +
      compareRow("Okres", a.offer.period_months + " mies.", b.offer.period_months + " mies.") +
      compareRow("Kapitalizacja", a.offer.capitalization === "monthly" ? "miesięczna" : "na koniec okresu", b.offer.capitalization === "monthly" ? "miesięczna" : "na koniec okresu") +
      compareRow("Kwota liczona", money0(a.principal) + (a.capped ? " (limit)" : ""), money0(b.principal) + (b.capped ? " (limit)" : "")) +
      compareRow("Zysk brutto (" + a.months + " mies.)", money(a.gross), money(b.gross)) +
      compareRow("Podatek Belki", "−" + money(a.tax), "−" + money(b.tax)) +
      compareRow("Zysk netto", profitCell(a), profitCell(b), "cmp-profit") +
      compareRow("Wypłata na koniec", money(a.final), money(b.final)) +
      compareRow("Stopa netto w skali roku", pct(a.effective), pct(b.effective)) +
      compareRow("Limit promocji", a.offer.max_amount == null ? "bez limitu" : money0(a.offer.max_amount), b.offer.max_amount == null ? "bez limitu" : money0(b.offer.max_amount)) +
      compareRow("Warunki", condList(a), condList(b)) +
      compareRow("Link", linkCell(a), linkCell(b)) +
      "</tbody>";

    $("#compareBody").innerHTML = '<table class="cmp-table"><caption class="sr-only">Zestawienie dwóch ofert</caption>' + head + body + "</table>";

    var dialog = $("#compareDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "open");
  }

  /* --------------------------------------------------------------- toast */
  var toastTimer = null;
  function toast(message, isError) {
    var node = $("#toast");
    node.textContent = message;
    node.hidden = false;
    node.classList.toggle("is-error", !!isError);
    window.requestAnimationFrame(function () { node.classList.add("is-visible"); });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      node.classList.remove("is-visible");
      window.setTimeout(function () { node.hidden = true; }, 220);
    }, 3600);
  }

  /* ----------------------------------------------------------- preferencje */
  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        amount: state.amount,
        horizon: state.horizon,
        type: state.type,
        conditions: state.conditions,
        sort: state.sort,
        view: state.view,
        theme: state.theme,
      }));
    } catch (error) { /* prywatny tryb przeglądarki */ }
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var prefs = JSON.parse(raw);
      if (Number.isFinite(prefs.amount) && prefs.amount > 0) state.amount = prefs.amount;
      if (Number.isFinite(prefs.horizon) && prefs.horizon > 0) state.horizon = prefs.horizon;
      if (["all", "lokata", "konto_oszczednosciowe"].indexOf(prefs.type) !== -1) state.type = prefs.type;
      if (prefs.conditions) {
        Object.keys(state.conditions).forEach(function (key) {
          if (typeof prefs.conditions[key] === "boolean") state.conditions[key] = prefs.conditions[key];
        });
      }
      if (["profit", "annual", "rate", "max", "period"].indexOf(prefs.sort) !== -1) state.sort = prefs.sort;
      if (prefs.view === "table" || prefs.view === "cards") state.view = prefs.view;
      if (prefs.theme === "light" || prefs.theme === "dark") state.theme = prefs.theme;
    } catch (error) { /* ignorujemy uszkodzone preferencje */ }
  }

  function applyTheme() {
    var stored = state.theme;
    if (!stored) {
      stored = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", stored);
    var btn = $("#themeBtn");
    btn.setAttribute("aria-label", stored === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny");
  }

  /* ---------------------------------------------------------- formularze */
  function syncForm() {
    $("#amount").value = group(state.amount);
    var range = $("#amountRange");
    range.value = Math.min(state.amount, Number(range.max));
    $$("#amountChips .chip").forEach(function (chip) {
      chip.classList.toggle("is-active", Number(chip.getAttribute("data-amount")) === state.amount);
    });
    $$("#horizonChips .chip").forEach(function (chip) {
      chip.classList.toggle("is-active", Number(chip.getAttribute("data-horizon")) === state.horizon);
    });
    $$("#typeFilter .seg").forEach(function (seg) {
      var active = seg.getAttribute("data-type") === state.type;
      seg.classList.toggle("is-active", active);
      seg.setAttribute("aria-pressed", String(active));
    });
    $$("[data-view]").forEach(function (seg) {
      var active = seg.getAttribute("data-view") === state.view;
      seg.classList.toggle("is-active", active);
      seg.setAttribute("aria-pressed", String(active));
    });
    $$("[data-cond]").forEach(function (input) {
      input.checked = !!state.conditions[input.getAttribute("data-cond")];
    });
    $("#sort").value = state.sort;
    $("#search").value = state.query;
  }

  function parseAmount(text) {
    var digits = String(text == null ? "" : text).replace(/[^\d]/g, "").slice(0, 8);
    return digits ? Number(digits) : 0;
  }

  function bindEvents() {
    var amountInput = $("#amount");
    var debounce = null;

    amountInput.addEventListener("input", function () {
      var value = parseAmount(amountInput.value);
      if (value > 0) {
        state.amount = Math.min(value, 5000000);
        $("#amountRange").value = Math.min(state.amount, Number($("#amountRange").max));
        window.clearTimeout(debounce);
        debounce = window.setTimeout(function () {
          render();
          $$("#amountChips .chip").forEach(function (chip) {
            chip.classList.toggle("is-active", Number(chip.getAttribute("data-amount")) === state.amount);
          });
          savePrefs();
        }, 140);
      }
    });
    amountInput.addEventListener("blur", function () {
      var value = parseAmount(amountInput.value);
      if (!value) value = state.amount;
      state.amount = Math.min(Math.max(Math.round(value), 100), 5000000);
      syncForm();
      render();
      savePrefs();
    });

    $("#amountRange").addEventListener("input", function (event) {
      state.amount = Number(event.target.value);
      amountInput.value = group(state.amount);
      $$("#amountChips .chip").forEach(function (chip) {
        chip.classList.toggle("is-active", Number(chip.getAttribute("data-amount")) === state.amount);
      });
      render();
      savePrefs();
    });

    $("#amountChips").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-amount]");
      if (!chip) return;
      state.amount = Number(chip.getAttribute("data-amount"));
      syncForm();
      render();
      savePrefs();
    });

    $("#horizonChips").addEventListener("click", function (event) {
      var chip = event.target.closest("[data-horizon]");
      if (!chip) return;
      state.horizon = Number(chip.getAttribute("data-horizon"));
      syncForm();
      render();
      savePrefs();
    });

    $("#typeFilter").addEventListener("click", function (event) {
      var seg = event.target.closest("[data-type]");
      if (!seg) return;
      state.type = seg.getAttribute("data-type");
      syncForm();
      render();
      savePrefs();
    });

    $$("[data-view]").forEach(function (seg) {
      seg.addEventListener("click", function () {
        state.view = seg.getAttribute("data-view");
        syncForm();
        render();
        savePrefs();
      });
    });

    $$("[data-cond]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.conditions[input.getAttribute("data-cond")] = input.checked;
        render();
        savePrefs();
      });
    });

    $("#sort").addEventListener("change", function (event) {
      state.sort = event.target.value;
      render();
      savePrefs();
    });

    var searchTimer = null;
    $("#search").addEventListener("input", function (event) {
      window.clearTimeout(searchTimer);
      var value = event.target.value.trim();
      searchTimer = window.setTimeout(function () {
        state.query = value;
        render();
        savePrefs();
      }, 120);
    });

    function resetFilters() {
      state.conditions = { noAccount: false, existing: false, noNewFunds: false, noActivity: false };
      state.type = "all";
      state.query = "";
      state.sort = "profit";
      syncForm();
      render();
      savePrefs();
    }
    $("#resetFilters").addEventListener("click", resetFilters);
    $("#emptyReset").addEventListener("click", resetFilters);

    $("#cards").addEventListener("click", function (event) {
      var button = event.target.closest("[data-compare]");
      if (!button) return;
      toggleCompare(button.getAttribute("data-compare"));
    });

    $("#compareChips").addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove]");
      if (!button) return;
      state.compare = state.compare.filter(function (id) { return id !== button.getAttribute("data-remove"); });
      render();
      renderCompareBar();
    });

    $("#compareOpen").addEventListener("click", openCompare);
    $("#compareClear").addEventListener("click", function () {
      state.compare = [];
      render();
      renderCompareBar();
    });
    $("#compareClose").addEventListener("click", function () { $("#compareDialog").close(); });
    $("#compareDialog").addEventListener("click", function (event) {
      if (event.target === $("#compareDialog")) $("#compareDialog").close();
    });

    $("#themeBtn").addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      state.theme = current === "dark" ? "light" : "dark";
      applyTheme();
      savePrefs();
    });

    $("#fileInput").addEventListener("change", async function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        var text = await file.text();
        var parsed = normalize(JSON.parse(text));
        state.data = parsed;
        state.custom = true;
        state.compare = [];
        $("#restoreData").hidden = false;
        render();
        renderCompareBar();
        toast("Wczytano " + parsed.offers.length + " ofert z pliku „" + file.name + "”.");
      } catch (error) {
        toast("Nie udało się wczytać pliku: " + error.message, true);
      }
      event.target.value = "";
    });

    $("#restoreData").addEventListener("click", async function () {
      try {
        var data = await fetchData();
        state.data = data;
        state.custom = false;
        state.compare = [];
        $("#restoreData").hidden = true;
        render();
        renderCompareBar();
        toast("Przywrócono domyślną bazę ofert.");
      } catch (error) {
        toast("Nie udało się przywrócić bazy: " + error.message, true);
      }
    });

    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { if (!state.theme) applyTheme(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
    }
  }

  /* ---------------------------------------------------------------- start */
  async function init() {
    loadPrefs();
    applyTheme();
    bindEvents();

    try {
      state.data = await fetchData();
    } catch (error) {
      $("#dataPillText").textContent = "brak danych";
      $("#resultSummary").textContent = "Nie udało się wczytać bazy ofert.";
      toast("Błąd wczytywania bazy: " + error.message, true);
      return;
    }

    syncForm();
    render();
    renderCompareBar();

    if (state.data.skipped) {
      toast("Pominięto " + state.data.skipped + " niepoprawnych rekordów w bazie.", true);
    }

    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      var registerWorker = function () {
        navigator.serviceWorker.register("sw.js").catch(function (error) {
          console.warn("Service worker:", error && error.message ? error.message : error);
        });
      };
      if (document.readyState === "complete") registerWorker();
      else window.addEventListener("load", registerWorker);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
