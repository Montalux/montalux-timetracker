# Montalux Timetracker

Einfache Zeiterfassungs-App für die Montalux AG. Erfasst Zeit- und Materialbuchungen pro Mitarbeiter und Kunde.

## Features

- **Zeitbuchung** mit manueller Dauer (5/15/30/60 min oder freie Eingabe) oder Start/Stop-Timer
- **Materialbuchung** mit Menge und Betrag
- **Timer-Modus** mit Live-Anzeige, localStorage-Persistenz und automatischer Wiederherstellung
- **Übersicht** aller Buchungen mit Filtern (Mitarbeiter, Kunde, Datum, Typ)
- **CSV-Export** der gefilterten Einträge
- **Verwaltung** von Mitarbeitern, Kunden und Leistungen (mit Aktivierung/Deaktivierung)
- **Automatische Backups** der SQLite-Datenbank (täglich, max. 15)

## Tech-Stack

- Python / Flask
- SQLite (WAL-Modus)
- Tailwind CSS + DaisyUI
- Vanilla JavaScript

## Installation

```bash
pip install -r requirements.txt
python3 app.py
```

Die App läuft auf **http://localhost:5001**.

## Erster Start

1. App starten
2. Unter "Verwaltung" Mitarbeiter, Kunden und Leistungen anlegen
3. Auf der Startseite Buchungen erfassen
