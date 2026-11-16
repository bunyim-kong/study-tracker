import './ProgressBar.css'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function ProgressBar({ value, max = 100, label = 'Progress', showValue = true, size = 'medium' }) {
  const safeMax = max > 0 ? max : 100
  const safeValue = clamp(Number(value) || 0, 0, safeMax)
  const percent = Math.round((safeValue / safeMax) * 100)

  return (
    <div className={`progress progress--${size}`}>
      <div className="progress__meta">
        <span>{label}</span>
        {showValue ? <strong>{percent}%</strong> : null}
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin="0"
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${percent}%`}
      >
        <span className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
