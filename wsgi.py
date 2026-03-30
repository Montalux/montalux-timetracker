"""WSGI entry point for PythonAnywhere and other production servers."""
import database as db

# Initialize database once at import time
db.init_db()

from app import app as application  # noqa: E402

# PythonAnywhere expects 'application', Gunicorn expects 'app'
app = application
