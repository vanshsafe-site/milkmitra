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
  ['/help', 'Help', '❔'],
  ['/settings', 'Settings', '⚙'],
]

export default function Layout({ children }) {
  const { session, settings, isDemo, exitDemo } = useAuth()
  const nav = useNavigate()
  const logout = async () => {
    if (isDemo) exitDemo()
    else await supabase.auth.signOut()
    nav('/')
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="side-logo"><Logo size={70} /></NavLink>
        {isDemo && <div className="demo-banner">Demo mode · changes are saved in this browser only</div>}
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
            <b>{isDemo ? 'Demo operator' : 'Operator'}</b>
            <small>{settings.center_name}</small>
            <button className="link-btn" onClick={logout}>{isDemo ? 'Exit demo' : 'Log out'}</button>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
