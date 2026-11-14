// Rate = Fat% x fatRate + SNF% x snfRate (rounded to whole rupee). Amount = litres x rate.
export const calcRate = (fat, snf, s = { fat_rate: 7, snf_rate: 1.6 }) =>
  Math.round((Number(fat) || 0) * s.fat_rate + (Number(snf) || 0) * s.snf_rate)
export const calcAmount = (litres, rate) => Math.round((Number(litres) || 0) * rate)
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
export const fmtDay = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
export const fmtDateTime = (d) => {
  const value = d ? new Date(d) : new Date()
  return value.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
export const longDate = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const today = () => new Date().toISOString().slice(0, 10)
