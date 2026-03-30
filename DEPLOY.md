# Deployment — Montalux Timetracker (Vite + Supabase)

## Architektur

- **Frontend:** Vite + React + TypeScript → baut zu statischen Dateien (`dist/`)
- **Backend:** Supabase (Postgres-Datenbank + Auth + REST API)
- **Hosting:** Beliebig — jeder Hoster der HTML/JS/CSS servieren kann

---

## 1. Supabase einrichten

### 1.1 Projekt erstellen

1. Geh auf [app.supabase.com](https://app.supabase.com)
2. Klick **"New Project"**
3. Füll aus:
   - **Name:** `montalux-timetracker`
   - **Database Password:** Starkes Passwort wählen
   - **Region:** `Central EU (Frankfurt)`
4. Klick **"Create new project"** — warte ~2 Min

### 1.2 Datenbank-Schema erstellen

1. Im linken Menü: **"SQL Editor"** (das `>_` Symbol)
2. Klick **"New query"**
3. Kopiere den gesamten Inhalt von `supabase/migrations/001_initial_schema.sql` rein
4. Klick **"Run"** (oder Ctrl+Enter)
5. Ergebnis: **"Success. No rows returned"** ✅

Das erstellt 5 Tabellen (employees, customers, services, time_entries, material_entries), Indexes und Row Level Security Policies.

### 1.3 Team-User anlegen

1. Im linken Menü: **"Authentication"**
2. Klick **"Add user"** → **"Create new user"**
3. Ausfüllen:
   - **Email:** `team@montalux.ch`
   - **Password:** Das Team-Passwort (damit loggen sich alle ein)
   - ✅ **"Auto Confirm User"** aktivieren!
4. Klick **"Create user"**

### 1.4 API-Keys holen

1. Im linken Menü: **"Project Settings"** (Zahnrad unten)
2. Dann **"API"** (unter Configuration)
3. Notiere dir:
   - **Project URL** — z.B. `https://xyzabc123.supabase.co`
   - **anon public** Key — langer String unter "Project API keys"

---

## 2. Lokale Entwicklung

### 2.1 `.env.local` erstellen

Im Projekt-Ordner:

```bash
echo 'VITE_SUPABASE_URL=https://DEINE-URL.supabase.co
VITE_SUPABASE_ANON_KEY=DEIN-ANON-KEY' > .env.local
```

### 2.2 Dev-Server starten

```bash
npm install
npm run dev
```

Browser öffnen → `http://localhost:5173` → Login mit Team-Passwort.

---

## 3. Build & Deploy

### 3.1 Für Produktion bauen

```bash
npm run build
```

Das erstellt den `dist/` Ordner mit allen statischen Dateien.

### 3.2 Auf beliebigem Hoster deployen

Den Inhalt von `dist/` hochladen (FTP, SSH, Git, etc.). Fertig.

**Wichtig für SPA-Routing:** Der Webserver muss alle Routen auf `index.html` umleiten. Je nach Hoster:

| Hoster / Server | Konfiguration |
|-----------------|---------------|
| Apache (.htaccess) | Siehe `dist/.htaccess` oder: `RewriteEngine On` / `RewriteCond %{REQUEST_FILENAME} !-f` / `RewriteRule ^ index.html [L]` |
| Nginx | `try_files $uri $uri/ /index.html;` |
| Netlify | `_redirects` Datei: `/* /index.html 200` |
| Vercel | Automatisch |

---

## 4. Passwort ändern

1. Supabase Dashboard → **Authentication** → Users
2. User `team@montalux.ch` auswählen
3. Passwort ändern

Alle aktiven Sessions bleiben bestehen. Neues Passwort gilt beim nächsten Login.

---

## 5. Backups

Supabase übernimmt Backups automatisch:

| Tier | Backup-Intervall | Aufbewahrung |
|------|-------------------|--------------|
| Free | Täglich | 7 Tage |
| Pro  | Point-in-Time Recovery | 30 Tage |

Zusätzlich kann jederzeit manuell ein CSV-Export über die Buchungsübersicht gemacht werden.

---

## 6. Updates deployen

```bash
# Lokal
git pull                  # falls nötig
npm run build             # neu bauen
# dist/ Inhalt auf den Hoster hochladen
```

---

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| Login funktioniert nicht | Prüfe ob User in Supabase Auth existiert und "Auto Confirm" aktiv war |
| Keine Daten sichtbar | SQL-Schema nochmals im SQL Editor ausführen |
| Build schlägt fehl | `npm install` nochmals ausführen |
| Seiten-Refresh zeigt 404 | SPA-Routing auf dem Webserver konfigurieren (siehe Abschnitt 3.2) |
| `.env.local` Werte falsch | Project URL und anon Key im Supabase Dashboard unter Settings → API prüfen |
