# Montalux Timetracker

Einfache Zeiterfassungs-App für Montalux. Erfasst Zeit- und Materialbuchungen pro Mitarbeiter und Kunde.

Live: **[Montalux.pythonanywhere.com](https://Montalux.pythonanywhere.com)**

## Features

- **Zeitbuchung** mit manueller Dauer (5/15/30/60 min oder freie Eingabe) oder Start/Stop-Timer
- **Materialbuchung** mit Menge und Betrag
- **Timer-Modus** mit Live-Anzeige, localStorage-Persistenz und automatischer Wiederherstellung
- **Übersicht** aller Buchungen mit Filtern (Mitarbeiter, Kunde, Datum, Typ)
- **CSV-Export** der gefilterten Einträge
- **Verwaltung** von Mitarbeitern, Kunden und Leistungen (mit Aktivierung/Deaktivierung)
- **Passwortschutz** — gemeinsames Passwort für das Team
- **Automatische Backups** der SQLite-Datenbank (täglich, max. 15)
- **CSRF-Schutz** auf allen Formularen

## Tech-Stack

- Python / Flask
- SQLite (WAL-Modus, mit Indexes)
- Tailwind CSS + DaisyUI
- Vanilla JavaScript
- flask-wtf (CSRF)
- pytest (19 Tests)

## Lokale Entwicklung

```bash
pip install -r requirements.txt
python3 app.py
```

Die App läuft auf **http://localhost:5001** mit dem Standard-Passwort `montalux`.

Umgebungsvariablen setzen für Produktion:

```bash
SECRET_KEY="ein-sicherer-string" APP_PASSWORD="euer-passwort" python3 app.py
```

## Tests

```bash
python3 -m pytest test_app.py -v
```

## Deployment

Die App läuft auf **PythonAnywhere** (Free Tier). Siehe [DEPLOY.md](DEPLOY.md) für die vollständige Anleitung.

### Quick-Update

```bash
# Lokal
git add -A && git commit -m "Änderung" && git push

# Auf PythonAnywhere (Bash-Console)
cd ~/timetracker && git pull
# Dann Web-Tab → Reload
```

## Erster Start

1. App öffnen und mit Team-Passwort anmelden
2. Unter "Verwaltung" Mitarbeiter, Kunden und Leistungen anlegen
3. Auf der Startseite Buchungen erfassen
