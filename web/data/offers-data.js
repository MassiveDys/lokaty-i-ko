/* Kopia zapasowa bazy ofert dla trybu offline i pliku:// (generowana z data/offers.json). */
window.LK_OFFERS_SEED = {
  "version": "1.0.0",
  "last_updated": "2026-10-29",
  "currency": "PLN",
  "description": "Baza aktualnych ofert lokat i kont oszczędnościowych w Polsce.",
  "offers": [
    {
      "id": "nest-bank-nest-lokata-witaj-6m",
      "bank": "Nest Bank",
      "name": "Nest Lokata Witaj (6M)",
      "type": "lokata",
      "rate": 7.1,
      "period_months": 6,
      "min_amount": 1000,
      "max_amount": 25000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": true,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": true,
        "details": "Dla nowych klientów w ciągu 30 dni od otwarcia Nest Konta; wymagany wpływ min. 2000 zł i 3 transakcje/m-c."
      },
      "url": "https://nestbank.pl/osoby-prywatne/oszczednosci/nest-lokata-witaj",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "nest-bank-nest-lokata-witaj-3m",
      "bank": "Nest Bank",
      "name": "Nest Lokata Witaj (3M)",
      "type": "lokata",
      "rate": 7.1,
      "period_months": 3,
      "min_amount": 1000,
      "max_amount": 25000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": true,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Dla nowych klientów; brak wymogu aktywności transakcyjnej dla wariantu 3-miesięcznego."
      },
      "url": "https://nestbank.pl/osoby-prywatne/oszczednosci/nest-lokata-witaj",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "velobank-eko-nowe-srodki",
      "bank": "VeloBank",
      "name": "Elastyczne Konto Oszczędnościowe (Nowe Środki)",
      "type": "konto_oszczednosciowe",
      "rate": 7,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 100000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": false,
        "activity_required": false,
        "details": "Promocyjne oprocentowanie przez 92 dni dla nowych środków; comiesięczna kapitalizacja odsetek."
      },
      "url": "https://www.velobank.pl/klienci-indywidualni/oszczednosci/elastyczne-konto-oszczednosciowe.html",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "velobank-lokata-na-nowe-srodki-2m",
      "bank": "VeloBank",
      "name": "Lokata na Nowe Środki (2M)",
      "type": "lokata",
      "rate": 6.8,
      "period_months": 2,
      "min_amount": 5000,
      "max_amount": 150000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": false,
        "activity_required": false,
        "details": "Dla nowych środków względem daty salda referencyjnego; nie wymaga konta osobistego."
      },
      "url": "https://www.velobank.pl/klienci-indywidualni/oszczednosci/lokata-na-nowe-srodki.html",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "alior-bank-konto-mega-oszczednosciowe",
      "bank": "Alior Bank",
      "name": "Konto Mega Oszczędnościowe (Bonus)",
      "type": "konto_oszczednosciowe",
      "rate": 7,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 50000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": true,
        "details": "Promocja na nowe środki na 3 miesiące; wyższa stawka przy min. 5 płatnościach kartą/BLIK w miesiącu."
      },
      "url": "https://www.aliorbank.pl/dodatkowe-korzysci/konto-mega-oszczednosciowe.html",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "millennium-konto-profit",
      "bank": "Bank Millennium",
      "name": "Konto Oszczędnościowe Profit",
      "type": "konto_oszczednosciowe",
      "rate": 6.5,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 100000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": true,
        "details": "91 dni podwyższonego oprocentowania na nowe środki; premia za min. 5 transakcji kartą/BLIK."
      },
      "url": "https://www.bankmillennium.pl/klienci-indywidualni/produkty-oszczednosciowe/rachunki-oszczednosciowe/konto-oszczednosciowe-profit",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "millennium-lokata-horyzont-zysku-6m",
      "bank": "Bank Millennium",
      "name": "Lokata Horyzont Zysku (6M)",
      "type": "lokata",
      "rate": 5.8,
      "period_months": 6,
      "min_amount": 1000,
      "max_amount": null,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Lokata na 6 miesięcy na nowe środki; brak górnego limitu kwoty wkładu."
      },
      "url": "https://www.bankmillennium.pl/klienci-indywidualni/produkty-oszczednosciowe/lokaty-terminowe/lokata-horyzont-zysku",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "pekao-konto-oszczednosciowe-promocja",
      "bank": "Bank Pekao",
      "name": "Konto Oszczędnościowe z Żubrem",
      "type": "konto_oszczednosciowe",
      "rate": 7,
      "period_months": 5,
      "min_amount": 1,
      "max_amount": 100000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": true,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Promocyjne oprocentowanie przez 152 dni (ok. 5 miesięcy) dla nowych klientów otwierających Konto Przekorzystne."
      },
      "url": "https://www.pekao.com.pl/klient-indywidualny/oszczedzaj-i-inwestuj/rachunki-oszczednosciowe/konto-oszczednosciowe.html",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "pekao-lokata-rentierska-12m",
      "bank": "Bank Pekao",
      "name": "Lokata Rentierska (12M)",
      "type": "lokata",
      "rate": 5.5,
      "period_months": 12,
      "min_amount": 5000,
      "max_amount": null,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Roczna lokata z comiesięczną wypłatą odsetek na rachunek bieżący."
      },
      "url": "https://www.pekao.com.pl/klient-indywidualny/oszczedzaj-i-inwestuj/lokaty-terminowe.html",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "ing-oko-bonus",
      "bank": "ING Bank Śląski",
      "name": "Otwarte Konto Oszczędnościowe Bonus",
      "type": "konto_oszczednosciowe",
      "rate": 6,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 200000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Podwyższone oprocentowanie przez 3 miesiące na nowe środki do kwoty 200 000 zł."
      },
      "url": "https://www.ing.pl/indywidualni/oszczednosci-i-inwestycje/konta-oszczednosciowe/otwarte-konto-oszczednosciowe",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "ing-lokata-plus-3m",
      "bank": "ING Bank Śląski",
      "name": "Lokata Plus (3M)",
      "type": "lokata",
      "rate": 5,
      "period_months": 3,
      "min_amount": 1000,
      "max_amount": 100000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Stałe oprocentowanie na 3 miesiące dla obecnych i nowych posiadaczy rachunku w ING."
      },
      "url": "https://www.ing.pl/indywidualni/oszczednosci-i-inwestycje/lokaty/lokata-plus",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "mbank-moje-cele-oszczednosciowe",
      "bank": "mBank",
      "name": "mKonto Oszczędnościowe Moje Cele",
      "type": "konto_oszczednosciowe",
      "rate": 6.8,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 50000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": true,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": true,
        "details": "Dla nowych klientów; warunek odłożenia min. 100 zł miesięcznie z automatycznych końcówek transakcji."
      },
      "url": "https://www.mbank.pl/indywidualny/oszczednosci/konta-oszczednosciowe/moje-cele/",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "mbank-lokata-na-nowe-srodki-6m",
      "bank": "mBank",
      "name": "Lokata na Nowe Środki (6M)",
      "type": "lokata",
      "rate": 5.6,
      "period_months": 6,
      "min_amount": 1000,
      "max_amount": 500000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Lokata 6-miesięczna dla nowych środków wpłaconych do banku."
      },
      "url": "https://www.mbank.pl/indywidualny/oszczednosci/lokaty/lokata-na-nowe-srodki/",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "santander-konto-multi-oszczednosciowe",
      "bank": "Santander Bank Polska",
      "name": "Konto Multi Oszczędnościowe",
      "type": "konto_oszczednosciowe",
      "rate": 6,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 100000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Promocja na nowe środki; elastyczny dostęp i wypłaty bez utraty odsetek."
      },
      "url": "https://www.santander.pl/klient-indywidualny/oszczednosci-i-inwestycje/konto-multi-oszczednosciowe",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "santander-lokata-mobilna-3m",
      "bank": "Santander Bank Polska",
      "name": "Lokata Mobilna (3M)",
      "type": "lokata",
      "rate": 5.5,
      "period_months": 3,
      "min_amount": 1000,
      "max_amount": 20000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Dostępna do założenia wyłącznie w aplikacji Santander mobile; stałe oprocentowanie."
      },
      "url": "https://www.santander.pl/klient-indywidualny/oszczednosci-i-inwestycje/lokata-mobilna",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "pko-bp-pierwsze-konto-oszczednosciowe",
      "bank": "PKO Bank Polski",
      "name": "Pierwsze Konto Oszczędnościowe",
      "type": "konto_oszczednosciowe",
      "rate": 6,
      "period_months": 12,
      "min_amount": 1,
      "max_amount": 10000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": true,
        "details": "Oprocentowanie bonusowe przy regularnych miesięcznych wpłatach od 20 zł do 1000 zł."
      },
      "url": "https://www.pkobp.pl/klienci-indywidualni/oszczednosci/konta-oszczednosciowe/pierwsze-konto-oszczednosciowe/",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "pko-bp-lokata-na-nowe-srodki-3m",
      "bank": "PKO Bank Polski",
      "name": "Lokata na Nowe Środki (3M)",
      "type": "lokata",
      "rate": 5.5,
      "period_months": 3,
      "min_amount": 1000,
      "max_amount": null,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": true,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Dla nowych środków deponowanych w PKO BP; brak górnego limitu kwoty."
      },
      "url": "https://www.pkobp.pl/klienci-indywidualni/oszczednosci/lokaty/lokata-na-nowe-srodki/",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "toyota-bank-lokata-sprint-6m",
      "bank": "Toyota Bank",
      "name": "Lokata Sprint (6M)",
      "type": "lokata",
      "rate": 6.5,
      "period_months": 6,
      "min_amount": 3000,
      "max_amount": 400000,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": false,
        "activity_required": false,
        "details": "Bez konieczności posiadania konta osobistego i bez warunku nowych środków; wysoki limit 400 tys. zł."
      },
      "url": "https://www.toyotabank.pl/dla-ciebie/oszczednosci/lokata-sprint",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "toyota-bank-indeksowane-konto-oszczednosciowe",
      "bank": "Toyota Bank",
      "name": "Indeksowane Konto Oszczędnościowe (WIBOR 3M)",
      "type": "konto_oszczednosciowe",
      "rate": 5.85,
      "period_months": 12,
      "min_amount": 1,
      "max_amount": null,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": false,
        "details": "Oprocentowanie zmienne powiązane ze stawką referencyjną WIBOR 3M."
      },
      "url": "https://www.toyotabank.pl/dla-ciebie/oszczednosci/indeksowane-konto-oszczednosciowe",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "bff-bank-lokata-facto-3m",
      "bank": "BFF Bank",
      "name": "Lokata Facto (3M)",
      "type": "lokata",
      "rate": 6,
      "period_months": 3,
      "min_amount": 5000,
      "max_amount": null,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": false,
        "activity_required": false,
        "details": "Gwarancja włoskiego funduszu FITD do 100 000 EUR; nie wymaga płatnego konta ROR."
      },
      "url": "https://www.lokatafacto.pl/",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "bff-bank-lokata-facto-6m",
      "bank": "BFF Bank",
      "name": "Lokata Facto (6M)",
      "type": "lokata",
      "rate": 5.8,
      "period_months": 6,
      "min_amount": 5000,
      "max_amount": null,
      "capitalization": "at_maturity",
      "conditions": {
        "new_clients_only": false,
        "new_funds_only": false,
        "personal_account_required": false,
        "activity_required": false,
        "details": "Stałe oprocentowanie na 6 miesięcy; brak konieczności posiadania konta osobistego."
      },
      "url": "https://www.lokatafacto.pl/",
      "updated_at": "2026-10-29",
      "status": "active"
    },
    {
      "id": "credit-agricole-rachunek-oszczedzam",
      "bank": "Credit Agricole",
      "name": "Rachunek Oszczędzam (Na start)",
      "type": "konto_oszczednosciowe",
      "rate": 7.5,
      "period_months": 3,
      "min_amount": 1,
      "max_amount": 50000,
      "capitalization": "monthly",
      "conditions": {
        "new_clients_only": true,
        "new_funds_only": false,
        "personal_account_required": true,
        "activity_required": true,
        "details": "Dla nowych klientów z Kontem dla Ciebie; wymagane min. 5 płatności kartą lub BLIK w miesiącu."
      },
      "url": "https://www.credit-agricole.pl/klienci-indywidualni/oszczednosci-i-inwestycje/rachunek-oszczedzam",
      "updated_at": "2026-10-29",
      "status": "active"
    }
  ]
};
