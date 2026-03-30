-- Montalux Timetracker Schema for Supabase (Postgres)
-- Run this in the Supabase SQL Editor

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price_per_hour REAL NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true
);

-- Time Entries
CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Material Entries
CREATE TABLE IF NOT EXISTS material_entries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_customer ON time_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_material_entries_date ON material_entries(date);
CREATE INDEX IF NOT EXISTS idx_material_entries_employee ON material_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_material_entries_customer ON material_entries(customer_id);

-- Row Level Security: Only authenticated users can access
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users have full access to employees" ON employees
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to services" ON services
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to time_entries" ON time_entries
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users have full access to material_entries" ON material_entries
    FOR ALL USING (auth.role() = 'authenticated');
