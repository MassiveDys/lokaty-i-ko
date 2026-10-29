# Schemat Danych Ofert Lokat i Kont Oszczednosciowych

Plik danych: `data/offers.json`

## Struktura glowna pliku

`data/offers.json` zawiera obiekt glowny z metadanymi oraz tablica ofert:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-10-29",
  "currency": "PLN",
  "offers": [
    { ... }
  ]
}
```

## Specyfikacja rekordu oferty (`Offer`)

Kazdy obiekt w tablicy `offers` reprezentuje pojedyncza oferte bankowa:

| Pole | Typ | Wymagane | Dozwolone wartosci / Format | Opis |
|---|---|---|---|---|
| `id` | string | Tak | kebab-case (np. `nest-bank-nest-lokata-witaj-6m`) | Unikalny identyfikator oferty |
| `bank` | string | Tak | Dowolna nazwa instytucji (np. `"Nest Bank"`) | Nazwa banku oferujacego produkt |
| `name` | string | Tak | Dowolny tekst (np. `"Nest Lokata Witaj"`) | Pelna nazwa handlowa produktu |
| `type` | string | Tak | `"lokata"` \| `"konto_oszczednosciowe"` | Rodzaj produktu finansowego |
| `rate` | number | Tak | float > 0 (np. `7.1`) | Nominalne roczne oprocentowanie brutto (% p.a.) |
| `period_months` | number | Tak | int > 0 (np. `3`, `6`, `12`) | Czas trwania lokaty lub okres promocji na KO w miesiacach |
| `min_amount` | number | Tak | float >= 0 (np. `1000`) | Minimalna kwota wkladu w PLN |
| `max_amount` | number \| null | Tak | float > min_amount lub `null` (brak limitu) | Maksymalna kwota objeta promocyjnym oprocentowaniem w PLN |
| `capitalization` | string | Tak | `"monthly"` \| `"at_maturity"` | Czestotliwosc kapitalizacji odsetek |
| `conditions` | object | Tak | Obiekt warunkow (patrz nizej) | Zestaw flag i warunkow dodatkowych |
| `conditions.new_clients_only` | boolean | Tak | `true` \| `false` | Czy oferta jest wylacznie dla nowych klientow |
| `conditions.new_funds_only` | boolean | Tak | `true` \| `false` | Czy oferta obowiazuje tylko na nowe srodki |
| `conditions.personal_account_required` | boolean | Tak | `true` \| `false` | Czy wymagane jest posiadanie/zalozenie konta osobistego |
| `conditions.activity_required` | boolean | Tak | `true` \| `false` | Czy wymagana jest comiesieczna aktywnosc (wplywy, platnosci) |
| `conditions.details` | string | Tak | Tekst | Czytelny dla uzytkownika opis warunkow promocji |
| `url` | string | Tak | Prawidlowy URL HTTP/HTTPS | Bezposredni link do strony informacyjnej / regulaminu |
| `updated_at` | string | Tak | Format ISO `YYYY-MM-DD` | Data weryfikacji i wprowadzenia oferty do bazy |
| `status` | string | Opcjonalne | `"active"` \| `"expired"` | Status oferty (domyslnie `"active"`) |

## Obliczanie zysku netto (podatek Belki)

Wzor matematyczny wykorzystywany w kalkulatorze frontendowym oraz testach QA:
- **Lokata z kapitalizacja na koniec okresu (`at_maturity`)**:
  - Odsetki brutto: `Z_brutto = Kwota * (Oprocentowanie / 100) * (Miesiace / 12)`
  - Podatek Belki (19%): `Podatek = round_down(Z_brutto * 0.19, 2)` (wg ordynacji podatkowej zaokraglenie w dol lub standardowo z dokladnoscia do grosza)
  - Odsetki netto: `Z_netto = Z_brutto - Podatek`
- **Konto oszczednosciowe z kapitalizacja miesieczna (`monthly`)**:
  - Dla kazdego z `M` miesiecy:
    - `Odsetki_m_brutto = Saldo_m * (Oprocentowanie / 100) * (1 / 12)`
    - `Podatek_m = round(Odsetki_m_brutto * 0.19, 2)`
    - `Saldo_{m+1} = Saldo_m + (Odsetki_m_brutto - Podatek_m)`
  - Suma zysku netto = `Saldo_koncowe - Kwota_poczatkowa`
