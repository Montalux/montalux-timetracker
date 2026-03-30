import csv
import io
import os
import logging
from functools import wraps
from datetime import date, datetime

from flask import Flask, render_template, request, redirect, url_for, flash, Response, session
from flask_wtf.csrf import CSRFProtect

import database as db

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-fallback-key")
if not os.environ.get("SECRET_KEY"):
    logging.warning("SECRET_KEY not set — using insecure fallback. Set SECRET_KEY env var for production.")
csrf = CSRFProtect(app)
app.teardown_appcontext(db.close_db)

def get_app_password():
    return os.environ.get("APP_PASSWORD", "montalux")


# --- Login ---

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("authenticated"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("authenticated"):
        return redirect(url_for("index"))
    if request.method == "POST":
        password = request.form.get("password", "")
        if password == get_app_password():
            session["authenticated"] = True
            session.permanent = True
            flash("Angemeldet.", "success")
            return redirect(url_for("index"))
        else:
            flash("Falsches Passwort.", "error")
    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Abgemeldet.", "success")
    return redirect(url_for("login"))


# --- Buchung ---

@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    if request.method == "POST":
        entry_type = request.form.get("entry_type")

        if entry_type == "time":
            employee_id = request.form.get("employee_id")
            customer_id = request.form.get("customer_id")
            service_id = request.form.get("service_id")
            duration = request.form.get("duration_minutes")
            entry_date = request.form.get("date")
            note = request.form.get("note", "").strip() or None

            if not all([employee_id, customer_id, service_id, duration, entry_date]):
                flash("Bitte alle Pflichtfelder ausfüllen.", "error")
            else:
                try:
                    db.add_time_entry(int(employee_id), int(customer_id), int(service_id),
                                      entry_date, int(duration), note)
                    flash("Zeitbuchung erfolgreich gespeichert.", "success")
                    return redirect(url_for("index"))
                except (ValueError, TypeError):
                    flash("Ungültige Eingabe bei numerischen Feldern.", "error")

        elif entry_type == "material":
            employee_id = request.form.get("employee_id")
            customer_id = request.form.get("customer_id")
            description = request.form.get("description", "").strip()
            quantity = request.form.get("quantity")
            amount = request.form.get("amount")
            entry_date = request.form.get("date")
            note = request.form.get("note", "").strip() or None

            if not all([employee_id, customer_id, description, entry_date]):
                flash("Bitte alle Pflichtfelder ausfüllen.", "error")
            else:
                try:
                    qty = float(quantity) if quantity else 0
                    amt = float(amount) if amount else 0
                    db.add_material_entry(int(employee_id), int(customer_id), entry_date,
                                          description, qty, amt, note)
                    flash("Materialbuchung erfolgreich gespeichert.", "success")
                    return redirect(url_for("index"))
                except (ValueError, TypeError):
                    flash("Ungültige Eingabe bei numerischen Feldern.", "error")

    employees = db.get_employees()
    customers = db.get_customers()
    services = db.get_services()
    today = date.today().isoformat()
    return render_template("index.html", employees=employees, customers=customers,
                           services=services, today=today)


# --- Übersicht ---

@app.route("/entries")
@login_required
def entries():
    employee_id = request.args.get("employee_id", type=int)
    customer_id = request.args.get("customer_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    entry_type = request.args.get("type")

    rows = db.get_entries(employee_id=employee_id, customer_id=customer_id,
                          date_from=date_from, date_to=date_to, entry_type=entry_type)

    total_minutes = sum(r["duration_minutes"] or 0 for r in rows)
    total_amount = sum(r["amount"] or 0 for r in rows)

    employees = db.get_employees(active_only=False)
    customers = db.get_customers(active_only=False)

    return render_template("entries.html", entries=rows, employees=employees,
                           customers=customers, total_minutes=total_minutes,
                           total_amount=total_amount, filters={
                               "employee_id": employee_id,
                               "customer_id": customer_id,
                               "date_from": date_from or "",
                               "date_to": date_to or "",
                               "type": entry_type or "",
                           })


# --- CSV Export ---

@app.route("/export/csv")
@login_required
def export_csv():
    employee_id = request.args.get("employee_id", type=int)
    customer_id = request.args.get("customer_id", type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    entry_type = request.args.get("type")

    rows = db.get_entries(employee_id=employee_id, customer_id=customer_id,
                          date_from=date_from, date_to=date_to, entry_type=entry_type)

    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    writer.writerow(["Datum", "Typ", "Mitarbeiter", "Kunde", "Leistung/Material",
                      "Dauer/Menge", "Preis/h", "Betrag", "Notiz"])

    for r in rows:
        if r["type"] == "time":
            duration_str = f'{r["duration_minutes"]}min'
            detail = r["service"]
            price = f'{r["price_per_hour"]:.2f}' if r["price_per_hour"] else ""
        else:
            duration_str = str(r["quantity"]) if r["quantity"] else ""
            detail = r["description"]
            price = ""

        writer.writerow([
            r["date"], "Zeit" if r["type"] == "time" else "Material",
            r["employee"], r["customer"], detail, duration_str, price,
            f'{r["amount"]:.2f}' if r["amount"] else "", r["note"] or ""
        ])

    filename = f"zeiterfassung_{date.today().isoformat()}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# --- Delete entries ---

@app.route("/entries/delete/time/<int:entry_id>", methods=["POST"])
@login_required
def delete_time(entry_id):
    db.delete_time_entry(entry_id)
    flash("Zeitbuchung gelöscht.", "success")
    return redirect(url_for("entries"))


@app.route("/entries/delete/material/<int:entry_id>", methods=["POST"])
@login_required
def delete_material(entry_id):
    db.delete_material_entry(entry_id)
    flash("Materialbuchung gelöscht.", "success")
    return redirect(url_for("entries"))


# --- Verwaltung ---

@app.route("/admin")
@login_required
def admin():
    employees = db.get_employees(active_only=False)
    customers = db.get_customers(active_only=False)
    services = db.get_services(active_only=False)
    return render_template("admin.html", employees=employees, customers=customers,
                           services=services)


@app.route("/admin/employee/add", methods=["POST"])
@login_required
def add_employee():
    name = request.form.get("name", "").strip()
    if name:
        db.add_employee(name)
        flash(f"Mitarbeiter '{name}' hinzugefügt.", "success")
    else:
        flash("Name darf nicht leer sein.", "error")
    return redirect(url_for("admin"))


@app.route("/admin/employee/<int:employee_id>/edit", methods=["POST"])
@login_required
def edit_employee(employee_id):
    name = request.form.get("name", "").strip()
    active = request.form.get("active") == "1"
    if name:
        db.update_employee(employee_id, name, active)
        flash(f"Mitarbeiter aktualisiert.", "success")
    return redirect(url_for("admin"))


@app.route("/admin/customer/add", methods=["POST"])
@login_required
def add_customer():
    name = request.form.get("name", "").strip()
    if name:
        db.add_customer(name)
        flash(f"Kunde '{name}' hinzugefügt.", "success")
    else:
        flash("Name darf nicht leer sein.", "error")
    return redirect(url_for("admin"))


@app.route("/admin/customer/<int:customer_id>/edit", methods=["POST"])
@login_required
def edit_customer(customer_id):
    name = request.form.get("name", "").strip()
    active = request.form.get("active") == "1"
    if name:
        db.update_customer(customer_id, name, active)
        flash("Kunde aktualisiert.", "success")
    return redirect(url_for("admin"))


@app.route("/admin/service/add", methods=["POST"])
@login_required
def add_service():
    name = request.form.get("name", "").strip()
    price = request.form.get("price_per_hour")
    if name and price:
        try:
            db.add_service(name, float(price))
            flash(f"Leistung '{name}' hinzugefügt.", "success")
        except (ValueError, TypeError):
            flash("Ungültiger Preis.", "error")
    else:
        flash("Name und Preis sind Pflichtfelder.", "error")
    return redirect(url_for("admin"))


@app.route("/admin/service/<int:service_id>/edit", methods=["POST"])
@login_required
def edit_service(service_id):
    name = request.form.get("name", "").strip()
    price = request.form.get("price_per_hour")
    active = request.form.get("active") == "1"
    if name and price:
        try:
            db.update_service(service_id, name, float(price), active)
            flash("Leistung aktualisiert.", "success")
        except (ValueError, TypeError):
            flash("Ungültiger Preis.", "error")
    return redirect(url_for("admin"))


@app.route("/admin/employee/<int:employee_id>/toggle", methods=["POST"])
@login_required
def toggle_employee(employee_id):
    db.toggle_employee(employee_id)
    flash("Mitarbeiter-Status geändert.", "success")
    return redirect(url_for("admin"))


@app.route("/admin/customer/<int:customer_id>/toggle", methods=["POST"])
@login_required
def toggle_customer(customer_id):
    db.toggle_customer(customer_id)
    flash("Kunden-Status geändert.", "success")
    return redirect(url_for("admin"))


@app.route("/admin/service/<int:service_id>/toggle", methods=["POST"])
@login_required
def toggle_service(service_id):
    db.toggle_service(service_id)
    flash("Leistungs-Status geändert.", "success")
    return redirect(url_for("admin"))


if __name__ == "__main__":
    db.init_db()
    db.start_backup_scheduler()
    app.run(debug=True, port=5001)
