import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, EmptyState, ErrorState, LoadingState } from '../components/index.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useLearnerData } from '../context/LearnerDataContext.jsx'
import { addDays, formatStudyDate } from '../lib/dates.js'
import './ReviewPage.css'

export default function ReviewPage() {
  const { adapter } = useAuth()
  const { assignment, plan } = useLearnerData()
  const [notes, setNotes] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNotes(await adapter.listNotes())
    } catch (loadError) {
      setError(loadError.message || 'Your notes could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [adapter])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return notes.filter((note) => {
      if (!normalizedQuery) return true
      const day = plan.days.find((item) => item.id === note.dayId)
      return [day?.topic, note.learned, note.built, note.confused, note.remember, note.question]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [notes, plan.days, query])

  if (loading) return <LoadingState message="Gathering your notes…" />
  if (error) return <ErrorState message={error} onRetry={loadNotes} />

  return (
    <>
      <PageHeader eyebrow="Your learning archive" title="Review what stuck" description="Search the words you wrote after each lesson. Your own explanations are powerful study material." />
      <div className="review-search">
        <label className="sr-only" htmlFor="review-query">Search past notes</label>
        <Search aria-hidden="true" />
        <input id="review-query" className="search-input" type="search" placeholder="Search topics and notes…" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      {notes.length === 0 ? (
        <EmptyState mood="thinking" title="Your review shelf is empty"><p>Complete a day note and it will appear here.</p></EmptyState>
      ) : filteredNotes.length === 0 ? (
        <EmptyState mood="thinking" title="No notes match that search"><p>Try a topic, tool, or phrase you remember writing.</p></EmptyState>
      ) : (
        <div className="review-list">
          {filteredNotes.map((note) => {
            const day = plan.days.find((item) => item.id === note.dayId)
            if (!day) return null
            const noteDate = addDays(assignment.startDate, day.dayNumber - 1)
            return (
              <Card as="article" className="review-card" key={note.dayId}>
                <div className="review-card__meta"><span>Day {day.dayNumber}</span><time dateTime={noteDate}>{formatStudyDate(noteDate)}</time></div>
                <h2>{day.topic}</h2>
                <p>{note.learned || note.built || 'This note is waiting for a few more words.'}</p>
                <Link to={`/app/note/${day.dayNumber}`}>Open full note →</Link>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
