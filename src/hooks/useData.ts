import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Employee, Customer, Service, CombinedEntry } from '../types/database'

// --- Employees ---
export function useEmployees(activeOnly = true) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase.from('employees').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data } = await query
    setEmployees(data || [])
    setLoading(false)
  }, [activeOnly])

  useEffect(() => { fetch() }, [fetch])
  return { employees, loading, refetch: fetch }
}

// --- Customers ---
export function useCustomers(activeOnly = true) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase.from('customers').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data } = await query
    setCustomers(data || [])
    setLoading(false)
  }, [activeOnly])

  useEffect(() => { fetch() }, [fetch])
  return { customers, loading, refetch: fetch }
}

// --- Services ---
export function useServices(activeOnly = true) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    let query = supabase.from('services').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data } = await query
    setServices(data || [])
    setLoading(false)
  }, [activeOnly])

  useEffect(() => { fetch() }, [fetch])
  return { services, loading, refetch: fetch }
}

// --- Combined Entries ---
interface EntryFilters {
  employee_id?: number
  customer_id?: number
  date_from?: string
  date_to?: string
  type?: string
}

export function useEntries(filters: EntryFilters) {
  const [entries, setEntries] = useState<CombinedEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const results: CombinedEntry[] = []

    if (filters.type !== 'material') {
      let query = supabase
        .from('time_entries')
        .select('id, employee_id, customer_id, service_id, date, duration_minutes, note, created_at, employees(name), customers(name), services(name, price_per_hour)')

      if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
      if (filters.date_from) query = query.gte('date', filters.date_from)
      if (filters.date_to) query = query.lte('date', filters.date_to)

      const { data } = await query
      if (data) {
        for (const row of data) {
          const emp = row.employees as unknown as { name: string }
          const cust = row.customers as unknown as { name: string }
          const svc = row.services as unknown as { name: string; price_per_hour: number }
          results.push({
            id: row.id,
            type: 'time',
            date: row.date,
            employee: emp?.name || '',
            employee_id: row.employee_id,
            customer: cust?.name || '',
            customer_id: row.customer_id,
            service: svc?.name || null,
            service_id: row.service_id,
            duration_minutes: row.duration_minutes,
            price_per_hour: svc?.price_per_hour || null,
            amount: svc ? Math.round(row.duration_minutes / 60 * svc.price_per_hour * 100) / 100 : null,
            description: null,
            quantity: null,
            note: row.note,
          })
        }
      }
    }

    if (filters.type !== 'time') {
      let query = supabase
        .from('material_entries')
        .select('id, employee_id, customer_id, date, description, quantity, amount, note, created_at, employees(name), customers(name)')

      if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
      if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
      if (filters.date_from) query = query.gte('date', filters.date_from)
      if (filters.date_to) query = query.lte('date', filters.date_to)

      const { data } = await query
      if (data) {
        for (const row of data) {
          const emp = row.employees as unknown as { name: string }
          const cust = row.customers as unknown as { name: string }
          results.push({
            id: row.id,
            type: 'material',
            date: row.date,
            employee: emp?.name || '',
            employee_id: row.employee_id,
            customer: cust?.name || '',
            customer_id: row.customer_id,
            service: null,
            service_id: null,
            duration_minutes: null,
            price_per_hour: null,
            amount: row.amount,
            description: row.description,
            quantity: row.quantity,
            note: row.note,
          })
        }
      }
    }

    results.sort((a, b) => b.date.localeCompare(a.date))
    setEntries(results)
    setLoading(false)
  }, [filters.employee_id, filters.customer_id, filters.date_from, filters.date_to, filters.type])

  useEffect(() => { fetch() }, [fetch])
  return { entries, loading, refetch: fetch }
}

// --- Mutations ---
export async function addTimeEntry(data: {
  employee_id: number; customer_id: number; service_id: number;
  date: string; duration_minutes: number; note?: string
}) {
  return supabase.from('time_entries').insert(data)
}

export async function addMaterialEntry(data: {
  employee_id: number; customer_id: number; date: string;
  description: string; quantity: number; amount: number; note?: string
}) {
  return supabase.from('material_entries').insert(data)
}

export async function updateTimeEntry(id: number, data: {
  employee_id: number; customer_id: number; service_id: number;
  date: string; duration_minutes: number; note?: string
}) {
  return supabase.from('time_entries').update(data).eq('id', id)
}

export async function updateMaterialEntry(id: number, data: {
  employee_id: number; customer_id: number; date: string;
  description: string; quantity: number; amount: number; note?: string
}) {
  return supabase.from('material_entries').update(data).eq('id', id)
}

export async function deleteTimeEntry(id: number) {
  return supabase.from('time_entries').delete().eq('id', id)
}

export async function deleteMaterialEntry(id: number) {
  return supabase.from('material_entries').delete().eq('id', id)
}

export async function addEmployee(name: string) {
  return supabase.from('employees').insert({ name, active: true })
}

export async function updateEmployee(id: number, name: string, active: boolean) {
  return supabase.from('employees').update({ name, active }).eq('id', id)
}

export async function toggleEmployee(id: number, currentActive: boolean) {
  return supabase.from('employees').update({ active: !currentActive }).eq('id', id)
}

export async function addCustomer(name: string) {
  return supabase.from('customers').insert({ name, active: true })
}

export async function updateCustomer(id: number, name: string, active: boolean) {
  return supabase.from('customers').update({ name, active }).eq('id', id)
}

export async function toggleCustomer(id: number, currentActive: boolean) {
  return supabase.from('customers').update({ active: !currentActive }).eq('id', id)
}

export async function addService(name: string, price_per_hour: number) {
  return supabase.from('services').insert({ name, price_per_hour, active: true })
}

export async function updateService(id: number, name: string, price_per_hour: number, active: boolean) {
  return supabase.from('services').update({ name, price_per_hour, active }).eq('id', id)
}

export async function toggleService(id: number, currentActive: boolean) {
  return supabase.from('services').update({ active: !currentActive }).eq('id', id)
}
