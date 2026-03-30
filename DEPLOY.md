# Deployment auf PythonAnywhere

## Voraussetzungen

- Gratis-Account auf [pythonanywhere.com](https://www.pythonanywhere.com)
- Code auf GitHub (privates Repo mit Personal Access Token)

---

## Ersteinrichtung

### 1. Code auf PythonAnywhere klonen

Bash-Console öffnen (Consoles → Bash):

```bash
git clone https://ghp_DEIN_TOKEN@github.com/Montalux/montalux-timetracker.git timetracker
cd timetracker
pip install --user -r requirements.txt
```

### 2. Web-App erstellen

- **Web** Tab → **Add a new web app**
- Wähle: **Manual configuration** (nicht "Flask"!)
- Wähle: **Python 3.13** (oder neueste Version)

### 3. WSGI konfigurieren

Auf der Web-Seite, klicke auf den Link bei **WSGI configuration file**. Gesamten Inhalt ersetzen mit:

```python
import sys
import os

project_path = '/home/Montalux/timetracker'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

os.chdir(project_path)
os.environ['SECRET_KEY'] = 'mntlx-tt-2026-xK9vPqR3wZ7jN5mB'
os.environ['APP_PASSWORD'] = 'euer-team-passwort'

from wsgi import application
```

> `SECRET_KEY` — beliebiger langer String (Session-Verschlüsselung)
> `APP_PASSWORD` — das Passwort das euer Team zum Anmelden braucht

### 4. Static Files

Auf der **Web**-Seite unter **Static files**:

| URL | Directory |
|-----|-----------|
| `/static/` | `/home/Montalux/timetracker/static` |

### 5. Reload

Grünen **Reload**-Button klicken. App läuft unter `https://Montalux.pythonanywhere.com`.

---

## Tägliches Backup einrichten

- Gehe zu **Tasks** Tab
- Erstelle einen **Daily scheduled task**:
  - Time: `02:00`
  - Command: `cd /home/Montalux/timetracker && python backup.py`

Backups landen in `~/timetracker/backups/` (max. 15, ältere werden automatisch gelöscht).

### Backup manuell testen

```bash
cd ~/timetracker && python backup.py
```

---

## Updates deployen

### 1. Lokal committen und pushen

```bash
git add -A && git commit -m "Beschreibung" && git push
```

### 2. Auf PythonAnywhere pullen

Bash-Console:
```bash
cd ~/timetracker && git pull
```

### 3. Reload

Web-Tab → grüner **Reload**-Button.

Bei Änderungen an `requirements.txt` zusätzlich:
```bash
cd ~/timetracker && pip install --user -r requirements.txt
```

---

## Passwort ändern

1. WSGI-Datei öffnen (Web-Tab → WSGI configuration file)
2. `APP_PASSWORD` Wert ändern
3. Reload klicken

Alle bestehenden Sessions bleiben aktiv. Neues Passwort gilt erst beim nächsten Login.

---

## Fehlerbehebung

| Problem | Lösung |
|---------|--------|
| App zeigt Error | Web-Tab → **Log files** → **Error log** prüfen |
| Import-Fehler | Bash: `cd ~/timetracker && python -c "from wsgi import application"` |
| Datenbank zurücksetzen | Bash: `cd ~/timetracker && rm timetracker.db && python -c "import database; database.init_db()"` |
| Backup testen | Bash: `cd ~/timetracker && python backup.py` |
| Abhängigkeiten fehlen | Bash: `cd ~/timetracker && pip install --user -r requirements.txt` |

---

## Einschränkungen (Free Tier)

- URL ist `Montalux.pythonanywhere.com` (keine eigene Domain)
- App wird nach 3 Monaten Inaktivität pausiert (1 Klick zum Reaktivieren)
- 512 MB Speicher
- Nur 1 Web-App gleichzeitig
