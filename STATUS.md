# STATUS - lokaty-i-ko

- **Stan:** w trakcie (Zadanie 1 i Zadanie 2 ukończone lokalnie; trwa Zadanie 3 testy QA u Codertest; publikacja GitHub Pages oczekuje na utworzenie repozytorium przez użytkownika)
- **Ostatnia zmiana:** 2026-10-29
- **Następny krok:** Raport QA od Codertest oraz utworzenie repozytorium na GitHubie przez użytkownika w celu dokończenia publikacji na GitHub Pages

## Co działa
- Kanał projektu i instrukcje skonfigurowane
- Baza ofert: 22 oferty z 12 polskich banków w `data/offers.json` i `web/data/offers.json`
- Narzędzie walidacji: `tools/update_offers.py` (walidacja: OK)
- Pełna aplikacja webowa w `web/`:
  - Kalkulator zysku netto po podatku Belki (19%) z kapitalizacją na koniec vs miesięczną
  - Filtry typu, 4 filtry warunków, 5 rodzajów sortowania, ranking kart i widok tabeli
  - Porównywarka A/B dwóch ofert
  - Wsparcie PWA / offline (`sw.js`, `manifest.webmanifest`)
  - Testy Coderweb: 83 testy jednostkowe (`test-web.mjs`) + 31 testów przeglądarkowych (`smoke-web.mjs`) – wszystkie PASS
- Podgląd lokalny: `http://127.0.0.1:8765/` (`python -m http.server 8765` w katalogu `web/`)

## W toku
- [x] Zadanie 1 [Coderdata]: Schemat bazy ofert + skrypt aktualizacji/pobierania + plik data/offers.json
- [x] Zadanie 2 [Coderweb]: Frontend webowy (HTML/CSS/JS) + kalkulator zysku netto + filtry + widok tabeli/kart
- [ ] Zadanie 3 [Codertest]: Niezależna weryfikacja QA (obliczenia finansowe, filtry, walidacja)
- [ ] Publikacja na GitHub Pages: blokada API (potrzebne utworzenie pustego repo `lokaty-i-ko` przez użytkownika)

