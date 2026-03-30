import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <NavLink to="/" className="btn btn-ghost text-xl">Montalux Timetracker</NavLink>
        </div>
        <div className="navbar-center">
          <ul className="menu menu-horizontal px-1 gap-1">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                Buchen
              </NavLink>
            </li>
            <li>
              <NavLink to="/entries" className={({ isActive }) => isActive ? 'active' : ''}>
                Übersicht
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                Verwaltung
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <button onClick={logout} className="btn btn-ghost btn-sm">Abmelden</button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Outlet />
      </main>
    </div>
  )
}
