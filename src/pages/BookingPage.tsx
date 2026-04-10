import { useState, useEffect } from 'react'
import { useEmployees, useCustomers, useServices, addTimeEntry, addMaterialEntry } from '../hooks/useData'
import { useTimer } from '../hooks/useTimer'

export default function BookingPage() {
  const { employees, loading: loadingEmp } = useEmployees()
  const { customers, loading: loadingCust } = useCustomers()
  const { services, loading: loadingSvc } = useServices()

  const [activeTab, setActiveTab] = useState<'time' | 'material'>('time')
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Shared state
  const [employeeId, setEmployeeId] = useState('')
  const [customerId, setCustomerId] = useState('')

  // Time form
  const [serviceId, setServiceId] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [customMinutes, setCustomMinutes] = useState('')
  const [dateTime, setDateTime] = useState(new Date().toISOString().split('T')[0])
  const [noteTime, setNoteTime] = useState('')

  // Material form
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [dateMaterial, setDateMaterial] = useState(new Date().toISOString().split('T')[0])
  const [noteMaterial, setNoteMaterial] = useState('')

  const timer = useTimer(employeeId)

  // When timer stops, fill result into custom minutes
  useEffect(() => {
    if (timer.status === 'stopped' && timer.resultMinutes) {
      setCustomMinutes(timer.resultMinutes.toString())
      setDurationMinutes(null)
      timer.reset()
    }
  }, [timer.status, timer.resultMinutes])

  // Restore employee from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedEmployee')
    if (saved) setEmployeeId(saved)
  }, [])

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id)
    localStorage.setItem('selectedEmployee', id)
  }

  const showFlash = (type: 'success' | 'error', message: string) => {
    setFlash({ type, message })
    setTimeout(() => setFlash(null), 3000)
  }

  const handleTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (timer.status === 'running') {
      showFlash('error', 'Bitte zuerst den Timer stoppen.')
      return
    }

    let minutes = durationMinutes
    if (customMinutes) minutes = parseInt(customMinutes)
    if (!minutes || minutes <= 0) {
      showFlash('error', 'Bitte eine Dauer wählen oder eingeben.')
      return
    }

    const { error } = await addTimeEntry({
      employee_id: parseInt(employeeId),
      customer_id: parseInt(customerId),
      service_id: parseInt(serviceId),
      date: dateTime,
      duration_minutes: minutes,
      note: noteTime.trim() || undefined,
    })

    if (error) {
      showFlash('error', 'Fehler beim Speichern: ' + error.message)
    } else {
      showFlash('success', 'Zeitbuchung erfolgreich gespeichert.')
      setDurationMinutes(null)
      setCustomMinutes('')
      setNoteTime('')
      timer.reset()
    }
  }

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await addMaterialEntry({
      employee_id: parseInt(employeeId),
      customer_id: parseInt(customerId),
      date: dateMaterial,
      description: description.trim(),
      quantity: parseFloat(quantity) || 0,
      amount: parseFloat(amount) || 0,
      note: noteMaterial.trim() || undefined,
    })

    if (error) {
      showFlash('error', 'Fehler beim Speichern: ' + error.message)
    } else {
      showFlash('success', 'Materialbuchung erfolgreich gespeichert.')
      setDescription('')
      setQuantity('')
      setAmount('')
      setNoteMaterial('')
    }
  }

  if (loadingEmp || loadingCust || loadingSvc) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>
  }

  if (!employees.length) {
    return (
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="alert alert-warning">
            <span>Bitte zuerst <a href="/admin" className="link link-primary">Mitarbeiter, Kunden und Leistungen</a> anlegen.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Neue Buchung</h2>

        {flash && (
          <div className={`alert ${flash.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
            <span>{flash.message}</span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="join w-full mb-6">
          <button
            type="button"
            className={`join-item btn btn-lg flex-1 ${activeTab === 'time' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('time')}
          >
            Zeitbuchung
          </button>
          <button
            type="button"
            className={`join-item btn btn-lg flex-1 ${activeTab === 'material' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('material')}
          >
            Materialbuchung
          </button>
        </div>

        {/* Time Form */}
        {activeTab === 'time' && (
          <form onSubmit={handleTimeSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label"><span className="label-text">Mitarbeiter *</span></label>
                <select value={employeeId} onChange={e => handleEmployeeChange(e.target.value)} className="select select-bordered w-full" required>
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

              <div className="form-control w-full">
                <label className="label"><span className="label-text">Leistung *</span></label>
                <select value={serviceId} onChange={e => setServiceId(e.target.value)} className="select select-bordered w-full" required>
                  <option value="" disabled>Leistung wählen...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price_per_hour.toFixed(2)} CHF/h)</option>)}
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label"><span className="label-text">Datum *</span></label>
                <input type="date" value={dateTime} onChange={e => setDateTime(e.target.value)} className="input input-bordered w-full" required />
              </div>

              <div className="form-control w-full md:col-span-2">
                <label className="label"><span className="label-text">Dauer *</span></label>

                <div className="flex gap-2 flex-wrap items-center">
                  {[5, 15, 30, 60].map(min => (
                    <button
                      key={min}
                      type="button"
                      className={`btn ${durationMinutes === min && !customMinutes ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => { setDurationMinutes(min); setCustomMinutes('') }}
                    >
                      {min >= 60 ? `${min / 60} h` : `${min} min`}
                    </button>
                  ))}
                  <span className="text-base-content/40">|</span>
                  <input
                    type="number"
                    className="input input-bordered w-28"
                    min="1"
                    placeholder="min"
                    value={customMinutes}
                    onChange={e => { setCustomMinutes(e.target.value); setDurationMinutes(null) }}
                  />
                  <span className="text-base-content/40">|</span>
                  {timer.status === 'idle' && (
                    <button type="button" className="btn btn-success" onClick={() => {
                      if (!employeeId) { showFlash('error', 'Bitte zuerst einen Mitarbeiter wählen.'); return }
                      timer.start()
                    }}>
                      Timer starten
                    </button>
                  )}
                  {timer.status === 'running' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xl font-mono font-bold tabular-nums text-success">{timer.displayTime}</div>
                      <button type="button" className="btn btn-error btn-sm" onClick={() => {
                        timer.stop()
                      }}>Stopp</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-control w-full md:col-span-2">
                <label className="label"><span className="label-text">Notiz</span></label>
                <textarea value={noteTime} onChange={e => setNoteTime(e.target.value)} className="textarea textarea-bordered w-full" rows={2} placeholder="Optionale Bemerkung..." />
              </div>
            </div>

            <div className="card-actions justify-end mt-6">
              <button type="submit" className="btn btn-primary">Zeitbuchung speichern</button>
            </div>
          </form>
        )}

        {/* Material Form */}
        {activeTab === 'material' && (
          <form onSubmit={handleMaterialSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label"><span className="label-text">Mitarbeiter *</span></label>
                <select value={employeeId} onChange={e => handleEmployeeChange(e.target.value)} className="select select-bordered w-full" required>
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

              <div className="form-control w-full">
                <label className="label"><span className="label-text">Material-Beschreibung *</span></label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input input-bordered w-full" placeholder="z.B. Papier, Couverts..." required />
              </div>

              <div className="form-control w-full">
                <label className="label"><span className="label-text">Datum *</span></label>
                <input type="date" value={dateMaterial} onChange={e => setDateMaterial(e.target.value)} className="input input-bordered w-full" required />
              </div>

              <div className="form-control w-full">
                <label className="label"><span className="label-text">Menge</span></label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input input-bordered w-full" step="0.01" min="0" placeholder="z.B. 10" />
              </div>

              <div className="form-control w-full">
                <label className="label"><span className="label-text">Betrag (CHF)</span></label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input input-bordered w-full" step="0.01" min="0" placeholder="z.B. 45.50" />
              </div>

              <div className="form-control w-full md:col-span-2">
                <label className="label"><span className="label-text">Notiz</span></label>
                <textarea value={noteMaterial} onChange={e => setNoteMaterial(e.target.value)} className="textarea textarea-bordered w-full" rows={2} placeholder="Optionale Bemerkung..." />
              </div>
            </div>

            <div className="card-actions justify-end mt-6">
              <button type="submit" className="btn btn-primary">Materialbuchung speichern</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
