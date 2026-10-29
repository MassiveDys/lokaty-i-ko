# KOORDYNACJA PROJEKTU: lokaty-i-ko

## Cel
Aplikacja webowa publikowana na GitHub Pages: Nowoczesna porównywarka i kalkulator lokat bankowych oraz kont oszczędnościowych (KO) w Polsce, z modułem aktualizacji i przechowywania bazy aktualnych ofert bankowych (JSON/skrypt).

## Główne moduły i wymagania
1. **Baza i moduł aktualizacji ofert (backend/scraper/data)**:
   - Struktura danych ofert (`data/offers.json`):
     - Nazwa banku, nazwa produktu, typ (lokata / konto oszczędnościowe).
     - Oprocentowanie nominalne (% p.a.).
     - Okres (w miesiącach / dniach).
     - Kwota minimalna i maksymalna.
     - Warunki dodatkowe: wymagane konto osobiste, nowe środki, nowi klienci, warunki transakcyjne (płatności kartą/wpływ).
     - Częstotliwość kapitalizacji (miesięczna / na koniec okresu).
     - Data weryfikacji oferty i status ważności.
   - Narzędzie/skrypt do walidacji, aktualizacji i odświeżania bazy (`tools/update_offers.py` lub moduł pobierający z publicznych agregatorów/serwisów finansowych).

2. **Frontend webowy (GitHub Pages)**:
   - Nowoczesny, responsywny interfejs (czysty HTML/CSS/JS bez ciężkich frameworków, wzorowany na kalkulatorze obligacji).
   - Dynamiczny kalkulator zysku netto po podatku Belki (19%) dla zadanej kwoty i horyzontu.
   - Filtry i ranking:
     - Filtrowanie po typie (Lokaty / KO / Wszystko).
     - Filtrowanie po warunkach: bez konta osobistego, bez nowych środków, dla obecnych klientów.
     - Sortowanie wg realnego zysku netto, oprocentowania brutto, maksymalnej kwoty.
     - Porównanie ofert A/B obok siebie.
   - Działanie offline / PWA i statyczny deployment na GitHub Pages.

3. **Weryfikacja QA (Codertest)**:
   - Testy matematyczne naliczania odsetek i podatku Belki dla różnych kapitalizacji.
   - Testy integralności bazy ofert JSON i filtrów UI.

## Podział ról i plan realizacji
- **Zadanie 1 [Coderdata]**: Opracowanie schematu danych, przygotowanie bazy aktualnych ofert `data/offers.json` oraz skryptu do aktualizacji i walidacji bazy ofert.
- **Zadanie 2 [Coderweb]**: Budowa aplikacji webowej w `web/` (HTML/CSS/JS, kalkulator, filtry, kafelki, wykresy/tabela) i przygotowanie publikacji GitHub Pages.
- **Zadanie 3 [Codertest]**: Testy QA kalkulatora, bazy danych oraz interfejsu webowego.

## Status realizacji
- Faza: Inicjalizacja projektu, konfiguracja kanału, instrukcji i planu koordynacji.
