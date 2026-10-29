# STATUS - lokaty-i-ko

- **Stan:** w trakcie — frontend gotowy i przetestowany; publikacja na GitHub Pages czeka na utworzenie repozytorium `lokaty-i-ko`
- **Ostatnia zmiana:** 2026-10-29
- **Następny krok:** utworzyć puste publiczne repo `MassiveDys/lokaty-i-ko` (token OpenBot GitHub App nie ma prawa tworzenia repozytoriów), potem `git push` i włączenie Pages (build_type: workflow)

## Co działa
- Kanał projektu i instrukcje skonfigurowane
- Struktura projektu na D:\openbot\projects\lokaty-i-ko
- Plan architektury i podziału zadań (KOORDYNACJA.md)
- Moduł danych Coderdata:
  - `data/SCHEMA.md` – schemat pól rekordu oferty i logiki podatkowej
  - `data/offers.json` – baza 22 ofert z 12 polskich banków (lokaty i KO)
  - `tools/update_offers.py` – narzędzie walidacji i analizy bazy ofert (testy: PASS)
- Frontend Coderweb (`web/`):
  - `index.html`, `style.css`, `calc.js`, `app.js` – kalkulator zysku netto (Belka 19%), filtry, ranking, porównanie 2 ofert, widok kart/tabela
  - `web/data/offers.json` + `web/data/offers-data.js` (baza zapasowa dla trybu offline)
  - PWA: `sw.js`, `manifest.webmanifest`, ikony; tryb jasny/ciemny
  - `tools/test-web.mjs` – 83 asercje PASS; `tools/smoke-web.mjs` – 31 asercji PASS (Chrome headless, 360/390/1440 px)
  - `.github/workflows/pages.yml` – publikacja katalogu `web/`

## Otwarte zadania
- [x] Zadanie 1 [Coderdata]: Schemat bazy ofert + skrypt aktualizacji/pobierania + plik data/offers.json
- [ ] Zadanie 2 [Coderweb]: Frontend webowy (HTML/CSS/JS) + kalkulator zysku netto + filtry — **gotowe**; GitHub Pages — **zablokowane do czasu utworzenia repo**
- [ ] Zadanie 3 [Codertest]: Testy poprawności obliczeń i walidacja aplikacji
