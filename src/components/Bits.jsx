import { longDate } from '../lib/util'
export const PageHead = ({ title }) => (
  <div className="page-head"><h1>{title}</h1><span>{longDate()}</span></div>
)
export const Badge = ({ status }) => (
  <span className={'badge ' + status.toLowerCase()}>● {status}</span>
)
export const Stat = ({ color, label, value }) => (
  <div className="stat" style={{ '--c': color }}><small>{label}</small><b>{value}</b></div>
)
export const Empty = ({ children }) => <p className="empty">{children}</p>
