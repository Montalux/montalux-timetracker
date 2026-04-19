import { useState } from 'react'
import { useEmployees, useCustomers, useEntries, deleteTimeEntry, deleteMaterialEntry } from '../hooks/useData'
import { useFlash } from '../hooks/useFlash'
import type { CombinedEntry } from '../types/database'
import EditEntryModal from '../components/EditEntryModal'

export default function EntriesPage() {
  const { employees } = useEmployees(false)
  const { customers } = useCustomers(false)

  const [employeeId, setEmployeeId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [type, setType] = useState('')

  const [editingEntry, setEditingEntry] = useState<CombinedEntry | null>(null)
  const { flash, show, dismiss } = useFlash()

  const [appliedFilters, setAppliedFilters] = useState<{
    employee_id?: number; customer_id?: number;
    date_from?: string; date_to?: string; type?: string
  }>({})

  const { entries, loading, refetch } = useEntries(appliedFilters)

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0)

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedFilters({
      employee_id: employeeId ? parseInt(employeeId) : undefined,
      customer_id: customerId ? parseInt(customerId) : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      type: type || undefined,
    })
  }

  const resetFilters = () => {
    setEmployeeId('')
    setCustomerId('')
    setDateFrom('')
    setDateTo('')
    setType('')
    setAppliedFilters({})
  }

  const handleDelete = async (entry: CombinedEntry) => {
    if (!confirm('Buchung wirklich löschen?')) return
    try {
      const { error } = entry.type === 'time'
        ? await deleteTimeEntry(entry.id)
        : await deleteMaterialEntry(entry.id)
      if (error) {
        show('error', `Löschen fehlgeschlagen: ${error.message}`)
        return
      }
      show('success', 'Buchung gelöscht.')
      refetch()
    } catch (err) {
      show('error', `Löschen fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
    }
    return `${minutes} min`
  }

  const exportCSV = () => {
    const headers = ['Datum', 'Typ', 'Mitarbeiter', 'Kunde', 'Leistung/Material', 'Dauer/Menge', 'Preis/h', 'Betrag', 'Notiz']
    const rows = entries.map(r => {
      if (r.type === 'time') {
        return [
          r.date, 'Zeit', r.employee, r.customer, r.service || '',
          `${r.duration_minutes}min`, r.price_per_hour?.toFixed(2) || '',
          r.amount?.toFixed(2) || '', r.note || ''
        ]
      } else {
        return [
          r.date, 'Material', r.employee, r.customer, r.description || '',
          r.quantity?.toString() || '', '',
          r.amount?.toFixed(2) || '', r.note || ''
        ]
      }
    })

    // Escape CSV cell: neutralize formula-injection prefix, wrap always in quotes,
    // double internal quotes. Always quoting also handles ;, newlines and commas safely.
    const escapeCell = (value: unknown): string => {
      const s = value == null ? '' : String(value)
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
      return `"${safe.replace(/"/g, '""')}"`
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCell).join(';'))
      .join('\r\n')
    // BOM so Excel detects UTF-8 (umlauts in Notiz/Mitarbeiter-Namen)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zeiterfassung_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {flash && (
        <div className={`alert ${flash.kind === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
          <span>{flash.text}</span>
          <button type="button" className="btn btn-ghost btn-xs" onClick={dismiss} aria-label="Meldung schließen">X</button>
        </div>
      )}

      {/* Filter */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Buchungsübersicht</h2>
          <form onSubmit={applyFilters} className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Mitarbeiter</span></label>
                <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="select select-bordered select-sm w-full">
                  <option value="">Alle</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Kunde</span></label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="select select-bordered select-sm w-full">
                  <option value="">Alle</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Von</span></label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input input-bordered input-sm w-full" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Bis</span></label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input input-bordered input-sm w-full" />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-sm">Typ</span></label>
                <select value={type} onChange={e => setType(e.target.value)} className="select select-bordered select-sm w-full">
                  <option value="">Alle</option>
                  <option value="time">Zeit</option>
                  <option value="material">Material</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" className="btn btn-sm btn-primary">Filtern</button>
              <button type="button" onClick={resetFilters} className="btn btn-sm btn-ghost">Zurücksetzen</button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-8 text-center"><span className="loading loading-spinner" /></div>
          ) : entries.length ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Typ</th>
                    <th>Mitarbeiter</th>
                    <th>Kunde</th>
                    <th>Leistung / Material</th>
                    <th className="text-right">Dauer / Menge</th>
                    <th className="text-right">Betrag</th>
                    <th>Notiz</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={`${entry.type}-${entry.id}`}>
                      <td className="whitespace-nowrap">{entry.date}</td>
                      <td>
                        <span className={`badge badge-sm ${entry.type === 'time' ? 'badge-primary' : 'badge-secondary'}`}>
                          {entry.type === 'time' ? 'Zeit' : 'Material'}
                        </span>
                      </td>
                      <td>{entry.employee}</td>
                      <td>{entry.customer}</td>
                      <td>{entry.type === 'time' ? entry.service : entry.description}</td>
                      <td className="text-right whitespace-nowrap">
                        {entry.type === 'time' && entry.duration_minutes != null
                          ? formatDuration(entry.duration_minutes)
                          : entry.quantity?.toString() || ''}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        {entry.amount != null ? `${entry.amount.toFixed(2)} CHF` : ''}
                      </td>
                      <td className="max-w-xs truncate">{entry.note || ''}</td>
                      <td className="flex gap-1">
                        <button onClick={() => setEditingEntry(entry)} className="btn btn-ghost btn-xs" aria-label="Buchung bearbeiten" title="Bearbeiten">&#9998;</button>
                        <button onClick={() => handleDelete(entry)} className="btn btn-ghost btn-xs text-error" aria-label="Buchung löschen" title="Löschen">X</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={5}>Total</td>
                    <td className="text-right">{formatDuration(totalMinutes)}</td>
                    <td className="text-right">{totalAmount.toFixed(2)} CHF</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-base-content/60">Keine Buchungen gefunden.</div>
          )}
        </div>
      </div>

      {/* Export */}
      {entries.length > 0 && (
        <div className="flex justify-end mt-4">
          <button onClick={exportCSV} className="btn btn-sm btn-outline">CSV exportieren</button>
        </div>
      )}

      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={() => { setEditingEntry(null); refetch() }}
      />
    </>
  )
}
