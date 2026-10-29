/*
 * Logika finansowa: podatek Belki (19%), kapitalizacja miesięczna / na koniec okresu.
 * Ten sam algorytm co tools/update_offers.py (calculate_profit), żeby wyniki UI i QA były zgodne.
 * Plik działa jako zwykły <script> (bez modułów) — można go też zaimportować w Node do testów.
 */
(function (global) {
  "use strict";

  var BELKA = 0.19;

  /** Zaokrąglenie do grosza (half-up na wartości bezwzględnej). */
  function round2(value) {
    if (!Number.isFinite(value)) return 0;
    var sign = value < 0 ? -1 : 1;
    return (sign * Math.round((Math.abs(value) + 1e-9) * 100)) / 100;
  }

  /**
   * Odsetki brutto, podatek Belki i zysk netto.
   * @param {number} amount  kwota wpłaty (PLN)
   * @param {number} rate    oprocentowanie nominalne (% p.a.)
   * @param {number} months  czas trwania w miesiącach (może być ułamkowy)
   * @param {string} capitalization "monthly" | "at_maturity"
   */
  function calcProfit(amount, rate, months, capitalization) {
    if (!(amount > 0) || !(rate >= 0) || !(months > 0)) {
      return { gross: 0, tax: 0, net: 0, final: round2(amount || 0), effective: 0 };
    }

    if (capitalization === "monthly") {
      var balance = amount;
      var totalGross = 0;
      var totalTax = 0;
      var whole = Math.floor(months);
      var i, grossMonth, taxMonth;

      for (i = 0; i < whole; i += 1) {
        grossMonth = balance * (rate / 100) * (1 / 12);
        taxMonth = round2(grossMonth * BELKA);
        balance += grossMonth - taxMonth;
        totalGross += grossMonth;
        totalTax += taxMonth;
      }

      var restDays = (months - whole) * 30;
      if (restDays > 0.0001) {
        grossMonth = balance * (rate / 100) * (restDays / 365);
        taxMonth = round2(grossMonth * BELKA);
        balance += grossMonth - taxMonth;
        totalGross += grossMonth;
        totalTax += taxMonth;
      }

      var netMonthly = balance - amount;
      return {
        gross: round2(totalGross),
        tax: round2(totalTax),
        net: round2(netMonthly),
        final: round2(balance),
        effective: round2((netMonthly / amount) * (12 / months) * 100),
      };
    }

    // Kapitalizacja na koniec okresu (lokaty).
    var gross = amount * (rate / 100) * (months / 12);
    var tax = round2(gross * BELKA);
    var net = gross - tax;
    return {
      gross: round2(gross),
      tax: tax,
      net: round2(net),
      final: round2(amount + net),
      effective: round2((net / amount) * (12 / months) * 100),
    };
  }

  /**
   * Wylicza wynik oferty dla kwoty i horyzontu użytkownika.
   * - kwota powyżej limitu promocji: liczone tylko od limitu (capped),
   * - horyzont dłuższy niż okres oferty: liczone za okres oferty (shortened),
   * - kwota poniżej minimum lub brak miesiąca: oferta niedostępna (tooSmall).
   */
  function evaluate(offer, amount, horizon) {
    var max = offer.max_amount == null ? Infinity : Number(offer.max_amount);
    var min = Number(offer.min_amount) || 0;
    var principal = Math.min(amount, max);
    var months = Math.min(horizon, Number(offer.period_months) || 0);
    var profit = calcProfit(principal, Number(offer.rate) || 0, months, offer.capitalization);

    return {
      offer: offer,
      principal: round2(principal),
      months: months,
      capped: principal < amount - 1e-9,
      shortened: months < (Number(offer.period_months) || 0),
      tooSmall: principal < min || months <= 0,
      gross: profit.gross,
      tax: profit.tax,
      net: profit.net,
      final: profit.final,
      effective: profit.effective,
      monthly: offer.capitalization === "monthly",
    };
  }

  global.LKCalc = {
    BELKA: BELKA,
    round2: round2,
    calcProfit: calcProfit,
    evaluate: evaluate,
  };
})(typeof window !== "undefined" ? window : globalThis);
