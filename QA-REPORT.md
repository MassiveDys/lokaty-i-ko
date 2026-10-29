# Raport QA — Porownywarka i Kalkulator Lokat oraz Kont Oszczednosciowych

- **Data testow:** 2026-10-29
- **Tester:** Codertest (QA Agent)
- **Status:** **PASS** (100% testow zaliczonych)
- **Katalog projektu:** `D:\openbot\projects\lokaty-i-ko`
- **Artefakty dowodowe:** `D:\openbot\qa\lokaty-i-ko-2026-10-29` oraz `D:\openbot\projects\lokaty-i-ko\qa`

---

## 1. Testowane artefakty i sumy kontrolne

| Plik | Rozmiar | SHA-256 |
|---|---|---|
| `web/index.html` | 13.8 KB | `86ABD9A9F0427935275D07CAB43C353422B39641F581A2276F38F1105F223D84` |
| `web/calc.js` | 3.6 KB | `209FB99858524E7E5F8EA7756615BA5D9905E945B67977E5BE95B991812F6180` |
| `web/app.js` | 27.2 KB | `CC57F33DBA9BB436027A0FE0233C322FAAB006768B6003EDF6AF90F60E726211` |
| `data/offers.json` | 16.5 KB | `E97A1DB6B9DAA8436740A79C3B8D784C8676D2AD75D2A48606C658D59FEB0600` |

---

## 2. Podsumowanie wykonanych pakietow testowych

| Pakiet testowy | Narzedzie | Liczba przypadkow | Wynik |
|---|---|---|---|
| **Niezalezny pakiet QA Codertest** | `tools/qa-suite.mjs` | **554** asercje | **PASS** (0 bledow) |
| **Testy jednostkowe frontendu** | `tools/test-web.mjs` | **83** przypadki | **PASS** (0 bledow) |
| **Smoke testy w Chrome Headless (CDP)** | `tools/smoke-web.mjs` | **31** sprawdzen | **PASS** (0 bledow) |
| **Walidacja bazy ofert Python** | `tools/update_offers.py` | 22 rekordy | **PASS** (0 bledow) |
| **LACZNIE** | — | **668+** sprawdzen | **PASS** |

---

## 3. Szczegolowe wyniki wedlug obszarow

### 3.1. Matematyka finansowa i podatkowa
- **Podatek Belki (19%):** Formuly poprawnie obliczaja 19% podatku od odsetek z zaokragleniem handlowym (*half-up*) do 1 grosza (`round2`), zgodnie z polska ordynacja podatkowa.
- **Lokaty terminowe (`at_maturity`):** Kapitalizacja na koniec okresu liczona wg wzoru `amount * (rate / 100) * (months / 12)`.
- **Konta oszczednosciowe (`monthly`):** Kapitalizacja comiesieczna z procentem skladanym (naliczanie odsetek za kazdy miesiac, potracenie podatku i zwiekszenie salda). Wyniki netto dla KO sa systemowo wyzsze niz dla lokat o identycznym oprocentowaniu nominalnym.
- **Kwoty graniczne i limity:**
  - Kwota ponizej `min_amount`: oferta poprawnie oznaczona flaga `tooSmall` i wykluczana z kalkulatora.
  - Kwota powyzej `max_amount`: naliczanie zysku ograniczone scisle do limitu promocyjnego (`capped = true`, `principal = max_amount`).
  - Horyzont krotszy niz okres oferty: naliczanie zysku tylko za wskazany horyzont (`shortened = true`).
  - Przypadki brzegowe (0 PLN, stawka 0%, okres 0 miesiecy): prawidlowe zwracanie 0 zysku netto bez dzielenia przez zero czy bledow NaN.

### 3.2. Spojnosc i jakosc bazy danych (`data/offers.json`)
- Baza zawiera **22 oferty** z **12 wiodacych bankow** w Polsce.
- 12 lokat terminowych (okresy 2–12 miesiecy) oraz 10 kont oszczednosciowych (okresy 3–12 miesiecy).
- Wszystkie identyfikatory `id` sa unikalne i zgodne z konwencja kebab-case.
- Oprocentowanie realne w zakresie 5.00% – 7.50% p.a.
- Kazdy rekord posiada poprawne flagi warunkow dodatkowych (`new_clients_only`, `new_funds_only`, `personal_account_required`, `activity_required`).
- Plik `web/data/offers.json` oraz modul fallback `web/data/offers-data.js` sa w pelni zsynchronizowane z glowna baza `data/offers.json`.

### 3.3. Funkcjonalnosc i filtry UI
- **Filtr rodzaju:**
  - `Wszystko`: 22 oferty
  - `Lokaty`: 12 ofert
  - `Konta oszczednosciowe`: 10 ofert
- **Filtry warunkow (koniunkcja AND):**
  - `Bez konta osobistego` (filtruje oferty wymagajace ROR)
  - `Dla obecnych klientow` (filtruje oferty wylacznie dla nowych klientow)
  - `Bez nowych srodkow` (filtruje oferty z wymogiem wplaty swiezych srodkow)
  - `Bez wymogu aktywnosci` (filtruje oferty z warunkiem platnosci karta/wplywow)
- **Sortowanie:**
  - Zysk netto (malejaco)
  - Stawka oprocentowania (% p.a. malejaco)
  - Maksymalna kwota (oferty bez limitu na poczatku)
  - Stopa netto w skali roku (% p.a.)
  - Okres trwania (rosnaco)
- **Porownywarka A/B:**
  - Prawidlowo zestawia 2 wybrane oferty w oknie modalnym `<dialog>`.
  - Wskazuje oferte z wiekszym zyskiem netto odznaka `lepszy` (`.cmp-win`).
  - Wyroznia roznice w kwocie liczonej, podatku Belki i warunkach promocji.

### 3.4. Testy przegladarkowe (Chrome Headless CDP)
- **Konsola JS:** 0 bledow, 0 wyjatkow Runtime, 0 ostrzezen.
- **Responsywnosc:**
  - Desktop 1440 px: pelny uklad siatki i tabeli.
  - Mobile 390 px / 360 px: brak poziomego paska przewijania (`scrollWidth <= clientWidth`).
- **Przelacznik motywu:** poprawna zmiana motywu jasnego i ciemnego (`data-theme="light" | "dark"`).
- **Offline i PWA:** rejestracja Service Workera (`sw.js`) oraz poprawne dzialanie z wbudowanego seedu danych.
- **Lokalny import JSON:** prawidlowe wczytanie zewnetrznego pliku ofert przez `#fileInput` oraz przywrocenie bazy domyslnej przyciskiem `#restoreData`.

---

## 4. Zapisane dowody i zrzuty ekranu

W katalogu `D:\openbot\qa\lokaty-i-ko-2026-10-29`:
1. `desktop.png` — widok desktopowy aplikacji (tryb ciemny).
2. `desktop-jasny.png` — widok desktopowy aplikacji (tryb jasny).
3. `karty-ciemne.png` — karty ofert z wyliczonym zyskiem netto i tagami warunkow.
4. `porownanie.png` — otwarte okno modalne porownania A/B dwoch ofert.
5. `mobile.png` — widok mobilny na ekranie smartfona (390 px).
6. `mobile-karty.png` — uklad kart na urzadzeniu mobilnym.

---

## 5. Wnioski i ocena koncowa

Aplikacja spelnia wszystkie wymagania funkcjonalne, matematyczne i jakosciowe. Obliczenia podatku Belki i kapitalizacji sa w 100% precyzyjne. Frontend jest responsywny, szybki i stabilny.
Ocena koncowa: **PASS**.
