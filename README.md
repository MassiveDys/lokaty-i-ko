# Porównywarka i Kalkulator Lokat oraz Kont Oszczędnościowych

Aplikacja webowa publikowana na GitHub Pages służąca do wyszukiwania, porównywania i kalkulacji zysków z polskich lokat bankowych oraz kont oszczędnościowych.

## Funkcjonalności
- Baza aktualnych ofert bankowych z informacjami o warunkach (nowe środki, konto osobiste, okres, kapitalizacja)
- Moduł odświeżania i pobierania bazy ofert
- Kalkulator zysku brutto i netto (podatek Belki 19%)
- Zaawansowane filtry i ranking ofert
- Wersja webowa gotowa do hostingu na GitHub Pages

## Wersja web (`web/`)

Statyczna aplikacja bez frameworków, bundlerów i CDN — działa też z pliku i offline (PWA).

| Plik | Rola |
|---|---|
| `web/index.html` | struktura strony: kalkulator, filtry, ranking, porównanie, panel bazy |
| `web/style.css` | zmienne CSS, tryb jasny/ciemny, layout responsywny |
| `web/calc.js` | logika finansowa: podatek Belki, kapitalizacja miesięczna / na koniec |
| `web/app.js` | dane, filtry, sortowanie, karty, tabela, porównanie 2 ofert, wczytywanie JSON |
| `web/data/offers.json` | kopia bazy ofert serwowana z witryny |
| `web/data/offers-data.js` | ta sama baza jako `window.LK_OFFERS_SEED` (tryb `file://` i offline) |
| `web/sw.js`, `web/manifest.webmanifest` | instalacja jako PWA i cache offline |
| `web/icon.svg`, `web/icon-maskable.svg` | ikony |

### Kalkulator
Dla podanej kwoty i horyzontu liczy zysk netto oferty:
- kwota powyżej `max_amount` jest ograniczana do limitu promocji,
- horyzont dłuższy niż `period_months` jest liczony za pełny okres oferty,
- kwota poniżej `min_amount` wyklucza ofertę z rankingu.
Wzory są zgodne z `data/SCHEMA.md` i funkcją `calculate_profit()` z `tools/update_offers.py`.
UI zaokrągla podatek handlowo (half-up), Python — bankiersko; różnica to maks. 1 grosz na granicy zaokrąglenia.

### Filtry i ranking
- typ: wszystko / lokaty / konta oszczędnościowe,
- warunki: bez nowego konta, dla obecnych klientów, bez nowych środków, bez wymogu aktywności,
- sortowanie: zysk netto, stopa netto w skali roku, stawka brutto, maks. kwota, okres,
- widok kart lub tabeli, porównanie dwóch ofert w oknie dialogowym.

### Uruchomienie lokalne
```powershell
cd web
python -m http.server 8765
# http://127.0.0.1:8765/
```
Otwarcie `web/index.html` bezpośrednio z dysku też działa (dane z `offers-data.js`).

### Publikacja (GitHub Pages)
Workflow `.github/workflows/pages.yml` publikuje katalog `web/` przy każdym pushu do `main`.
Pages jest już włączone (`build_type: workflow`), a `actions/configure-pages` ma `enablement: true`, więc nowe repozytorium nie wymaga ręcznej konfiguracji.

- Produkcja: **https://massivedys.github.io/lokaty-i-ko/**
- Repozytorium: https://github.com/MassiveDys/lokaty-i-ko

```powershell
git remote add origin https://github.com/MassiveDys/lokaty-i-ko.git
git push -u origin main
```

Po pushu workflow „Deploy web to GitHub Pages” buduje artefakt z `web/` i publikuje go w 1–2 minuty.

### Aktualizacja bazy
1. Wygeneruj/zwaliduj dane: `python tools/update_offers.py --validate --summary`
2. Skopiuj `data/offers.json` do `web/data/offers.json` i odtwórz `web/data/offers-data.js` (`window.LK_OFFERS_SEED = {...}`).
3. Albo wczytaj nowy JSON w aplikacji przyciskiem „Wczytaj plik JSON” (bez publikacji).

### Testy
```powershell
node tools/test-web.mjs     # logika finansowa, zgodność baz, referencje plików
python tools/update_offers.py --validate --summary
# smoke test w Chrome (serwer na 8765 musi działać):
node tools/smoke-web.mjs
```
