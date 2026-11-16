import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const LearnerDataContext = createContext(null)

export function LearnerDataProvider({ children }) {
  const { adapter, user } = useAuth()
  const [assignment, setAssignment] = useState(null)
  const [plan, setPlan] = useState(null)
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const nextAssignment = await adapter.getMyAssignment()
      if (!nextAssignment) {
        setAssignment(null)
        setPlan(null)
        setProgress([])
        return
      }

      const [nextPlan, nextProgress] = await Promise.all([
        adapter.getPlanForLearner(user.id),
        adapter.getProgress(user.id),
      ])
      setAssignment(nextAssignment)
      setPlan(nextPlan)
      setProgress(nextProgress)
    } catch (loadError) {
      setError(loadError.message || 'Your study plan could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [adapter, user.id])

  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo(
    () => ({
      assignment,
      plan,
      progress,
      loading,
      error,
      reload,
      async setSessionDone(sessionId, done) {
        const record = await adapter.setSessionDone(sessionId, done)
        setProgress((current) => {
          const withoutSession = current.filter((item) => item.sessionId !== sessionId)
          return [...withoutSession, record]
        })
        return record
      },
    }),
    [adapter, assignment, error, loading, plan, progress, reload],
  )

  return <LearnerDataContext.Provider value={value}>{children}</LearnerDataContext.Provider>
}

export function useLearnerData() {
  const context = useContext(LearnerDataContext)
  if (!context) throw new Error('useLearnerData must be used inside LearnerDataProvider.')
  return context
}
