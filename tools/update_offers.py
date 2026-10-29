#!/usr/bin/env python3
"""
Narzędzie do walidacji, analizy i aktualizacji bazy ofert lokat oraz kont oszczędnościowych.
Projekt: lokaty-i-ko (D:\\openbot\\projects\\lokaty-i-ko)
"""

import sys
import os
import json
import re
import urllib.request
import ssl
from datetime import datetime
from typing import Dict, Any, List, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "offers.json")
SCHEMA_PATH = os.path.join(BASE_DIR, "data", "SCHEMA.md")

REQUIRED_FIELDS = {
    "id": str,
    "bank": str,
    "name": str,
    "type": str,
    "rate": (int, float),
    "period_months": (int, float),
    "min_amount": (int, float),
    "max_amount": (int, float, type(None)),
    "capitalization": str,
    "conditions": dict,
    "url": str,
    "updated_at": str,
}

REQUIRED_CONDITIONS = {
    "new_clients_only": bool,
    "new_funds_only": bool,
    "personal_account_required": bool,
    "activity_required": bool,
    "details": str,
}

VALID_TYPES = {"lokata", "konto_oszczednosciowe"}
VALID_CAPITALIZATION = {"monthly", "at_maturity"}

SAMPLE_OFFERS = [
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
            "new_clients_only": True,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": True,
            "details": "Dla nowych klientów w ciągu 30 dni od otwarcia Nest Konta; wymagany wpływ min. 2000 zł i 3 transakcje/m-c."
        },
        "url": "https://nestbank.pl/nest-lokata-witaj/",
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
            "new_clients_only": True,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Dla nowych klientów; brak wymogu aktywności transakcyjnej dla wariantu 3-miesięcznego."
        },
        "url": "https://nestbank.pl/nest-lokata-witaj/",
        "updated_at": "2026-10-29",
        "status": "active"
    },
    {
        "id": "velobank-eko-nowe-srodki",
        "bank": "VeloBank",
        "name": "Elastyczne Konto Oszczędnościowe (Nowe Środki)",
        "type": "konto_oszczednosciowe",
        "rate": 7.0,
        "period_months": 3,
        "min_amount": 1,
        "max_amount": 100000,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": False,
            "activity_required": False,
            "details": "Promocyjne oprocentowanie przez 92 dni dla nowych środków; comiesięczna kapitalizacja odsetek."
        },
        "url": "https://www.velobank.pl/klienci-indywidualni/oszczednosci/konto-oszczednosciowe.html",
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
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": False,
            "activity_required": False,
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
        "rate": 7.0,
        "period_months": 3,
        "min_amount": 1,
        "max_amount": 50000,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": True,
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
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": True,
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
        "max_amount": None,
        "capitalization": "at_maturity",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Lokata na 6 miesięcy na nowe środki; brak górnego limitu kwoty wkładu."
        },
        "url": "https://www.bankmillennium.pl/klienci-indywidualni/produkty-oszczednosciowe/lokaty/lokata-na-nowe-srodki",
        "updated_at": "2026-10-29",
        "status": "active"
    },
    {
        "id": "pekao-konto-oszczednosciowe-promocja",
        "bank": "Bank Pekao",
        "name": "Konto Oszczędnościowe z Żubrem",
        "type": "konto_oszczednosciowe",
        "rate": 7.0,
        "period_months": 5,
        "min_amount": 1,
        "max_amount": 100000,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": True,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Promocyjne oprocentowanie przez 152 dni (ok. 5 miesięcy) dla nowych klientów otwierających Konto Przekorzystne."
        },
        "url": "https://www.pekao.com.pl/klient-indywidualny/oszczedzam-i-inwestuje/programy-oszczednosciowe/KO-promocja.html",
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
        "max_amount": None,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Roczna lokata z comiesięczną wypłatą odsetek na rachunek bieżący."
        },
        "url": "https://www.pekao.com.pl/klient-indywidualny/oszczedzam-i-inwestuje/lokata-rentierska.html",
        "updated_at": "2026-10-29",
        "status": "active"
    },
    {
        "id": "ing-oko-bonus",
        "bank": "ING Bank Śląski",
        "name": "Otwarte Konto Oszczędnościowe Bonus",
        "type": "konto_oszczednosciowe",
        "rate": 6.0,
        "period_months": 3,
        "min_amount": 1,
        "max_amount": 200000,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Podwyższone oprocentowanie przez 3 miesiące na nowe środki do kwoty 200 000 zł."
        },
        "url": "https://www.ing.pl/indywidualni/inwestycje-i-oszczednosci/konto-oszczednosciowe",
        "updated_at": "2026-10-29",
        "status": "active"
    },
    {
        "id": "ing-lokata-plus-3m",
        "bank": "ING Bank Śląski",
        "name": "Lokata Plus (3M)",
        "type": "lokata",
        "rate": 5.0,
        "period_months": 3,
        "min_amount": 1000,
        "max_amount": 100000,
        "capitalization": "at_maturity",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Stałe oprocentowanie na 3 miesiące dla obecnych i nowych posiadaczy rachunku w ING."
        },
        "url": "https://www.ing.pl/indywidualni/inwestycje-i-oszczednosci/lokata-terminowa",
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
            "new_clients_only": True,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": True,
            "details": "Dla nowych klientów; warunek odłożenia min. 100 zł miesięcznie z automatycznych końcówek transakcji."
        },
        "url": "https://www.mbank.pl/indywidualny/aplikacja-i-serwis/produkty/cele/",
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
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Lokata 6-miesięczna dla nowych środków wpłaconych do banku."
        },
        "url": "https://www.mbank.pl/indywidualny/inwestycje-i-oszczednosci/lokaty/",
        "updated_at": "2026-10-29",
        "status": "active"
    },
    {
        "id": "santander-konto-multi-oszczednosciowe",
        "bank": "Santander Bank Polska",
        "name": "Konto Multi Oszczędnościowe",
        "type": "konto_oszczednosciowe",
        "rate": 6.0,
        "period_months": 3,
        "min_amount": 1,
        "max_amount": 100000,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": False,
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
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": False,
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
        "rate": 6.0,
        "period_months": 12,
        "min_amount": 1,
        "max_amount": 10000,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": True,
            "details": "Oprocentowanie bonusowe przy regularnych miesięcznych wpłatach od 20 zł do 1000 zł."
        },
        "url": "https://www.pkobp.pl/klient-indywidualny/konta/konto-oszczednosciowe-dla-dziecka",
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
        "max_amount": None,
        "capitalization": "at_maturity",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": True,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Dla nowych środków deponowanych w PKO BP; brak górnego limitu kwoty."
        },
        "url": "https://www.pkobp.pl/klient-indywidualny/oszczedzanie-inwestycje/lokata-na-nowe-srodki",
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
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": False,
            "activity_required": False,
            "details": "Bez konieczności posiadania konta osobistego i bez warunku nowych środków; wysoki limit 400 tys. zł."
        },
        "url": "https://www.toyotabank.pl/lokata-sprint",
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
        "max_amount": None,
        "capitalization": "monthly",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": False,
            "details": "Oprocentowanie zmienne powiązane ze stawką referencyjną WIBOR 3M."
        },
        "url": "https://www.toyotabank.pl/indeksowane-konto-oszczednosciowe",
        "updated_at": "2026-10-29",
        "status": "active"
    },
    {
        "id": "bff-bank-lokata-facto-3m",
        "bank": "BFF Bank",
        "name": "Lokata Facto (3M)",
        "type": "lokata",
        "rate": 6.0,
        "period_months": 3,
        "min_amount": 5000,
        "max_amount": None,
        "capitalization": "at_maturity",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": False,
            "activity_required": False,
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
        "max_amount": None,
        "capitalization": "at_maturity",
        "conditions": {
            "new_clients_only": False,
            "new_funds_only": False,
            "personal_account_required": False,
            "activity_required": False,
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
            "new_clients_only": True,
            "new_funds_only": False,
            "personal_account_required": True,
            "activity_required": True,
            "details": "Dla nowych klientów z Kontem dla Ciebie; wymagane min. 5 płatności kartą lub BLIK w miesiącu."
        },
        "url": "https://www.credit-agricole.pl/klienci-indywidualni/oszczednosci/rachunek-oszczedzam-plus",
        "updated_at": "2026-10-29",
        "status": "active"
    }
]


def validate_offer(offer: Dict[str, Any], index: int) -> List[str]:
    errors = []
    prefix = f"Oferta #{index} ({offer.get('id', 'brak-id')})"

    for field, expected_type in REQUIRED_FIELDS.items():
        if field not in offer:
            errors.append(f"{prefix}: brakuje wymaganego pola '{field}'")
            continue
        val = offer[field]
        if not isinstance(val, expected_type):
            errors.append(f"{prefix}: pole '{field}' ma niepoprawny typ ({type(val).__name__}), oczekiwano {expected_type}")

    if "type" in offer and offer["type"] not in VALID_TYPES:
        errors.append(f"{prefix}: nieznany typ oferty '{offer['type']}', dozwolone: {VALID_TYPES}")

    if "capitalization" in offer and offer["capitalization"] not in VALID_CAPITALIZATION:
        errors.append(f"{prefix}: nieznana kapitalizacja '{offer['capitalization']}', dozwolone: {VALID_CAPITALIZATION}")

    if "rate" in offer:
        rate = offer["rate"]
        if rate <= 0 or rate > 25:
            errors.append(f"{prefix}: nierealistyczna stawka oprocentowania rate={rate}%")

    if "period_months" in offer:
        months = offer["period_months"]
        if months <= 0 or months > 120:
            errors.append(f"{prefix}: niepoprawny okres period_months={months}")

    if "min_amount" in offer and offer["min_amount"] < 0:
        errors.append(f"{prefix}: min_amount nie moze byc ujemne ({offer['min_amount']})")

    if "max_amount" in offer and offer["max_amount"] is not None:
        if "min_amount" in offer and offer["max_amount"] < offer["min_amount"]:
            errors.append(f"{prefix}: max_amount ({offer['max_amount']}) < min_amount ({offer['min_amount']})")

    if "conditions" in offer and isinstance(offer["conditions"], dict):
        cond = offer["conditions"]
        for cfield, ctype in REQUIRED_CONDITIONS.items():
            if cfield not in cond:
                errors.append(f"{prefix}: warunki (conditions) nie zawieraja pola '{cfield}'")
            elif not isinstance(cond[cfield], ctype):
                errors.append(f"{prefix}: conditions.{cfield} ma typ {type(cond[cfield]).__name__}, oczekiwano {ctype}")

    if "updated_at" in offer:
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(offer["updated_at"])):
            errors.append(f"{prefix}: format daty updated_at '{offer['updated_at']}' niezgodny z YYYY-MM-DD")

    return errors


def validate_database(filepath: str = DATA_PATH) -> Tuple[bool, List[str], Dict[str, Any]]:
    if not os.path.isfile(filepath):
        return False, [f"Plik bazy danych nie istnieje: {filepath}"], {}

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return False, [f"Blad dekodowania pliku JSON: {e}"], {}

    errors = []
    if not isinstance(data, dict):
        return False, ["Glowny obiekt JSON musi byc slownikiem"], {}

    if "offers" not in data or not isinstance(data["offers"], list):
        return False, ["Brak tablicy 'offers' w glownym obiekcie JSON"], {}

    offers = data["offers"]
    seen_ids = set()

    for idx, offer in enumerate(offers, 1):
        offer_id = offer.get("id")
        if offer_id:
            if offer_id in seen_ids:
                errors.append(f"Zduplikowane id oferty: '{offer_id}'")
            seen_ids.add(offer_id)
        else:
            errors.append(f"Oferta #{idx} nie posiada klucza 'id'")

        errs = validate_offer(offer, idx)
        errors.extend(errs)

    return len(errors) == 0, errors, data


def check_urls(filepath: str = DATA_PATH) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Weryfikuje dostępność HTTP adresów URL w bazie ofert (sprawdza czy zwracają kod 200).
    """
    if not os.path.isfile(filepath):
        print(f"Błąd: plik bazy nie istnieje: {filepath}")
        return False, []

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    offers = data.get("offers", [])
    ctx = ssl._create_unverified_context()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    }

    results = []
    all_ok = True

    print("=" * 75)
    print("WERYFIKACJA DOSTĘPNOŚCI ADRESÓW URL OFERT (HTTP STATUS CHECK)")
    print("=" * 75)

    for idx, o in enumerate(offers, 1):
        oid = o.get("id", f"oferta-{idx}")
        url = o.get("url", "")
        if not url:
            print(f"[{idx:02d}/22] [BRAK URL] {oid}")
            results.append({"id": oid, "url": "", "status": 0, "ok": False, "error": "Brak URL"})
            all_ok = False
            continue

        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=8) as r:
                final_url = r.geturl()
                status = r.status
                is_404_redirect = "404" in final_url and "404" not in url
                if is_404_redirect:
                    print(f"[{idx:02d}/22] [FAIL] {oid} -> przekierowano do 404 ({final_url})")
                    results.append({"id": oid, "url": url, "status": 404, "final_url": final_url, "ok": False, "error": "Redirected to 404"})
                    all_ok = False
                elif status == 200:
                    print(f"[{idx:02d}/22] [PASS 200] {oid} -> {url}")
                    results.append({"id": oid, "url": url, "status": 200, "final_url": final_url, "ok": True, "error": None})
                else:
                    print(f"[{idx:02d}/22] [HTTP {status}] {oid} -> {url}")
                    results.append({"id": oid, "url": url, "status": status, "final_url": final_url, "ok": False, "error": f"Status {status}"})
                    all_ok = False
        except urllib.error.HTTPError as e:
            print(f"[{idx:02d}/22] [FAIL HTTP {e.code}] {oid} -> {url}")
            results.append({"id": oid, "url": url, "status": e.code, "ok": False, "error": str(e)})
            all_ok = False
        except Exception as e:
            print(f"[{idx:02d}/22] [ERROR] {oid} -> {e} ({url})")
            results.append({"id": oid, "url": url, "status": 0, "ok": False, "error": str(e)})
            all_ok = False

    passed_count = sum(1 for r in results if r["ok"])
    print("=" * 75)
    print(f"Podsumowanie weryfikacji linków: {passed_count}/{len(offers)} poprawnych (HTTP 200).")
    if all_ok:
        print("[SUKCES] Wszystkie linki w bazie działają poprawnie (0 błędów 404).")
    else:
        print(f"[UWAGA] Wykryto {len(offers) - passed_count} niedziałających linków.")
    print("=" * 75)

    return all_ok, results


def calculate_profit(amount: float, rate_pa: float, period_months: float, capitalization: str) -> Dict[str, float]:
    tax_rate = 0.19

    if capitalization == "at_maturity":
        gross = amount * (rate_pa / 100.0) * (period_months / 12.0)
        tax = round(gross * tax_rate, 2)
        net = gross - tax
        return {
            "gross": round(gross, 2),
            "tax": tax,
            "net": round(net, 2),
            "final_amount": round(amount + net, 2)
        }
    elif capitalization == "monthly":
        current_amount = amount
        total_gross = 0.0
        total_tax = 0.0

        num_months = int(period_months)
        remainder_days = (period_months - num_months) * 30.0

        for _ in range(num_months):
            m_gross = current_amount * (rate_pa / 100.0) * (1.0 / 12.0)
            m_tax = round(m_gross * tax_rate, 2)
            m_net = m_gross - m_tax
            current_amount += m_net
            total_gross += m_gross
            total_tax += m_tax

        if remainder_days > 0:
            m_gross = current_amount * (rate_pa / 100.0) * (remainder_days / 365.0)
            m_tax = round(m_gross * tax_rate, 2)
            m_net = m_gross - m_tax
            current_amount += m_net
            total_gross += m_gross
            total_tax += m_tax

        return {
            "gross": round(total_gross, 2),
            "tax": round(total_tax, 2),
            "net": round(current_amount - amount, 2),
            "final_amount": round(current_amount, 2)
        }
    else:
        raise ValueError(f"Nieznana kapitalizacja: {capitalization}")


def print_summary(data: Dict[str, Any]):
    offers = data.get("offers", [])
    print("=" * 65)
    print(f"RAPORT BAZY OFERT LOKAT I KONT OSZCZĘDNOŚCIOWYCH")
    print(f"Wersja: {data.get('version', 'N/A')} | Data aktualizacji: {data.get('last_updated', 'N/A')}")
    print(f"Liczba ofert ogółem: {len(offers)}")
    print("=" * 65)

    lokat_count = sum(1 for o in offers if o.get("type") == "lokata")
    ko_count = sum(1 for o in offers if o.get("type") == "konto_oszczednosciowe")
    rates = [o.get("rate", 0) for o in offers]
    avg_rate = sum(rates) / len(rates) if rates else 0
    max_rate = max(rates) if rates else 0
    min_rate = min(rates) if rates else 0

    print(f"• Lokaty terminowe:         {lokat_count}")
    print(f"• Konta oszczędnościowe:    {ko_count}")
    print(f"• Oprocentowanie min/śr/max: {min_rate:.2f}% / {avg_rate:.2f}% / {max_rate:.2f}%")

    banks = {}
    for o in offers:
        b = o.get("bank", "Inny")
        banks[b] = banks.get(b, 0) + 1

    print(f"• Liczba instytucji (banki): {len(banks)}")
    print("-" * 65)
    print(f"{'Bank':<25} | {'Typ':<10} | {'Stawka':<7} | {'Okres':<6} | {'Nazwa'}")
    print("-" * 65)
    sorted_offers = sorted(offers, key=lambda x: x.get("rate", 0), reverse=True)
    for o in sorted_offers:
        typ_short = "Lokata" if o.get("type") == "lokata" else "Konto Oszcz."
        period_str = f"{o.get('period_months')}M"
        print(f"{o.get('bank', ''):<25} | {typ_short:<10} | {o.get('rate', 0):>5.2f}% | {period_str:<6} | {o.get('name', '')[:30]}")

    print("=" * 65)


def save_initial_database():
    db = {
        "version": "1.0.0",
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
        "currency": "PLN",
        "description": "Baza aktualnych ofert lokat i kont oszczędnościowych w Polsce.",
        "offers": SAMPLE_OFFERS
    }
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    print(f"Zapisano domyślną bazę {len(SAMPLE_OFFERS)} ofert do: {DATA_PATH}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Walidacja i obsługa bazy ofert lokat i KO")
    parser.add_argument("--init", action="store_true", help="Utwórz lub zresetuj bazę danymi początkowymi")
    parser.add_argument("--validate", action="store_true", help="Zweryfikuj poprawność struktury data/offers.json")
    parser.add_argument("--check-urls", action="store_true", help="Zweryfikuj dostępność HTTP adresów URL w bazie ofert")
    parser.add_argument("--summary", action="store_true", help="Wyświetl podsumowanie statystyk bazy ofert")
    parser.add_argument("--calc", nargs=3, metavar=("KWOTA", "RATE", "MONTHS"),
                        help="Przelicz przykładowy zysk netto (np. --calc 50000 7.0 3)")
    args = parser.parse_args()

    if not (args.init or args.validate or args.check_urls or args.summary or args.calc):
        if not os.path.exists(DATA_PATH):
            save_initial_database()
        args.validate = True
        args.summary = True

    if args.init:
        save_initial_database()

    if args.validate:
        ok, errors, data = validate_database()
        if ok:
            print(f"[OK] Walidacja bazy ofert zakonczona sukcesem. Liczba ofert: {len(data.get('offers', []))}")
        else:
            print(f"[BLAD] Znaleziono {len(errors)} bledow w bazie ofert:")
            for e in errors:
                print(f"  - {e}")
            sys.exit(1)

    if args.check_urls:
        ok, _ = check_urls()
        if not ok:
            sys.exit(1)

    if args.summary:
        ok, _, data = validate_database()
        if ok:
            print_summary(data)

    if args.calc:
        kwota = float(args.calc[0])
        rate = float(args.calc[1])
        months = float(args.calc[2])
        print(f"\nSymulacja zysku dla kwoty {kwota:,.2f} PLN, oprocentowania {rate}% na {months} mies.:")
        res_mat = calculate_profit(kwota, rate, months, "at_maturity")
        res_mon = calculate_profit(kwota, rate, months, "monthly")
        print(f"  • Lokata (kapitalizacja na koniec): Brutto: {res_mat['gross']:.2f} zł | Podatek: {res_mat['tax']:.2f} zł | Netto: {res_mat['net']:.2f} zł")
        print(f"  • KO (kapitalizacja miesięczna):    Brutto: {res_mon['gross']:.2f} zł | Podatek: {res_mon['tax']:.2f} zł | Netto: {res_mon['net']:.2f} zł")


if __name__ == "__main__":
    main()


