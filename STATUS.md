# STATUS - lokaty-i-ko

- **Stan:** w trakcie poprawek (Zgłoszenie użytkownika: linki do ofert zwracają 404; trwa naprawa URL-i przez Coderdata)
- **Ostatnia zmiana:** 2026-10-29
- **Następny krok:** Coderdata poprawia linki w bazie, Coderweb aktualizuje frontend i wdraża na GitHub Pages

## Co działa
- Produkcyjna strona na GitHub Pages: https://massivedys.github.io/lokaty-i-ko/
- Baza 22 ofert lokat i KO
- Pełny kalkulator finansowy netto (Belka 19%), filtry, ranking, porównanie A/B, PWA/offline
- Testy QA (Codertest): PASS (668+ asercji)

## Otwarte poprawki
- [ ] Poprawa adresów URL w `data/offers.json`: wykryto błędy 404 m.in. w Nest Bank, ING, mBank, VeloBank, Millennium, PKO BP
- [ ] Aktualizacja `web/data/offers.json` i `web/data/offers-data.js`
- [ ] Re-deploy na GitHub Pages
