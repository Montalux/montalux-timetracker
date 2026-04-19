# Changelog

Alle nennenswerten Änderungen am Montalux Timetracker sind hier dokumentiert.

Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/), Versionierung nach [SemVer](https://semver.org/lang/de/).

## [2.2.0] – 2026-04-19

### Hinzugefügt
- Toast-Benachrichtigungen für Erfolg/Fehler in der Verwaltung und beim Löschen von Buchungen (`useFlash`-Hook).
- `aria-label` für Bearbeiten-/Löschen-Icon-Buttons in der Buchungsübersicht (Screen-Reader-Unterstützung).
- Favicon (`favicon.svg`).

### Geändert
- CSV-Export schreibt UTF-8-BOM und CRLF-Zeilenenden für saubere Excel-/Numbers-Kompatibilität.

### Behoben
- **CSV-Export:** Korrektes Escaping aller Felder (Anführungszeichen, Semikolons, Zeilenumbrüche) – Spaltenstruktur bleibt erhalten, auch wenn Notizen Sonderzeichen enthalten.
- **CSV-Injection:** Felder, die mit `=`, `+`, `-`, `@`, Tab oder CR beginnen, werden mit führendem `'` neutralisiert (verhindert Auto-Eval als Excel-Formel).
- **Timer-Robustheit:** Korrupte oder manipulierte `localStorage`-Einträge crashen den Timer nicht mehr; ungültige Zeitstempel werden verworfen statt als `NaN`-Buchung in die DB zu landen.
- **Fehler-Handling Verwaltung:** Supabase-Fehler beim Anlegen/Bearbeiten/Toggle von Mitarbeitern, Kunden und Leistungen werden als Toast angezeigt statt still zu verschwinden.
- **Login-Page:** `navigate()` wird in `useEffect` aufgerufen statt während des Renderns (behebt React-Warning "Cannot update a component while rendering a different component").
- **Console-Error 404:** Favicon-Request schlägt nicht mehr fehl.

## [2.1.0] – 2026-04-18

### Hinzugefügt
- Buchungen können nachträglich bearbeitet werden (alle Felder: Datum, Dauer, Person, Kunde, Leistung, Notiz).
- AdminPage-Layout: Speichern und Deaktivieren nebeneinander, Speichern als `btn-primary`.

### Behoben
- React-Router-Basename für GitHub-Pages-Subpath-Deployment.
- Deploy-Workflow nutzt korrekte Secret-Namen (`VITE_`-Prefix).

## [0.1.0] – 2026-04-17

### Hinzugefügt
- Erste produktive Version: Zeit- und Materialbuchungen, Übersicht mit Filtern, CSV-Export, Verwaltung von Mitarbeitern/Kunden/Leistungen, Passwortschutz mit Remember-me, Timer mit localStorage-Persistenz, GitHub-Pages-Deployment, tägliches Supabase-Backup via GitHub Actions.
