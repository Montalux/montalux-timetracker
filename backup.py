#!/usr/bin/env python3
"""Standalone backup script — run via cron or PythonAnywhere scheduled tasks."""
import os
import sqlite3
import logging
from datetime import datetime

DB_PATH = "timetracker.db"
BACKUP_DIR = "backups"
BACKUP_MAX = 15

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

def run_backup():
    if not os.path.exists(DB_PATH):
        logging.error(f"Database not found: {DB_PATH}")
        return

    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    dest_path = os.path.join(BACKUP_DIR, f"timetracker_{timestamp}.db")

    source = sqlite3.connect(DB_PATH)
    dest = sqlite3.connect(dest_path)
    source.backup(dest)
    dest.close()
    source.close()
    logging.info(f"Backup erstellt: {dest_path}")

    # Alte Backups aufräumen
    backups = sorted(
        [f for f in os.listdir(BACKUP_DIR) if f.endswith(".db")],
        reverse=True
    )
    for old in backups[BACKUP_MAX:]:
        os.remove(os.path.join(BACKUP_DIR, old))
        logging.info(f"Altes Backup gelöscht: {old}")

if __name__ == "__main__":
    run_backup()
