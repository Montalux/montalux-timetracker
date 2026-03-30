import os
import tempfile
import pytest

os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["APP_PASSWORD"] = "testpass"

import app as flask_app
import database as db


@pytest.fixture
def client(tmp_path):
    db_path = str(tmp_path / "test.db")
    db.DB_PATH = db_path
    db.init_db()
    flask_app.app.config["TESTING"] = True
    flask_app.app.config["WTF_CSRF_ENABLED"] = False
    with flask_app.app.test_client() as client:
        with flask_app.app.app_context():
            # Auto-login for all tests
            with client.session_transaction() as sess:
                sess["authenticated"] = True
            yield client


# --- Page loads ---

def test_index_page(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "Montalux Timetracker" in resp.data.decode()


def test_entries_page(client):
    resp = client.get("/entries")
    assert resp.status_code == 200


def test_admin_page(client):
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "Verwaltung" in resp.data.decode()


# --- Employee CRUD ---

def test_add_employee(client):
    resp = client.post("/admin/employee/add", data={"name": "Max Muster"}, follow_redirects=True)
    assert resp.status_code == 200
    assert "Max Muster" in resp.data.decode()


def test_add_employee_empty_name(client):
    resp = client.post("/admin/employee/add", data={"name": ""}, follow_redirects=True)
    assert "Name darf nicht leer sein" in resp.data.decode()


def test_toggle_employee(client):
    with flask_app.app.app_context():
        db.add_employee("Toggle Test")
        employees = db.get_employees(active_only=False)
        emp_id = employees[0]["id"]
    resp = client.post(f"/admin/employee/{emp_id}/toggle", follow_redirects=True)
    assert resp.status_code == 200


# --- Customer CRUD ---

def test_add_customer(client):
    resp = client.post("/admin/customer/add", data={"name": "Firma AG"}, follow_redirects=True)
    assert resp.status_code == 200
    assert "Firma AG" in resp.data.decode()


# --- Service CRUD ---

def test_add_service(client):
    resp = client.post("/admin/service/add", data={"name": "Beratung", "price_per_hour": "150.00"}, follow_redirects=True)
    assert resp.status_code == 200
    assert "Beratung" in resp.data.decode()


def test_add_service_invalid_price(client):
    resp = client.post("/admin/service/add", data={"name": "Bad", "price_per_hour": "abc"}, follow_redirects=True)
    assert "Ung" in resp.data.decode()  # "Ungültiger Preis"


# --- Time Entry ---

def test_add_time_entry(client):
    with flask_app.app.app_context():
        db.add_employee("Worker")
        db.add_customer("Client")
        db.add_service("Dev", 100.0)

    resp = client.post("/", data={
        "entry_type": "time",
        "employee_id": "1",
        "customer_id": "1",
        "service_id": "1",
        "duration_minutes": "60",
        "date": "2026-03-30",
    }, follow_redirects=True)
    assert resp.status_code == 200
    assert "Zeitbuchung erfolgreich" in resp.data.decode()


def test_add_time_entry_invalid_duration(client):
    with flask_app.app.app_context():
        db.add_employee("Worker")
        db.add_customer("Client")
        db.add_service("Dev", 100.0)

    resp = client.post("/", data={
        "entry_type": "time",
        "employee_id": "1",
        "customer_id": "1",
        "service_id": "1",
        "duration_minutes": "not_a_number",
        "date": "2026-03-30",
    }, follow_redirects=True)
    assert "Ung" in resp.data.decode()  # "Ungültige Eingabe"


# --- Material Entry ---

def test_add_material_entry(client):
    with flask_app.app.app_context():
        db.add_employee("Worker")
        db.add_customer("Client")

    resp = client.post("/", data={
        "entry_type": "material",
        "employee_id": "1",
        "customer_id": "1",
        "description": "Papier",
        "quantity": "10",
        "amount": "45.50",
        "date": "2026-03-30",
    }, follow_redirects=True)
    assert resp.status_code == 200
    assert "Materialbuchung erfolgreich" in resp.data.decode()


# --- Delete Entry ---

def test_delete_time_entry(client):
    with flask_app.app.app_context():
        db.add_employee("Worker")
        db.add_customer("Client")
        db.add_service("Dev", 100.0)
        db.add_time_entry(1, 1, 1, "2026-03-30", 60)

    resp = client.post("/entries/delete/time/1", follow_redirects=True)
    assert resp.status_code == 200
    assert "gelöscht" in resp.data.decode()


# --- CSV Export ---

def test_csv_export(client):
    with flask_app.app.app_context():
        db.add_employee("Worker")
        db.add_customer("Client")
        db.add_service("Dev", 100.0)
        db.add_time_entry(1, 1, 1, "2026-03-30", 60)

    resp = client.get("/export/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.content_type
    assert "Datum" in resp.data.decode()


# --- Entries filtering ---

def test_entries_with_filters(client):
    with flask_app.app.app_context():
        db.add_employee("Worker")
        db.add_customer("Client")
        db.add_service("Dev", 100.0)
        db.add_time_entry(1, 1, 1, "2026-03-30", 60)

    resp = client.get("/entries?employee_id=1&date_from=2026-03-01&date_to=2026-03-31&type=time")
    assert resp.status_code == 200


# --- Login ---

def test_login_page_loads(client):
    with client.session_transaction() as sess:
        sess.clear()
    resp = client.get("/login")
    assert resp.status_code == 200
    assert "Passwort" in resp.data.decode()


def test_login_wrong_password(client):
    with client.session_transaction() as sess:
        sess.clear()
    resp = client.post("/login", data={"password": "wrong"}, follow_redirects=True)
    assert "Falsches Passwort" in resp.data.decode()


def test_login_correct_password(client):
    with client.session_transaction() as sess:
        sess.clear()
    resp = client.post("/login", data={"password": "testpass"}, follow_redirects=True)
    assert "Angemeldet" in resp.data.decode()


def test_unauthenticated_redirect(client):
    with client.session_transaction() as sess:
        sess.clear()
    resp = client.get("/")
    assert resp.status_code == 302
    assert "/login" in resp.headers["Location"]
