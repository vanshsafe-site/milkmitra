import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import Logo from './Logo.jsx'

const links = [
  ['/dashboard', 'Dashboard', '▦'],
  ['/farmers', 'Farmers', '👥'],
  ['/collection', 'Collection', '📋'],
  ['/records', 'Records', '▤'],
  ['/payments', 'Payments', '₹'],
  ['/settings', 'Settings', '⚙'],
]

export default function Layout({ children }) {
  const { session, settings } = useAuth()
  const nav = useNavigate()
  const logout = async () => { await supabase.auth.signOut(); nav('/') }
  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="side-logo"><Logo size={70} /></NavLink>
        <nav>
          {links.map(([to, label, icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="ico">{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="operator">
          <div className="avatar">{(session?.user?.email || 'O')[0].toUpperCase()}</div>
          <div>
            <b>Operator</b>
            <small>{settings.center_name}</small>
            <button className="link-btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
