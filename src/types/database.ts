export interface Employee {
  id: number
  name: string
  active: boolean
}

export interface Customer {
  id: number
  name: string
  active: boolean
}

export interface Service {
  id: number
  name: string
  price_per_hour: number
  active: boolean
}

export interface TimeEntry {
  id: number
  employee_id: number
  customer_id: number
  service_id: number
  date: string
  duration_minutes: number
  note: string | null
  created_at: string
}

export interface MaterialEntry {
  id: number
  employee_id: number
  customer_id: number
  date: string
  description: string
  quantity: number
  amount: number
  note: string | null
  created_at: string
}

export interface CombinedEntry {
  id: number
  type: 'time' | 'material'
  date: string
  employee: string
  employee_id: number
  customer: string
  customer_id: number
  service: string | null
  service_id: number | null
  duration_minutes: number | null
  price_per_hour: number | null
  amount: number | null
  description: string | null
  quantity: number | null
  note: string | null
}

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: Employee
        Insert: Omit<Employee, 'id'>
        Update: Partial<Omit<Employee, 'id'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id'>
        Update: Partial<Omit<Customer, 'id'>>
      }
      services: {
        Row: Service
        Insert: Omit<Service, 'id'>
        Update: Partial<Omit<Service, 'id'>>
      }
      time_entries: {
        Row: TimeEntry
        Insert: Omit<TimeEntry, 'id' | 'created_at'>
        Update: Partial<Omit<TimeEntry, 'id' | 'created_at'>>
      }
      material_entries: {
        Row: MaterialEntry
        Insert: Omit<MaterialEntry, 'id' | 'created_at'>
        Update: Partial<Omit<MaterialEntry, 'id' | 'created_at'>>
      }
    }
  }
}
