"""Exports all Timetracker tables from Supabase to backup/*.json.

Paginates via the PostgREST Range header so tables past the default
1000-row page limit are not silently truncated, and treats any non-list
JSON response (e.g. an error payload) as a hard failure.
"""
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
TABLES = ["employees", "customers", "services", "time_entries", "material_entries"]
PAGE_SIZE = 1000


def fetch_table(table):
    rows = []
    offset = 0
    while True:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/{table}?select=*&order=id",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Accept": "application/json",
                "Range-Unit": "items",
                "Range": f"{offset}-{offset + PAGE_SIZE - 1}",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                body = resp.read()
        except urllib.error.HTTPError as e:
            raise SystemExit(f"ERROR: {table} request failed with HTTP {e.code}: {e.read().decode()}")

        page = json.loads(body)
        if not isinstance(page, list):
            raise SystemExit(f"ERROR: {table} did not return a JSON array: {page}")

        rows.extend(page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def main():
    os.makedirs("backup", exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    print(f"Backup started at {timestamp}")

    summary = {}
    for table in TABLES:
        print(f"Exporting {table}...")
        rows = fetch_table(table)
        with open(f"backup/{table}.json", "w") as f:
            json.dump(rows, f)
        summary[table] = len(rows)
        print(f"  -> {len(rows)} rows")

    with open("backup/metadata.json", "w") as f:
        json.dump({"timestamp": timestamp, "tables": summary}, f, indent=2)

    print("\nBackup complete!")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
