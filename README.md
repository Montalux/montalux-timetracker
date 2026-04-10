# Montalux Timetracker

Zeiterfassungs-App für Montalux. Erfasst Zeit- und Materialbuchungen pro Mitarbeiter und Kunde.

Live: **[https://pascalmueller.github.io/montalux-timetracker/](https://pascalmueller.github.io/montalux-timetracker/)**

## Features

- **Zeitbuchung** mit manueller Dauer (5/15/30/60 min oder freie Eingabe) oder Start/Stop-Timer
- **Materialbuchung** mit Menge und Betrag
- **Timer-Modus** mit Live-Anzeige, localStorage-Persistenz und automatischer Wiederherstellung
- **Buchungsübersicht** aller Einträge mit Filtern (Mitarbeiter, Kunde, Datum, Typ)
- **Bearbeiten** bestehender Buchungen (alle Felder: Datum, Dauer, Person, Kunde, Leistung, Notiz, etc.)
- **CSV-Export** der gefilterten Einträge
- **Verwaltung** von Mitarbeitern, Kunden und Leistungen (mit Aktivierung/Deaktivierung)
- **Passwortschutz** — gemeinsames Passwort für das Team, mit Remember-me-Option
- **Automatische Backups** der Supabase-Datenbank via GitHub Actions (täglich)
- **Loading-Spinner** für flüssiges UX trotz Supabase-Latenz

## Tech-Stack

- React 19 + TypeScript
- Vite
- React Router
- Supabase (PostgreSQL, Row Level Security)
- Tailwind CSS 4 + daisyUI 5
- GitHub Pages (Hosting)
- GitHub Actions (CI/CD + Backup)

## Lokale Entwicklung

```bash
npm install
```

Umgebungsvariablen in `.env.local` setzen:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_APP_PASSWORD=xxx
```

```bash
npm run dev
```

Die App läuft auf **http://localhost:5173/montalux-timetracker/**

## Build

```bash
npm run build
```

## Deployment

Die App wird automatisch via **GitHub Actions** auf **GitHub Pages** deployed, sobald auf `main` gepusht wird.

Benötigte Repository-Secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_PASSWORD`

## Datenbank

PostgreSQL via Supabase. Schema in `supabase/migrations/`. Tabellen:

- `employees` — Mitarbeiter
- `customers` — Kunden
- `services` — Leistungen mit Stundenansatz
- `time_entries` — Zeitbuchungen
- `material_entries` — Materialbuchungen

## Erster Start

1. App öffnen und mit Team-Passwort anmelden
2. Unter "Verwaltung" Mitarbeiter, Kunden und Leistungen anlegen
3. Auf der Startseite Buchungen erfassen
