# STATUS - lokaty-i-ko

- **Stan:** w trakcie wdrażania poprawek (Linki 404 naprawione przez Coderdata; trwa push i deploy na GitHub Pages przez Coderweb)
- **Ostatnia zmiana:** 2026-10-29
- **Następny krok:** Potwierdzenie aktualizacji produkcji przez Coderweb

## Co działa
- Produkcyjna strona na GitHub Pages: https://massivedys.github.io/lokaty-i-ko/
- Baza 22 ofert lokat i KO – wszystkie 22 adresy URL zweryfikowane ze statusem HTTP 200 (brak 404)
- Skrypt walidacji `tools/update_offers.py --check-urls` (PASS 22/22)
- Testy jednostkowe i integracyjne: PASS (668+ asercji)
- PWA/offline, kalkulator zysków netto Belka 19%, filtry i ranking

## Stan zadań
- [x] Naprawa linków [Coderdata]: commit `d15d36c`, 22/22 adresy URL z kodem 200
- [ ] Deploy na GitHub Pages [Coderweb]: push na `origin main` i weryfikacja produkcji
