import os
import shutil
import sqlite3
import threading
from datetime import datetime, date

DB_PATH = "timetracker.db"
BACKUP_DIR = "backups"
BACKUP_INTERVAL = 86400  # 24h in Sekunden
BACKUP_MAX = 15

_backup_timer = None


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _run_backup():
    """Erstellt eine Kopie der DB-Datei mit Zeitstempel."""
    global _backup_timer
    try:
        if os.path.exists(DB_PATH):
            os.makedirs(BACKUP_DIR, exist_ok=True)
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            dest = os.path.join(BACKUP_DIR, f"timetracker_{timestamp}.db")
            shutil.copy2(DB_PATH, dest)

            # Alte Backups aufräumen
            backups = sorted(
                [f for f in os.listdir(BACKUP_DIR) if f.endswith(".db")],
                reverse=True
            )
            for old in backups[BACKUP_MAX:]:
                os.remove(os.path.join(BACKUP_DIR, old))
    except Exception:
        pass  # Backup-Fehler sollen die App nicht stoppen

    # Nächsten Timer starten
    _backup_timer = threading.Timer(BACKUP_INTERVAL, _run_backup)
    _backup_timer.daemon = True
    _backup_timer.start()


def start_backup_scheduler():
    """Startet den periodischen Backup-Timer."""
    global _backup_timer
    if _backup_timer is None:
        _run_backup()


def init_db():
    conn = get_db()
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            active BOOLEAN NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price_per_hour REAL NOT NULL,
            active BOOLEAN NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS time_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id),
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            service_id INTEGER NOT NULL REFERENCES services(id),
            date DATE NOT NULL,
            duration_minutes INTEGER NOT NULL,
            note TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS material_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id),
            customer_id INTEGER NOT NULL REFERENCES customers(id),
            date DATE NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL,
            amount REAL NOT NULL,
            note TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.close()


# --- Employees ---

def get_employees(active_only=True):
    conn = get_db()
    if active_only:
        rows = conn.execute("SELECT * FROM employees WHERE active = 1 ORDER BY name").fetchall()
    else:
        rows = conn.execute("SELECT * FROM employees ORDER BY name").fetchall()
    conn.close()
    return rows


def get_employee(employee_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    conn.close()
    return row


def add_employee(name):
    conn = get_db()
    conn.execute("INSERT INTO employees (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()


def update_employee(employee_id, name, active):
    conn = get_db()
    conn.execute("UPDATE employees SET name = ?, active = ? WHERE id = ?", (name, active, employee_id))
    conn.commit()
    conn.close()


def toggle_employee(employee_id):
    conn = get_db()
    conn.execute("UPDATE employees SET active = NOT active WHERE id = ?", (employee_id,))
    conn.commit()
    conn.close()


# --- Customers ---

def get_customers(active_only=True):
    conn = get_db()
    if active_only:
        rows = conn.execute("SELECT * FROM customers WHERE active = 1 ORDER BY name").fetchall()
    else:
        rows = conn.execute("SELECT * FROM customers ORDER BY name").fetchall()
    conn.close()
    return rows


def get_customer(customer_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM customers WHERE id = ?", (customer_id,)).fetchone()
    conn.close()
    return row


def add_customer(name):
    conn = get_db()
    conn.execute("INSERT INTO customers (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()


def update_customer(customer_id, name, active):
    conn = get_db()
    conn.execute("UPDATE customers SET name = ?, active = ? WHERE id = ?", (name, active, customer_id))
    conn.commit()
    conn.close()


def toggle_customer(customer_id):
    conn = get_db()
    conn.execute("UPDATE customers SET active = NOT active WHERE id = ?", (customer_id,))
    conn.commit()
    conn.close()


# --- Services ---

def get_services(active_only=True):
    conn = get_db()
    if active_only:
        rows = conn.execute("SELECT * FROM services WHERE active = 1 ORDER BY name").fetchall()
    else:
        rows = conn.execute("SELECT * FROM services ORDER BY name").fetchall()
    conn.close()
    return rows


def get_service(service_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM services WHERE id = ?", (service_id,)).fetchone()
    conn.close()
    return row


def add_service(name, price_per_hour):
    conn = get_db()
    conn.execute("INSERT INTO services (name, price_per_hour) VALUES (?, ?)", (name, price_per_hour))
    conn.commit()
    conn.close()


def update_service(service_id, name, price_per_hour, active):
    conn = get_db()
    conn.execute("UPDATE services SET name = ?, price_per_hour = ?, active = ? WHERE id = ?",
                 (name, price_per_hour, active, service_id))
    conn.commit()
    conn.close()


def toggle_service(service_id):
    conn = get_db()
    conn.execute("UPDATE services SET active = NOT active WHERE id = ?", (service_id,))
    conn.commit()
    conn.close()


# --- Time Entries ---

def add_time_entry(employee_id, customer_id, service_id, entry_date, duration_minutes, note=None):
    conn = get_db()
    conn.execute(
        "INSERT INTO time_entries (employee_id, customer_id, service_id, date, duration_minutes, note) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (employee_id, customer_id, service_id, entry_date, duration_minutes, note)
    )
    conn.commit()
    conn.close()


def delete_time_entry(entry_id):
    conn = get_db()
    conn.execute("DELETE FROM time_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()


# --- Material Entries ---

def add_material_entry(employee_id, customer_id, entry_date, description, quantity, amount, note=None):
    conn = get_db()
    conn.execute(
        "INSERT INTO material_entries (employee_id, customer_id, date, description, quantity, amount, note) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (employee_id, customer_id, entry_date, description, quantity, amount, note)
    )
    conn.commit()
    conn.close()


def delete_material_entry(entry_id):
    conn = get_db()
    conn.execute("DELETE FROM material_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()


# --- Combined Queries ---

def get_entries(employee_id=None, customer_id=None, date_from=None, date_to=None, entry_type=None):
    """Get combined time and material entries with filters."""
    results = []

    if entry_type != "material":
        # Time entries
        sql = """
            SELECT t.id, 'time' as type, t.date, e.name as employee, c.name as customer,
                   s.name as service, t.duration_minutes, s.price_per_hour,
                   ROUND(t.duration_minutes / 60.0 * s.price_per_hour, 2) as amount,
                   NULL as description, NULL as quantity, t.note, t.created_at
            FROM time_entries t
            JOIN employees e ON t.employee_id = e.id
            JOIN customers c ON t.customer_id = c.id
            JOIN services s ON t.service_id = s.id
            WHERE 1=1
        """
        params = []
        if employee_id:
            sql += " AND t.employee_id = ?"
            params.append(employee_id)
        if customer_id:
            sql += " AND t.customer_id = ?"
            params.append(customer_id)
        if date_from:
            sql += " AND t.date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND t.date <= ?"
            params.append(date_to)

        conn = get_db()
        rows = conn.execute(sql, params).fetchall()
        results.extend([dict(r) for r in rows])
        conn.close()

    if entry_type != "time":
        # Material entries
        sql = """
            SELECT m.id, 'material' as type, m.date, e.name as employee, c.name as customer,
                   NULL as service, NULL as duration_minutes, NULL as price_per_hour,
                   m.amount, m.description, m.quantity, m.note, m.created_at
            FROM material_entries m
            JOIN employees e ON m.employee_id = e.id
            JOIN customers c ON m.customer_id = c.id
            WHERE 1=1
        """
        params = []
        if employee_id:
            sql += " AND m.employee_id = ?"
            params.append(employee_id)
        if customer_id:
            sql += " AND m.customer_id = ?"
            params.append(customer_id)
        if date_from:
            sql += " AND m.date >= ?"
            params.append(date_from)
        if date_to:
            sql += " AND m.date <= ?"
            params.append(date_to)

        conn = get_db()
        rows = conn.execute(sql, params).fetchall()
        results.extend([dict(r) for r in rows])
        conn.close()

    results.sort(key=lambda x: x["date"], reverse=True)
    return results
