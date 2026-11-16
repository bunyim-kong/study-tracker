import { Award, Check, Flame, LockKeyhole, Star, Trophy } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { deriveBadges } from '../lib/badges.js'
import './BadgesPage.css'

const BADGE_ICONS = {
  'first-lesson': Star,
  'three-day-streak': Flame,
  'perfect-day': Award,
  'finished-plan': Trophy,
}

export default function BadgesPage() {
  const { assignment, plan, progress } = useLearnerData()
  const badges = deriveBadges({ plan, progress, startDate: assignment.startDate })
  const unlocked = badges.filter((badge) => badge.unlocked).length

  return (
    <>
      <PageHeader eyebrow={`${unlocked} of ${badges.length} unlocked`} title="Your badge shelf" description="Badges are derived from your progress—no extra points to chase, just visible proof that you showed up." />
      <div className="badge-grid">
        {badges.map((badge) => {
          const Icon = BADGE_ICONS[badge.id]
          return (
            <article className={`badge-sticker ${badge.unlocked ? 'badge-sticker--unlocked' : 'badge-sticker--locked'}`} key={badge.id}>
              <span className="badge-sticker__icon"><Icon aria-hidden="true" /></span>
              <div>
                <span className="badge-sticker__state">{badge.unlocked ? <><Check aria-hidden="true" /> Unlocked</> : <><LockKeyhole aria-hidden="true" /> Locked</>}</span>
                <h2>{badge.name}</h2>
                <p>{badge.description}</p>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
