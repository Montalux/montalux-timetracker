import { useState } from 'react'
import {
  useEmployees, useCustomers, useServices,
  addEmployee, updateEmployee, toggleEmployee,
  addCustomer, updateCustomer, toggleCustomer,
  addService, updateService, toggleService,
} from '../hooks/useData'
import { useFlash } from '../hooks/useFlash'

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
                    <button
                      type="button"
                      onClick={() => onToggle(item)}
                      className={`btn btn-outline btn-xs ${item.active ? 'btn-error' : 'btn-success'}`}
                    >
                      {item.active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button type="submit" className="btn btn-primary btn-xs">Speichern</button>
                  </div>
                </form>
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
  const { employees, loading: loadingEmp, refetch: refetchEmp } = useEmployees(false)
  const { customers, loading: loadingCust, refetch: refetchCust } = useCustomers(false)
  const { services, loading: loadingSvc, refetch: refetchSvc } = useServices(false)
  const { flash, show, dismiss } = useFlash()

  // Wraps a Supabase mutation: surfaces errors as a toast instead of swallowing
  // them, refetches only on success so the UI doesn't reflect a failed write.
  const guard = async (
    label: string,
    op: () => Promise<{ error: { message: string } | null }>,
    refetch: () => void,
  ) => {
    try {
      const { error } = await op()
      if (error) {
        show('error', `${label}: ${error.message}`)
      } else {
        show('success', `${label} gespeichert.`)
        refetch()
      }
    } catch (err) {
      show('error', `${label}: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    }
  }

  if (loadingEmp || loadingCust || loadingSvc) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Verwaltung</h2>

      {flash && (
        <div className={`alert ${flash.kind === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          <span>{flash.text}</span>
          <button type="button" className="btn btn-ghost btn-xs" onClick={dismiss} aria-label="Meldung schließen">X</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AdminSection
          title="Mitarbeiter"
          items={employees}
          addPlaceholder="Neuer Mitarbeiter..."
          onAdd={(name) => guard('Mitarbeiter', () => addEmployee(name), refetchEmp)}
          onUpdate={(item, name) => guard('Mitarbeiter', () => updateEmployee(item.id, name, item.active), refetchEmp)}
          onToggle={(item) => guard('Mitarbeiter', () => toggleEmployee(item.id, item.active), refetchEmp)}
        />
        <AdminSection
          title="Kunden"
          items={customers}
          addPlaceholder="Neuer Kunde..."
          onAdd={(name) => guard('Kunde', () => addCustomer(name), refetchCust)}
          onUpdate={(item, name) => guard('Kunde', () => updateCustomer(item.id, name, item.active), refetchCust)}
          onToggle={(item) => guard('Kunde', () => toggleCustomer(item.id, item.active), refetchCust)}
        />
        <AdminSection
          title="Leistungen"
          items={services}
          addPlaceholder="Neue Leistung..."
          showPrice
          onAdd={(name, price) => guard('Leistung', () => addService(name, price!), refetchSvc)}
          onUpdate={(item, name, price) => guard('Leistung', () => updateService(item.id, name, price!, item.active), refetchSvc)}
          onToggle={(item) => guard('Leistung', () => toggleService(item.id, item.active), refetchSvc)}
        />
      </div>
    </>
  )
}
