import { useId } from 'react'
import './Mascot.css'

const MOOD_LABELS = {
  happy: 'Pip the owl is smiling',
  cheering: 'Pip the owl is cheering',
  sleepy: 'Pip the owl is sleepy',
  thinking: 'Pip the owl is thinking',
}

function Eyes({ mood }) {
  if (mood === 'sleepy') {
    return (
      <g fill="none" stroke="#243052" strokeLinecap="round" strokeWidth="6">
        <path d="M66 91q10 9 20 0" />
        <path d="M114 91q10 9 20 0" />
      </g>
    )
  }

  if (mood === 'cheering') {
    return (
      <g fill="none" stroke="#243052" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6">
        <path d="m66 94 10-8 10 8" />
        <path d="m114 94 10-8 10 8" />
      </g>
    )
  }

  return (
    <g>
      <circle cx="76" cy="91" r="10" fill="#243052" />
      <circle cx="124" cy="91" r="10" fill="#243052" />
      <circle cx="72" cy="87" r="3" fill="#fffaf1" />
      <circle cx="120" cy="87" r="3" fill="#fffaf1" />
      {mood === 'thinking' ? <circle cx="128" cy="95" r="2.5" fill="#fffaf1" /> : null}
    </g>
  )
}

function MoodDetails({ mood }) {
  if (mood === 'cheering') {
    return (
      <>
        <path className="mascot__wing mascot__wing--left" d="M43 113Q14 91 22 65q24 10 38 33" fill="#d08a52" />
        <path className="mascot__wing mascot__wing--right" d="M157 113q29-22 21-48-24 10-38 33" fill="#d08a52" />
        <path d="M88 111q12 14 24 0" fill="#7a321f" stroke="#243052" strokeLinecap="round" strokeWidth="4" />
        <g className="mascot__spark" fill="#ffd84d">
          <path d="m25 35 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
          <path d="m174 32 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        </g>
      </>
    )
  }

  if (mood === 'sleepy') {
    return (
      <>
        <path className="mascot__wing" d="M50 117q17 12 30 2-6 25-28 18" fill="#d08a52" />
        <path className="mascot__wing" d="M150 117q-17 12-30 2 6 25 28 18" fill="#d08a52" />
        <path d="M95 112q5 4 10 0" fill="none" stroke="#243052" strokeLinecap="round" strokeWidth="4" />
        <g className="mascot__zzz" fill="#ffd84d" fontFamily="Baloo 2" fontWeight="700">
          <text x="150" y="59" fontSize="18">z</text>
          <text x="164" y="43" fontSize="24">z</text>
        </g>
      </>
    )
  }

  if (mood === 'thinking') {
    return (
      <>
        <path className="mascot__wing" d="M48 119q22 13 39-3-5 25-34 23" fill="#d08a52" />
        <path className="mascot__wing mascot__wing--thinking" d="M150 126q-12-20-29-15 4 13 18 20" fill="#d08a52" />
        <path d="M94 114q8-5 16 0" fill="none" stroke="#243052" strokeLinecap="round" strokeWidth="4" />
        <g className="mascot__thought" fill="#f1f4ff">
          <circle cx="152" cy="58" r="5" opacity=".55" />
          <circle cx="164" cy="43" r="8" opacity=".7" />
          <path d="M166 18c14-9 31 2 26 16-3 10-17 12-26 7-11 2-20-4-18-12 2-8 10-12 18-11Z" opacity=".85" />
        </g>
      </>
    )
  }

  return (
    <>
      <path className="mascot__wing" d="M48 115q17 22 38 6-10 27-35 17" fill="#d08a52" />
      <path className="mascot__wing" d="M152 115q-17 22-38 6 10 27 35 17" fill="#d08a52" />
      <path d="M89 111q11 13 22 0" fill="none" stroke="#243052" strokeLinecap="round" strokeWidth="4" />
    </>
  )
}

export default function Mascot({ mood = 'happy', size = 180, label, className = '' }) {
  const titleId = useId()
  const safeMood = Object.hasOwn(MOOD_LABELS, mood) ? mood : 'happy'

  return (
    <svg
      className={`mascot mascot--${safeMood} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{label || MOOD_LABELS[safeMood]}</title>
      <defs>
        <linearGradient id={`${titleId}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#efad72" />
          <stop offset="1" stopColor="#c77842" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="174" rx="51" ry="9" fill="#111a36" opacity=".2" />
      <path d="M52 70 44 38l29 16M148 70l8-32-29 16" fill="#a75b35" stroke="#243052" strokeLinejoin="round" strokeWidth="5" />
      <path d="M42 111c0-47 24-72 58-72s58 25 58 72c0 41-24 64-58 64s-58-23-58-64Z" fill={`url(#${titleId}-body)`} stroke="#243052" strokeWidth="6" />
      <path d="M65 69q35-25 70 0-5 24-35 26-30-2-35-26Z" fill="#ffcf91" opacity=".72" />
      <circle cx="76" cy="89" r="23" fill="#fff3da" />
      <circle cx="124" cy="89" r="23" fill="#fff3da" />
      <Eyes mood={safeMood} />
      <path d="m100 95-9 11 9 6 9-6Z" fill="#ffd84d" stroke="#243052" strokeLinejoin="round" strokeWidth="3" />
      <path d="M76 142q24 17 48 0-7 27-24 31-17-4-24-31Z" fill="#f7cda6" opacity=".75" />
      <MoodDetails mood={safeMood} />
      <path d="M76 171v8m48-8v8" fill="none" stroke="#243052" strokeLinecap="round" strokeWidth="5" />
    </svg>
  )
}
