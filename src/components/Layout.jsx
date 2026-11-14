import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { useLanguage } from '../lib/language.jsx'
import Logo from './Logo.jsx'

const links = [
  ['/dashboard', 'Dashboard', '▦'], ['/farmers', 'Farmers', '👥'], ['/collection', 'Collection', '📋'],
  ['/records', 'Records', '▤'], ['/payments', 'Payments', '₹'], ['/settings', 'Settings', '⚙'],
]

export default function Layout({ children }) {
  const { session, settings, isDemo, exitDemo } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
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
        <button type="button" className="language-switch" onClick={toggleLanguage} aria-label={language === 'en' ? 'Switch language to Hindi' : 'भाषा अंग्रेज़ी में बदलें'}>{language === 'en' ? 'हिन्दी' : 'English'}</button>
        {isDemo && <div className="demo-banner">{t('Demo mode · changes are saved in this browser only')}</div>}
        <nav aria-label={t('Main navigation')}>
          {links.map(([to, label, icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <span className="ico">{icon}</span>{t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="operator">
          <div className="avatar">{(session?.user?.email || 'O')[0].toUpperCase()}</div>
          <div>
            <b>{t(isDemo ? 'Demo operator' : 'Operator')}</b>
            <small>{settings.center_name}</small>
            <button className="link-btn" onClick={logout}>{t(isDemo ? 'Exit demo' : 'Log out')}</button>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
