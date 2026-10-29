# CHANGELOG

## [2026-10-29] Poprawa linków URL w bazie ofert (Coderdata)
- Przeprowadzono kompleksowy audyt i testy wszystkich 22 adresów URL ofert lokat i KO.
- Poprawiono linki prowadzące do błędów 404 (m.in. Nest Bank, VeloBank, Millennium, Pekao, ING Bank Śląski, mBank, PKO BP, Toyota Bank).
- Zaktualizowano `data/offers.json`, `web/data/offers.json` oraz `web/data/offers-data.js`.
- Rozszerzono `tools/update_offers.py` o opcję `--check-urls` weryfikującą kody odpowiedzi HTTP oraz obsługującą przekierowania i nagłówki User-Agent.
- Wynik weryfikacji linków: 22/22 PASS (kod HTTP 200, 0 błędów 404).

## [2026-10-29] Publikacja GitHub Pages (Coderweb)
- Wypchnięto repozytorium do `https://github.com/MassiveDys/lokaty-i-ko` (gałąź `main`).
- Włączono GitHub Pages z `build_type: workflow`; workflow `.github/workflows/pages.yml` buduje katalog `web/`.
- Deploy zakończony sukcesem; strona **https://massivedys.github.io/lokaty-i-ko/** odpowiada 200 (HTML, CSS, JS, JSON, ikony).
- Smoke test na wersji produkcyjnej (Chrome headless): 31/31 PASS, 0 błędów konsoli; szerokości 1440/390/360 px bez przewijania poziomego.
- Dodano `enablement: true` w `actions/configure-pages`, aby Pages włączało się automatycznie przy pierwszym wdrożeniu.

## [2026-10-29] Zadanie 2 (Coderweb) - frontend web + GitHub Pages
- Zbudowano aplikację w `web/`: `index.html`, `style.css`, `calc.js`, `app.js` (czysty HTML/CSS/JS, bez frameworków i CDN).
- Kalkulator zysku netto z podatkiem Belki (19%): kapitalizacja miesięczna dla KO i na koniec dla lokat, limity `max_amount`, minimum `min_amount`, skrócony horyzont.
- Filtry: typ produktu, 4 filtry warunków, wyszukiwanie banku/produktu, 5 trybów sortowania, ranking z pozycjami, widok kart i tabeli.
- Porównanie 2 ofert w oknie dialogowym (brutto, podatek, netto, wypłata, stopa netto, warunki).
- Panel bazy: data aktualizacji, liczba ofert i banków, wczytywanie nowego pliku JSON, powrót do bazy domyślnej.
- PWA/offline: `sw.js`, `manifest.webmanifest`, ikony, baza zapasowa `web/data/offers-data.js`.
- Tryb jasny/ciemny, zapamiętywanie ustawień w `localStorage`, responsywność 360-1440 px.
- Dodano testy: `tools/test-web.mjs` (83 asercje) i `tools/smoke-web.mjs` (31 asercji w Chrome headless + zrzuty ekranu) - PASS.
- Dodano `.github/workflows/pages.yml` (publikacja katalogu `web/` na GitHub Pages) oraz `.gitignore`.
- Aktualizacja `README.md` o opis wersji web, uruchomienie, testy i publikację.

## [2026-10-29] Zadanie 1 (Coderdata)
- Utworzono specyfikację formatu bazy ofert: `data/SCHEMA.md`.
- Przygotowano bazę aktualnych polskich ofert lokat i kont oszczędnościowych: `data/offers.json` (22 oferty z 12 czołowych banków).
- Napisano narzędzie `tools/update_offers.py` do walidacji spójności bazy, raportowania statystyk oraz symulacji odsetek netto.
- Przeprowadzono pełną walidację (status: PASS).
