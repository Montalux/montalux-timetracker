# Deployment auf PythonAnywhere

## Voraussetzungen

- Gratis-Account auf [pythonanywhere.com](https://www.pythonanywhere.com)
- Code auf GitHub (öffentliches oder privates Repo)

---

## Schritt 1: Code auf GitHub pushen

Falls noch nicht geschehen, auf deinem Mac:

```bash
cd /pfad/zu/Timetracker
git init
git add -A
git commit -m "Initial commit"
```

Dann auf GitHub ein neues Repo erstellen (z.B. `timetracker`) und:

```bash
git remote add origin https://github.com/DEIN-USER/timetracker.git
git push -u origin main
```

---

## Schritt 2: PythonAnywhere einrichten

### 2.1 Account erstellen
- Gehe zu [pythonanywhere.com](https://www.pythonanywhere.com)
- Erstelle einen **Beginner**-Account (gratis)
- Dein Username wird Teil der URL: `deinname.pythonanywhere.com`

### 2.2 Code klonen
- Klicke oben auf **"Consoles"** → **"Bash"** (neue Bash-Console öffnen)
- In der Console:

```bash
git clone https://github.com/DEIN-USER/timetracker.git
cd timetracker
pip install --user -r requirements.txt
```

### 2.3 Web-App erstellen
- Gehe zu **"Web"** Tab → **"Add a new web app"**
- Wähle: **Manual configuration** (nicht Flask!)
- Wähle: **Python 3.10** (oder neueste verfügbare Version)

### 2.4 WSGI konfigurieren
- Auf der Web-Seite, klicke auf den Link bei **"WSGI configuration file"**
  (sieht aus wie `/var/www/deinname_pythonanywhere_com_wsgi.py`)
- **Lösche den gesamten Inhalt** und ersetze mit:

```python
import sys
import os

# Pfad zu deinem Projekt
project_path = '/home/DEIN-USER/timetracker'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

os.chdir(project_path)
os.environ['SECRET_KEY'] = 'hier-einen-langen-zufaelligen-string-eingeben'

from wsgi import application
```

> Ersetze `DEIN-USER` mit deinem PythonAnywhere-Username.
> Ersetze den SECRET_KEY mit einem langen, zufälligen String.

### 2.5 Static Files konfigurieren
- Auf der **Web**-Seite, unter **"Static files"**:
  - URL: `/static/`
  - Directory: `/home/DEIN-USER/timetracker/static`

### 2.6 App starten
- Klicke den grünen **"Reload"**-Button oben auf der Web-Seite
- Öffne `https://deinname.pythonanywhere.com` im Browser

---

## Schritt 3: Tägliches Backup einrichten

- Gehe zu **"Tasks"** Tab
- Erstelle einen **Daily scheduled task**:
  - Time: `02:00` (oder wann ihr wollt)
  - Command: `cd /home/DEIN-USER/timetracker && python backup.py`

---

## Updates deployen

Wenn du Änderungen am Code machst:

1. Lokal committen und pushen:
   ```bash
   git add -A && git commit -m "Änderung" && git push
   ```

2. Auf PythonAnywhere in der Bash-Console:
   ```bash
   cd ~/timetracker && git pull
   ```

3. Auf der **Web**-Seite → **"Reload"** klicken

---

## Fehlerbehebung

- **Error-Log:** Web-Seite → "Log files" → "Error log" anklicken
- **Console testen:** In Bash-Console `cd timetracker && python -c "import app; print('OK')"`
- **Datenbank zurücksetzen:** `cd timetracker && rm timetracker.db && python -c "import database; database.init_db()"`

---

## Einschränkungen (Free Tier)

- URL ist `deinname.pythonanywhere.com` (keine eigene Domain)
- App wird nach 3 Monaten Inaktivität pausiert (1 Klick zum Reaktivieren)
- 512 MB Speicher
- Nur 1 Web-App gleichzeitig
