import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Farmers from './pages/Farmers.jsx'
import Collection from './pages/Collection.jsx'
import Records from './pages/Records.jsx'
import Payments from './pages/Payments.jsx'
import Help from './pages/Help.jsx'
import Settings from './pages/Settings.jsx'

function Protected({ children }) {
  const { session } = useAuth()
  if (session === undefined) return <div className="center-msg">Loading…</div>
  return session ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/farmers" element={<Protected><Farmers /></Protected>} />
      <Route path="/collection" element={<Protected><Collection /></Protected>} />
      <Route path="/records" element={<Protected><Records /></Protected>} />
      <Route path="/payments" element={<Protected><Payments /></Protected>} />
      <Route path="/help" element={<Protected><Help /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
