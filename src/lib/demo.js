const STORAGE_KEY = 'milkmitra-demo-data-v1'
export const DEMO_MODE_KEY = 'milkmitra-demo-mode'

const dateAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

const seedData = () => {
  const farmers = [
    { id: 'demo-farmer-1', farmer_code: 'SMCC0001', name: 'Asha Devi', father_name: 'Ramesh Lal', mobile: '9000000001', village: 'Rampur', district: 'Jaipur', milk_type: 'Buffalo', animals: 3, ifsc: 'DEMO0000001', bank_account: '000000000001', created_at: new Date(Date.now() - 150 * 864e5).toISOString() },
    { id: 'demo-farmer-2', farmer_code: 'SMCC0002', name: 'Mohan Singh', father_name: 'Kishan Singh', mobile: '9000000002', village: 'Sundarpura', district: 'Jaipur', milk_type: 'Cow', animals: 2, ifsc: 'DEMO0000002', bank_account: '000000000002', created_at: new Date(Date.now() - 120 * 864e5).toISOString() },
    { id: 'demo-farmer-3', farmer_code: 'SMCC0003', name: 'Sunita Kumari', father_name: 'Gopal Ram', mobile: '9000000003', village: 'Rampur', district: 'Jaipur', milk_type: 'Mixed', animals: 4, ifsc: 'DEMO0000003', bank_account: '000000000003', created_at: new Date(Date.now() - 90 * 864e5).toISOString() },
    { id: 'demo-farmer-4', farmer_code: 'SMCC0004', name: 'Raju Meena', father_name: 'Bhanwar Lal', mobile: '9000000004', village: 'Kacholiya', district: 'Jaipur', milk_type: 'Buffalo', animals: 2, ifsc: 'DEMO0000004', bank_account: '000000000004', created_at: new Date(Date.now() - 60 * 864e5).toISOString() },
    { id: 'demo-farmer-5', farmer_code: 'SMCC0005', name: 'Kamla Sharma', father_name: 'Madan Lal', mobile: '9000000005', village: 'Devpura', district: 'Jaipur', milk_type: 'Cow', animals: 3, ifsc: 'DEMO0000005', bank_account: '000000000005', created_at: new Date(Date.now() - 30 * 864e5).toISOString() },
  ]
  const collections = []
  for (let day = 0; day < 28; day += 1) {
    for (let farmerIndex = 0; farmerIndex < farmers.length; farmerIndex += 1) {
      if ((day + farmerIndex) % 4 === 0) continue
      const farmer = farmers[farmerIndex]
      const shift = (day + farmerIndex) % 2 ? 'Morning' : 'Evening'
      const litres = 8 + ((day * 3 + farmerIndex * 5) % 17)
      const fat = Number((3.5 + ((day + farmerIndex) % 9) * 0.1).toFixed(1))
      const snf = Number((8 + ((day * 2 + farmerIndex) % 7) * 0.1).toFixed(1))
      const rate = Math.round(fat * 7 + snf * 1.6)
      const status = (day + farmerIndex) % 3 === 0 ? 'Pending' : 'Paid'
      collections.push({
        id: `demo-collection-${day}-${farmerIndex}`, owner_id: 'demo-owner', farmer_id: farmer.id,
        collected_on: dateAgo(day), shift, milk_type: farmer.milk_type === 'Mixed' ? (farmerIndex % 2 ? 'Cow' : 'Buffalo') : farmer.milk_type,
        litres, fat, snf, rate, amount: Math.round(litres * rate), status,
        paid_at: status === 'Paid' ? new Date(Date.now() - day * 864e5).toISOString() : null,
        created_at: new Date(Date.now() - day * 864e5 - farmerIndex * 3600000).toISOString(),
      })
    }
  }
  return { settings: [{ owner_id: 'demo-owner', center_name: 'MilkMitra Demo Centre', fat_rate: 7, snf_rate: 1.6 }], farmers, collections }
}

let memoryData
const readData = () => {
  try {
    const saved = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* Use in-memory demo data when storage is unavailable. */ }
  if (!memoryData) memoryData = seedData()
  return memoryData
}
const writeData = (data) => {
  memoryData = data
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* Demo still works for this page session. */ }
}
export const resetDemoData = () => {
  memoryData = seedData()
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(memoryData)) } catch { /* Ignore storage restrictions. */ }
}

class DemoQuery {
  constructor(table) { this.table = table; this.filters = []; this.orders = []; this.operation = 'read'; this.selection = '*'; this.options = {}; this.payload = null; this.returning = false }
  select(columns = '*', options = {}) { this.selection = columns; this.options = options; if (this.operation !== 'read') this.returning = true; return this }
  insert(payload) { this.operation = 'insert'; this.payload = payload; return this }
  update(payload) { this.operation = 'update'; this.payload = payload; return this }
  delete() { this.operation = 'delete'; return this }
  upsert(payload) { this.operation = 'upsert'; this.payload = payload; return this }
  eq(column, value) { this.filters.push((row) => row[column] === value); return this }
  in(column, values) { this.filters.push((row) => values.includes(row[column])); return this }
  order(column, { ascending = true } = {}) { this.orders.push({ column, ascending }); return this }
  matches(row) { return this.filters.every((filter) => filter(row)) }
  project(row, data) {
    if (!row) return row
    const result = { ...row }
    const relation = this.selection.match(/farmers\s*\(([^)]*)\)/)
    if (relation && this.table === 'collections') {
      const fields = relation[1].split(',').map((field) => field.trim())
      const farmer = data.farmers.find((item) => item.id === row.farmer_id)
      result.farmers = farmer ? Object.fromEntries(fields.map((field) => [field, farmer[field]])) : null
    }
    if (this.selection.includes('*')) return result
    const fields = this.selection.split(',').map((field) => field.trim()).filter((field) => !field.startsWith('farmers('))
    return { ...Object.fromEntries(fields.filter((field) => field in result).map((field) => [field, result[field]])), ...(relation ? { farmers: result.farmers } : {}) }
  }
  async execute() {
    const data = readData()
    if (!data[this.table]) return { data: null, error: { message: `Unknown demo table: ${this.table}` }, count: null }
    let rows = data[this.table]
    let changed = false
    if (this.operation === 'insert') {
      const payloads = Array.isArray(this.payload) ? this.payload : [this.payload]
      const added = payloads.map((item) => {
        const row = { ...item, id: item.id || `demo-${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, created_at: item.created_at || new Date().toISOString() }
        if (this.table === 'farmers' && !row.farmer_code) {
          const next = rows.reduce((max, farmer) => Math.max(max, Number(farmer.farmer_code?.slice(4)) || 0), 0) + 1
          row.farmer_code = `SMCC${String(next).padStart(4, '0')}`
        }
        if (this.table === 'settings') row.owner_id ||= 'demo-owner'
        return row
      })
      rows.push(...added); rows = added; changed = true
    } else if (this.operation === 'upsert') {
      const payload = Array.isArray(this.payload) ? this.payload[0] : this.payload
      const existing = rows.find((row) => row.owner_id === 'demo-owner')
      if (existing) Object.assign(existing, payload, { owner_id: 'demo-owner' })
      else rows.push({ ...payload, owner_id: 'demo-owner' })
      rows = [existing || rows[rows.length - 1]]; changed = true
    } else if (this.operation === 'update') {
      rows = rows.filter((row) => this.matches(row))
      rows.forEach((row) => {
        Object.assign(row, this.payload)
        if (row.status === 'Paid' && !row.paid_at) row.paid_at = new Date().toISOString()
        if (row.status === 'Pending') row.paid_at = null
      })
      changed = true
    } else if (this.operation === 'delete') {
      const removed = rows.filter((row) => this.matches(row))
      data[this.table] = rows.filter((row) => !this.matches(row))
      if (this.table === 'farmers') {
        const removedIds = removed.map((row) => row.id)
        data.collections = data.collections.filter((row) => !removedIds.includes(row.farmer_id))
      }
      rows = removed; changed = true
    } else {
      rows = rows.filter((row) => this.matches(row))
      for (const { column, ascending } of this.orders) rows.sort((a, b) => (a[column] > b[column] ? 1 : a[column] < b[column] ? -1 : 0) * (ascending ? 1 : -1))
    }
    if (changed) writeData(data)
    const count = this.options.count ? rows.length : null
    if (this.options.head) return { data: null, error: null, count }
    const result = rows.map((row) => this.project(row, data))
    return { data: result, error: null, count }
  }
  then(resolve, reject) { return this.execute().then(resolve, reject) }
  async maybeSingle() { const result = await this.execute(); return { ...result, data: result.data?.[0] || null } }
  async single() { const result = await this.execute(); return { ...result, data: result.data?.[0] || null } }
}

export const demoDatabase = { from: (table) => new DemoQuery(table) }
export const isDemoMode = () => {
  try { return globalThis.localStorage?.getItem(DEMO_MODE_KEY) === 'true' } catch { return false }
}
