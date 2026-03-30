import { useState } from 'react'
import {
  useEmployees, useCustomers, useServices,
  addEmployee, updateEmployee, toggleEmployee,
  addCustomer, updateCustomer, toggleCustomer,
  addService, updateService, toggleService,
} from '../hooks/useData'

interface AdminSectionProps<T extends { id: number; name: string; active: boolean }> {
  title: string
  items: T[]
  onAdd: (name: string, extra?: number) => Promise<void>
  onUpdate: (item: T, name: string, extra?: number) => Promise<void>
  onToggle: (item: T) => Promise<void>
  showPrice?: boolean
  addPlaceholder: string
}

function AdminSection<T extends { id: number; name: string; active: boolean; price_per_hour?: number }>({
  title, items, onAdd, onUpdate, onToggle, showPrice, addPlaceholder
}: AdminSectionProps<T>) {
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editNames, setEditNames] = useState<Record<number, string>>({})
  const [editPrices, setEditPrices] = useState<Record<number, string>>({})

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await onAdd(newName.trim(), showPrice ? parseFloat(newPrice) : undefined)
    setNewName('')
    setNewPrice('')
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h3 className="card-title">{title}</h3>

        <form onSubmit={handleAdd} className={`${showPrice ? 'space-y-2' : 'flex gap-2'} mt-2`}>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input input-bordered input-sm flex-1 w-full" placeholder={addPlaceholder} required />
          {showPrice && (
            <div className="flex gap-2">
              <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="input input-bordered input-sm flex-1" step="0.01" min="0" placeholder="CHF/h" required />
              <button type="submit" className="btn btn-sm btn-primary">+</button>
            </div>
          )}
          {!showPrice && <button type="submit" className="btn btn-sm btn-primary">+</button>}
        </form>

        <div className="divider my-2" />

        {items.length ? (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className={`${!item.active ? 'opacity-40' : ''} border-b border-base-200 pb-3 last:border-0`}>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  await onUpdate(item, editNames[item.id] ?? item.name, showPrice ? parseFloat(editPrices[item.id] ?? String(item.price_per_hour || 0)) : undefined)
                }}>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full mb-1"
                    value={editNames[item.id] ?? item.name}
                    onChange={e => setEditNames(prev => ({ ...prev, [item.id]: e.target.value }))}
                    required
                  />
                  {showPrice && (
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="number"
                        className="input input-bordered input-sm flex-1"
                        step="0.01"
                        min="0"
                        value={editPrices[item.id] ?? item.price_per_hour ?? ''}
                        onChange={e => setEditPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                        required
                      />
                      <span className="text-sm text-base-content/60 shrink-0">CHF/h</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="submit" className="btn btn-ghost btn-xs">Speichern</button>
                  </div>
                </form>
                <div className="flex justify-end mt-1">
                  <button
                    onClick={() => onToggle(item)}
                    className={`btn btn-outline btn-xs ${item.active ? 'btn-error' : 'btn-success'}`}
                  >
                    {item.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base-content/60 text-sm">Noch keine {title} angelegt.</p>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { employees, refetch: refetchEmp } = useEmployees(false)
  const { customers, refetch: refetchCust } = useCustomers(false)
  const { services, refetch: refetchSvc } = useServices(false)

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Verwaltung</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminSection
          title="Mitarbeiter"
          items={employees}
          addPlaceholder="Neuer Mitarbeiter..."
          onAdd={async (name) => { await addEmployee(name); refetchEmp() }}
          onUpdate={async (item, name) => { await updateEmployee(item.id, name, item.active); refetchEmp() }}
          onToggle={async (item) => { await toggleEmployee(item.id, item.active); refetchEmp() }}
        />
        <AdminSection
          title="Kunden"
          items={customers}
          addPlaceholder="Neuer Kunde..."
          onAdd={async (name) => { await addCustomer(name); refetchCust() }}
          onUpdate={async (item, name) => { await updateCustomer(item.id, name, item.active); refetchCust() }}
          onToggle={async (item) => { await toggleCustomer(item.id, item.active); refetchCust() }}
        />
        <AdminSection
          title="Leistungen"
          items={services}
          addPlaceholder="Neue Leistung..."
          showPrice
          onAdd={async (name, price) => { await addService(name, price!); refetchSvc() }}
          onUpdate={async (item, name, price) => { await updateService(item.id, name, price!, item.active); refetchSvc() }}
          onToggle={async (item) => { await toggleService(item.id, item.active); refetchSvc() }}
        />
      </div>
    </>
  )
}
