import { useState, useEffect, useRef } from 'react'
import { useEmployees, useCustomers, useServices, updateTimeEntry, updateMaterialEntry } from '../hooks/useData'
import type { CombinedEntry } from '../types/database'

interface Props {
  entry: CombinedEntry | null
  onClose: () => void
  onSaved: () => void
}

export default function EditEntryModal({ entry, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { employees } = useEmployees(false)
  const { customers } = useCustomers(false)
  const { services } = useServices(false)

  const [employeeId, setEmployeeId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [note, setNote] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entry) {
      setEmployeeId(entry.employee_id.toString())
      setCustomerId(entry.customer_id.toString())
      setServiceId(entry.service_id?.toString() || '')
      setDate(entry.date)
      setDurationMinutes(entry.duration_minutes?.toString() || '')
      setNote(entry.note || '')
      setDescription(entry.description || '')
      setQuantity(entry.quantity?.toString() || '')
      setAmount(entry.amount?.toString() || '')
      setError('')
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [entry])

  const handleSave = async () => {
    if (!entry) return
    setSaving(true)
    setError('')

    let result
    if (entry.type === 'time') {
      result = await updateTimeEntry(entry.id, {
        employee_id: parseInt(employeeId),
        customer_id: parseInt(customerId),
        service_id: parseInt(serviceId),
        date,
        duration_minutes: parseInt(durationMinutes),
        note: note.trim() || undefined,
      })
    } else {
      result = await updateMaterialEntry(entry.id, {
        employee_id: parseInt(employeeId),
        customer_id: parseInt(customerId),
        date,
        description: description.trim(),
        quantity: parseFloat(quantity) || 0,
        amount: parseFloat(amount) || 0,
        note: note.trim() || undefined,
      })
    }

    setSaving(false)
    if (result.error) {
      setError('Fehler beim Speichern: ' + result.error.message)
    } else {
      onSaved()
    }
  }

  const handleClose = () => {
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Buchung bearbeiten</h3>

        {error && (
          <div className="alert alert-error mb-4"><span>{error}</span></div>
        )}

        {entry && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label"><span className="label-text">Mitarbeiter *</span></label>
              <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="select select-bordered w-full" required>
                <option value="" disabled>Mitarbeiter wählen...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label"><span className="label-text">Kunde *</span></label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="select select-bordered w-full" required>
                <option value="" disabled>Kunde wählen...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {entry.type === 'time' && (
              <>
                <div className="form-control w-full">
                  <label className="label"><span className="label-text">Leistung *</span></label>
                  <select value={serviceId} onChange={e => setServiceId(e.target.value)} className="select select-bordered w-full" required>
                    <option value="" disabled>Leistung wählen...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price_per_hour.toFixed(2)} CHF/h)</option>)}
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label"><span className="label-text">Datum *</span></label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input input-bordered w-full" required />
                </div>

                <div className="form-control w-full md:col-span-2">
                  <label className="label"><span className="label-text">Dauer (Minuten) *</span></label>
                  <div className="flex gap-2 flex-wrap items-center">
                    {[5, 15, 30, 60].map(min => (
                      <button
                        key={min}
                        type="button"
                        className={`btn btn-sm ${parseInt(durationMinutes) === min ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setDurationMinutes(min.toString())}
                      >
                        {min >= 60 ? `${min / 60} h` : `${min} min`}
                      </button>
                    ))}
                    <input
                      type="number"
                      className="input input-bordered w-28"
                      min="1"
                      placeholder="min"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {entry.type === 'material' && (
              <>
                <div className="form-control w-full">
                  <label className="label"><span className="label-text">Material-Beschreibung *</span></label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input input-bordered w-full" required />
                </div>

                <div className="form-control w-full">
                  <label className="label"><span className="label-text">Datum *</span></label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input input-bordered w-full" required />
                </div>

                <div className="form-control w-full">
                  <label className="label"><span className="label-text">Menge</span></label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input input-bordered w-full" step="0.01" min="0" />
                </div>

                <div className="form-control w-full">
                  <label className="label"><span className="label-text">Betrag (CHF)</span></label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input input-bordered w-full" step="0.01" min="0" />
                </div>
              </>
            )}

            <div className="form-control w-full md:col-span-2">
              <label className="label"><span className="label-text">Notiz</span></label>
              <textarea value={note} onChange={e => setNote(e.target.value)} className="textarea textarea-bordered w-full" rows={2} placeholder="Optionale Bemerkung..." />
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={handleClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Speichern'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  )
}
