import { longDate } from '../lib/util'
import { useLanguage } from '../lib/language.jsx'

export const PageHead = ({ title }) => {
  const { t, language } = useLanguage()
  return <div className="page-head"><h1>{t(title)}</h1><span>{new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-GB', { dateStyle: 'full' }).format(new Date())}</span></div>
}
export const Badge = ({ status }) => {
  const { t } = useLanguage()
  return <span className={'badge ' + status.toLowerCase()}>{'● ' + t(status)}</span>
}
export const Stat = ({ color, label, value }) => {
  const { t } = useLanguage()
  return <div className="stat" style={{ '--c': color }}><small>{t(label)}</small><b>{value}</b></div>
}
export const Empty = ({ children }) => {
  const { t } = useLanguage()
  return <p className="empty">{typeof children === 'string' ? t(children) : children}</p>
}
