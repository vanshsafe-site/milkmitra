export default function Logo({ size = 64 }) {
  return (
    <div className="logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="48" fill="#bfe6f7" />
        <text x="50" y="46" textAnchor="middle" fontFamily="Georgia,serif" fontStyle="italic" fontWeight="700" fontSize="24" fill="#0b3fa8">Milk</text>
        <text x="50" y="72" textAnchor="middle" fontFamily="Georgia,serif" fontStyle="italic" fontWeight="700" fontSize="26" fill="#0b3fa8">Mitra</text>
      </svg>
    </div>
  )
}
