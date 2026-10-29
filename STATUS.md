# STATUS - lokaty-i-ko

- **Stan:** w trakcie wdrażania (Zadanie 1, 2 i 3 zakończone sukcesem; trwa publikacja GitHub Pages przez Coderweb)
- **Ostatnia zmiana:** 2026-10-29
- **Następny krok:** Zakończenie wdrożenia na GitHub Pages i oddanie linku produkcyjnego

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

## Stan zadań
- [x] Zadanie 1 [Coderdata]: Schemat bazy ofert + skrypt aktualizacji/pobierania + plik data/offers.json
- [x] Zadanie 2 [Coderweb]: Frontend webowy (HTML/CSS/JS) + kalkulator zysku netto + filtry + widok tabeli/kart
- [x] Zadanie 3 [Codertest]: Niezależna weryfikacja QA (668+ testów PASS, raport QA-REPORT.md)
- [ ] Publikacja GitHub Pages [Coderweb]: trwa wykonywanie `git push` do repozytorium `MassiveDys/lokaty-i-ko` i konfiguracja GitHub Actions
