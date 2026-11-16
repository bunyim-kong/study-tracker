import './Confetti.css'

const PARTICLES = [
  [8, 20, -18, '#ffd84d', 0],
  [20, 70, 12, '#4ade80', 60],
  [33, 36, -8, '#ef9a62', 20],
  [47, 82, 20, '#f1f4ff', 90],
  [58, 28, -14, '#74c7ff', 45],
  [69, 62, 10, '#ffd84d', 110],
  [81, 18, -20, '#4ade80', 30],
  [92, 74, 16, '#ef9a62', 75],
  [14, 48, 22, '#74c7ff', 100],
  [75, 44, -10, '#f1f4ff', 10],
]

export default function Confetti({ active = true, className = '' }) {
  if (!active) return null

  return (
    <span className={`confetti ${className}`.trim()} aria-hidden="true">
      {PARTICLES.map(([left, top, rotate, color, delay], index) => (
        <span
          className="confetti__piece"
          key={`${left}-${top}`}
          style={{
            '--confetti-left': `${left}%`,
            '--confetti-top': `${top}%`,
            '--confetti-rotate': `${rotate}deg`,
            '--confetti-color': color,
            '--confetti-delay': `${delay}ms`,
            '--confetti-drift': `${index % 2 === 0 ? -12 : 12}px`,
          }}
        />
      ))}
    </span>
  )
}
