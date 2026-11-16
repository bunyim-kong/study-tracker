import { useEffect, useState } from 'react'
import { Moon, Play, RotateCcw, Sparkles, Sun } from 'lucide-react'
import { Button, Card, Confetti, Mascot, ProgressBar } from '../components/index.js'
import './StyleGuidePage.css'

const MOODS = [
  ['happy', 'Happy'],
  ['cheering', 'Cheering'],
  ['sleepy', 'Sleepy'],
  ['thinking', 'Thinking'],
]

function ComponentShowcase({ compact = false }) {
  const [confettiRun, setConfettiRun] = useState(0)

  return (
    <div className={`showcase ${compact ? 'showcase--compact' : ''}`}>
      <Card className="showcase__hero">
        <div>
          <span className="showcase__eyebrow">Tonight’s tiny win</span>
          <h2>Make React feel familiar again.</h2>
          <p>Four focused sessions, one friendly owl, and no pressure to remember everything at once.</p>
          <Button icon={Play} size="large">Start today</Button>
        </div>
        <Mascot mood="happy" size={compact ? 150 : 190} />
      </Card>

      <section className="showcase__section" aria-labelledby={`mascot-${compact ? 'phone' : 'laptop'}`}>
        <div className="showcase__heading">
          <div>
            <span className="showcase__eyebrow">Original mascot</span>
            <h2 id={`mascot-${compact ? 'phone' : 'laptop'}`}>Meet Pip</h2>
          </div>
          <span className="showcase__chip">4 moods</span>
        </div>
        <div className="mood-grid">
          {MOODS.map(([mood, name]) => (
            <Card variant="quiet" className="mood-card" key={mood}>
              <Mascot mood={mood} size={compact ? 112 : 135} />
              <strong>{name}</strong>
            </Card>
          ))}
        </div>
      </section>

      <section className="showcase__section" aria-labelledby={`controls-${compact ? 'phone' : 'laptop'}`}>
        <span className="showcase__eyebrow">Touch-friendly controls</span>
        <h2 id={`controls-${compact ? 'phone' : 'laptop'}`}>Buttons</h2>
        <div className="button-row">
          <Button icon={Sparkles}>Mark as done</Button>
          <Button variant="ghost">Not right now</Button>
          <Button loading>Saving</Button>
          <Button variant="ghost" disabled>Unavailable</Button>
        </div>
      </section>

      <section className="showcase__section" aria-labelledby={`cards-${compact ? 'phone' : 'laptop'}`}>
        <span className="showcase__eyebrow">Surfaces</span>
        <h2 id={`cards-${compact ? 'phone' : 'laptop'}`}>Cards</h2>
        <div className="card-grid">
          <Card>
            <span className="showcase__chip">Research · 20:00</span>
            <h3>Read with a question</h3>
            <p className="showcase__muted">What problem do props solve?</p>
          </Card>
          <Card variant="raised">
            <span className="showcase__chip showcase__chip--done">Done +1 star</span>
            <h3>Practice complete</h3>
            <p className="showcase__muted">Your ProfileCard is taking shape.</p>
          </Card>
          <Card variant="quiet">
            <span className="showcase__chip">Next up</span>
            <h3>Quick self-check</h3>
            <p className="showcase__muted">Explain it without opening your notes.</p>
          </Card>
        </div>
      </section>

      <section className="showcase__section" aria-labelledby={`progress-${compact ? 'phone' : 'laptop'}`}>
        <span className="showcase__eyebrow">Clear at a glance</span>
        <h2 id={`progress-${compact ? 'phone' : 'laptop'}`}>Progress</h2>
        <Card className="progress-stack">
          <ProgressBar value={25} label="Day 1" size="small" />
          <ProgressBar value={68} label="Weekly plan" />
          <ProgressBar value={100} label="All sessions" size="large" />
        </Card>
      </section>

      <section className="showcase__section" aria-labelledby={`celebrate-${compact ? 'phone' : 'laptop'}`}>
        <span className="showcase__eyebrow">Motion with purpose</span>
        <h2 id={`celebrate-${compact ? 'phone' : 'laptop'}`}>Celebration</h2>
        <Card variant="raised" className="celebration-card">
          <Confetti key={confettiRun} />
          <Mascot mood="cheering" size={compact ? 125 : 150} />
          <div>
            <h3>Nice work!</h3>
            <p>One more star for showing up.</p>
            <Button
              variant="ghost"
              size="small"
              icon={RotateCcw}
              onClick={() => setConfettiRun((run) => run + 1)}
            >
              Replay
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}

function PreviewFrame({ type, children }) {
  const isPhone = type === 'phone'
  return (
    <article className={`preview preview--${type}`}>
      <header className="preview__bar">
        <span>{isPhone ? 'Phone' : 'Laptop'}</span>
        <span>{isPhone ? '375 px' : '1024 px'}</span>
      </header>
      <div className="preview__canvas">{children}</div>
    </article>
  )
}

export default function StyleGuidePage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('study-tracker:theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('study-tracker:theme', theme)
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <main className="styleguide">
      <header className="styleguide__intro">
        <div className="styleguide__brand" aria-label="Study Tracker">
          <span className="styleguide__logo" aria-hidden="true">ST</span>
          <span>Study Tracker</span>
        </div>
        <div className="styleguide__title-row">
          <div>
            <span className="showcase__eyebrow">Stage 1 · Foundation</span>
            <h1>Friendly focus, after dark.</h1>
            <p>A responsive review of the core visual language before product pages are built.</p>
          </div>
          <Button
            variant="ghost"
            icon={isDark ? Sun : Moon}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? 'Light theme' : 'Dark theme'}
          </Button>
        </div>
      </header>

      <div className="preview-list">
        <PreviewFrame type="phone">
          <ComponentShowcase compact />
        </PreviewFrame>
        <PreviewFrame type="laptop">
          <ComponentShowcase />
        </PreviewFrame>
      </div>
    </main>
  )
}
