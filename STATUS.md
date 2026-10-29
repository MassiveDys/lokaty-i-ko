# STATUS - lokaty-i-ko

- **Stan:** ukończony i opublikowany — aplikacja działa na GitHub Pages
- **Ostatnia zmiana:** 2026-10-29
- **Następny krok:** aktualizacja bazy ofert (`data/offers.json` → `web/data/`) i kolejne wdrożenie; ewentualne uwagi po testach użytkownika
- **Produkcja:** https://massivedys.github.io/lokaty-i-ko/

## Co działa
- Kanał projektu, pamięć i instrukcje skonfigurowane
- Baza ofert (`data/offers.json`): 22 aktualne oferty z 12 polskich banków (12 lokat, 10 KO, śr. 6.27% p.a.)
- Narzędzie walidacji (`tools/update_offers.py`): testy PASS, 22/22 OK
- Aplikacja webowa (`web/`):
  - Czysty HTML/CSS/JS bez frameworków i zewnętrznych CDN
  - Kalkulator zysków netto po Belce 19% (kapitalizacja miesięczna KO vs na koniec dla lokat, limity max_amount, skrócony horyzont)
  - Filtry typu, 4 filtry warunków (bez konta, dla obecnych, bez nowych środków, bez aktywności)
  - Ranking, widok kart i tabeli, moduł porównania 2 ofert A/B
  - PWA (`sw.js`, manifest, ikony, offline fallback z `offers-data.js`)
- Testy QA (Codertest):
  - Ocena końcowa: **PASS** (668+ zweryfikowanych asercji, 0 błędów)
  - `tools/qa-suite.mjs` (554 PASS), `tools/test-web.mjs` (83 PASS), `tools/smoke-web.mjs` (31 PASS)
  - Raport: `QA-REPORT.md` i zrzuty ekranu w `D:\openbot\qa\lokaty-i-ko-2026-10-29\`
- Publikacja:
  - Repozytorium: https://github.com/MassiveDys/lokaty-i-ko (publiczne, gałąź `main`)
  - Workflow: `.github/workflows/pages.yml` (build z katalogu `web/`, GitHub Actions)
  - Strona: **https://massivedys.github.io/lokaty-i-ko/** — HTTP 200, smoke test na produkcji 31/31 PASS, 0 błędów konsoli

## Stan zadań
- [x] Zadanie 1 [Coderdata]: Schemat bazy ofert + skrypt aktualizacji/pobierania + plik data/offers.json
- [x] Zadanie 2 [Coderweb]: Frontend webowy (HTML/CSS/JS) + kalkulator zysku netto + filtry + widok tabeli/kart
- [x] Zadanie 3 [Codertest]: Niezależna weryfikacja QA (668+ testów PASS, raport QA-REPORT.md)
- [x] Publikacja GitHub Pages [Coderweb]: `git push` do `MassiveDys/lokaty-i-ko`, Pages włączone (build_type: workflow), deploy zakończony sukcesem, strona odpowiada 200
