import { addDays, getPlanDayNumber, toLocalDateKey } from '../lib/dates.js'
import { getDayProgress, getPlanProgress, isDayComplete } from '../lib/progress.js'
import { calculatePlanStreak } from '../lib/streak.js'
import { assertValid, PLAN_LIMITS, validateDay, validatePlanDetails, validateSession } from '../lib/planValidation.js'
import { createSafeStorage, getBrowserStorage } from '../lib/storage.js'
import { createSeedState } from './seed/seedPlan.js'

const STORAGE_KEY = 'study-tracker:mock-data:v3'
const ADMIN_PERMISSION_ERROR = 'Permission denied: admin access required.'

function clone(value) {
  return structuredClone(value)
}

function createId(prefix) {
  const uniquePart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uniquePart}`
}

function copyPlan(sourcePlan, { title, isLearnerCopy = false, templateId = null }) {
  const planId = createId('plan')
  return {
    ...clone(sourcePlan),
    id: planId,
    title,
    templateId,
    isLearnerCopy,
    days: sourcePlan.days.map((day) => {
      const dayId = createId('day')
      return {
        ...clone(day),
        id: dayId,
        planId,
        sessions: day.sessions.map((session, index) => ({
          ...clone(session),
          id: createId('session'),
          dayId,
          sortOrder: index + 1,
        })),
      }
    }),
  }
}

export function createMockAdapter({ storage, initialState } = {}) {
  const safeStorage = storage ? createSafeStorage(storage) : getBrowserStorage()
  let state

  function persist() {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  function load() {
    if (state) return state
    const stored = safeStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.version === 3) {
          state = parsed
          return state
        }
      } catch {
        // A broken local demo recovers from the seed below.
      }
    }
    state = clone(initialState || createSeedState())
    persist()
    return state
  }

  function findProfile(userId) {
    return load().profiles.find((profile) => profile.id === userId) || null
  }

  function currentProfile() {
    const userId = load().session?.userId
    return userId ? findProfile(userId) : null
  }

  function requireCurrentProfile() {
    const profile = currentProfile()
    if (!profile) throw new Error('Please sign in to continue.')
    if (!profile.active) throw new Error('This account is inactive.')
    return profile
  }

  function requireAdmin() {
    const profile = requireCurrentProfile()
    if (profile.role !== 'admin') throw new Error(ADMIN_PERMISSION_ERROR)
    return profile
  }

  function allowedLearnerId(requestedLearnerId) {
    const profile = requireCurrentProfile()
    if (profile.role === 'admin') return requestedLearnerId || profile.id
    if (requestedLearnerId && requestedLearnerId !== profile.id) {
      throw new Error('You can only access your own study data.')
    }
    return profile.id
  }

  function findPlan(planId) {
    return load().plans.find((plan) => plan.id === planId) || null
  }

  function findAssignment(learnerId) {
    return load().assignments.find((assignment) => assignment.learnerId === learnerId) || null
  }

  function findSession(sessionId) {
    for (const plan of load().plans) {
      for (const day of plan.days) {
        const session = day.sessions.find((item) => item.id === sessionId)
        if (session) return { plan, day, session }
      }
    }
    return null
  }

  function setProgressRecord({ learnerId, sessionId, done }) {
    const assignment = findAssignment(learnerId)
    const sessionMatch = findSession(sessionId)
    if (!assignment || !sessionMatch || sessionMatch.plan.id !== assignment.planId) {
      throw new Error('That session is not in this learner’s assigned plan.')
    }
    const existing = load().progress.find(
      (item) => item.learnerId === learnerId && item.sessionId === sessionId,
    )
    const record = { learnerId, sessionId, done: Boolean(done), doneAt: done ? new Date().toISOString() : null }
    if (existing) Object.assign(existing, record)
    else state.progress.push(record)
    persist()
    return clone(record)
  }

  function buildLearnerOverview(learnerId, today) {
    const learner = findProfile(learnerId)
    if (!learner || learner.role !== 'learner') throw new Error('Learner not found.')
    const assignment = findAssignment(learnerId)
    if (!assignment) {
      return {
        ...clone(learner),
        assignment: null,
        planId: null,
        planTitle: null,
        dayNumber: null,
        todayDone: 0,
        todayTotal: 0,
        streak: 0,
        lastNoteDate: null,
        missedYesterday: false,
        unansweredQuestions: [],
        planComplete: false,
      }
    }

    const plan = findPlan(assignment.planId)
    const progress = load().progress.filter((item) => item.learnerId === learnerId)
    const notes = load().notes.filter((note) => note.learnerId === learnerId)
    const dayNumber = getPlanDayNumber(assignment.startDate, today)
    const todayDay = plan?.days.find((day) => day.dayNumber === dayNumber)
    const todayProgress = getDayProgress(todayDay, progress)
    const yesterdayDay = plan?.days.find((day) => day.dayNumber === dayNumber - 1)
    const lastNote = [...notes].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))[0]

    return {
      ...clone(learner),
      assignment: clone(assignment),
      planId: plan?.id || null,
      planTitle: plan?.title || null,
      dayNumber,
      todayDone: todayProgress.completed,
      todayTotal: todayProgress.total,
      streak: plan ? calculatePlanStreak({ plan, progress, startDate: assignment.startDate, today }) : 0,
      lastNoteDate: lastNote?.updatedAt?.slice(0, 10) || null,
      missedYesterday: Boolean(yesterdayDay && !isDayComplete(yesterdayDay, progress)),
      unansweredQuestions: clone(notes.filter((note) => note.question?.trim() && !note.mentorComment?.trim())),
      planComplete: plan ? getPlanProgress(plan, progress).percent === 100 : false,
    }
  }

  return {
    async getCurrentUser() {
      const profile = currentProfile()
      return profile ? clone(profile) : null
    },

    async signIn({ email, password }) {
      const normalizedEmail = email.trim().toLowerCase()
      const account = load().accounts.find(
        (item) => item.email.toLowerCase() === normalizedEmail && item.password === password,
      )
      if (!account) throw new Error('Email or password is incorrect.')
      const profile = findProfile(account.userId)
      if (!profile?.active) throw new Error('This account is inactive. Ask your mentor for help.')
      state.session = { userId: account.userId }
      persist()
      return clone(profile)
    },

    async signOut() {
      load().session = null
      persist()
    },

    async changePassword({ currentPassword, newPassword }) {
      const profile = requireCurrentProfile()
      const account = load().accounts.find((item) => item.userId === profile.id)
      if (!account || account.password !== currentPassword) throw new Error('Current password is incorrect.')
      if (newPassword.length < 10) throw new Error('New password must be at least 10 characters.')
      if (newPassword === currentPassword) throw new Error('New password must differ from the current password.')
      account.password = newPassword
      profile.mustChangePassword = false
      persist()
      return clone(profile)
    },

    async registerLearner({ name, email, password }) {
      const cleanName = name.trim()
      const normalizedEmail = email.trim().toLowerCase()
      if (!cleanName) throw new Error('Name is required.')
      if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Enter a valid email address.')
      if (password.length < 10) throw new Error('Password must be at least 10 characters.')
      if (load().accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
        throw new Error('An account with that email already exists.')
      }
      const profile = {
        id: createId('user'),
        name: cleanName,
        email: normalizedEmail,
        role: 'learner',
        active: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      }
      state.profiles.push(profile)
      state.accounts.push({ userId: profile.id, email: normalizedEmail, password })
      state.session = { userId: profile.id }
      persist()
      return clone(profile)
    },

    async getMyAssignment() {
      const profile = requireCurrentProfile()
      const assignment = findAssignment(profile.id)
      return assignment ? clone(assignment) : null
    },

    async getPlanForLearner(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const assignment = findAssignment(safeLearnerId)
      const plan = assignment ? findPlan(assignment.planId) : null
      return plan ? clone(plan) : null
    },

    async getAssignmentForLearner(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const assignment = findAssignment(safeLearnerId)
      if (!assignment) return null
      return clone({ ...assignment, plan: findPlan(assignment.planId) })
    },

    async getProgress(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      return clone(load().progress.filter((item) => item.learnerId === safeLearnerId))
    },

    async setSessionProgress({ learnerId, sessionId, done }) {
      return setProgressRecord({ learnerId: allowedLearnerId(learnerId), sessionId, done })
    },

    async setSessionDone(sessionId, done) {
      return setProgressRecord({ learnerId: allowedLearnerId(), sessionId, done })
    },

    async getNotes(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      return clone(load().notes.filter((note) => note.learnerId === safeLearnerId))
    },

    async listNotes(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      return clone(load().notes.filter((note) => note.learnerId === safeLearnerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    },

    async getNote(dayId, learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const note = load().notes.find((item) => item.learnerId === safeLearnerId && item.dayId === dayId)
      return note ? clone(note) : null
    },

    async saveNote({ learnerId, dayId, ...fields }) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const profile = requireCurrentProfile()
      const existing = load().notes.find((note) => note.learnerId === safeLearnerId && note.dayId === dayId)
      const learnerFields = ['learned', 'built', 'confused', 'remember', 'question']
      const allowedFields = profile.role === 'admin' ? [...learnerFields, 'mentorComment'] : learnerFields
      const changes = Object.fromEntries(Object.entries(fields).filter(([key]) => allowedFields.includes(key)))
      const note = { ...(existing || { learnerId: safeLearnerId, dayId, mentorComment: '' }), ...changes, updatedAt: new Date().toISOString() }
      if (existing) Object.assign(existing, note)
      else state.notes.push(note)
      persist()
      return clone(note)
    },

    async updateMyProfile({ name }) {
      const profile = requireCurrentProfile()
      const cleanName = name.trim()
      if (!cleanName) throw new Error('Name is required.')
      profile.name = cleanName
      persist()
      return clone(profile)
    },

    async exportMyData() {
      const profile = requireCurrentProfile()
      const assignment = findAssignment(profile.id)
      return clone({
        exportedAt: new Date().toISOString(),
        profile,
        assignment,
        plan: assignment ? findPlan(assignment.planId) : null,
        progress: load().progress.filter((item) => item.learnerId === profile.id),
        notes: load().notes.filter((note) => note.learnerId === profile.id),
      })
    },

    async listLearners() {
      requireAdmin()
      return clone(load().profiles.filter((profile) => profile.role === 'learner'))
    },

    async getLearnerOverview(learnerId, today = new Date()) {
      requireAdmin()
      return clone(buildLearnerOverview(learnerId, today))
    },

    async listNotesForLearner(learnerId) {
      requireAdmin()
      return clone(load().notes.filter((note) => note.learnerId === learnerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    },

    async setMentorComment({ learnerId, dayId, mentorComment }) {
      requireAdmin()
      if ((mentorComment || '').length > PLAN_LIMITS.exercise) throw new Error(`Mentor comment must be ${PLAN_LIMITS.exercise} characters or fewer.`)
      const note = load().notes.find((item) => item.learnerId === learnerId && item.dayId === dayId)
      if (!note) throw new Error('Note not found.')
      note.mentorComment = mentorComment
      note.updatedAt = new Date().toISOString()
      persist()
      return clone(note)
    },

    async setLearnerActive(learnerId, active) {
      requireAdmin()
      const learner = findProfile(learnerId)
      if (!learner || learner.role !== 'learner') throw new Error('Learner not found.')
      learner.active = Boolean(active)
      persist()
      return clone(learner)
    },

    async listPlans() {
      requireAdmin()
      return clone(load().plans)
    },

    async getPlan(planId) {
      requireAdmin()
      const plan = findPlan(planId)
      return plan ? clone(plan) : null
    },

    async createPlan(details) {
      requireAdmin()
      assertValid(validatePlanDetails(details))
      const plan = { id: createId('plan'), title: details.title.trim(), description: (details.description || '').trim(), isLearnerCopy: false, templateId: null, days: [] }
      state.plans.push(plan)
      persist()
      return clone(plan)
    },

    async updatePlan(planId, details) {
      requireAdmin()
      const plan = findPlan(planId)
      if (!plan) throw new Error('Plan not found.')
      const next = { ...plan, ...details, title: details.title.trim(), description: (details.description || '').trim() }
      assertValid(validatePlanDetails(next))
      Object.assign(plan, next)
      persist()
      return clone(plan)
    },

    async deletePlan(planId) {
      requireAdmin()
      if (load().assignments.some((assignment) => assignment.planId === planId)) {
        throw new Error('This plan cannot be deleted because it has an assignment.')
      }
      const index = state.plans.findIndex((plan) => plan.id === planId)
      if (index === -1) throw new Error('Plan not found.')
      const [removed] = state.plans.splice(index, 1)
      const sessionIds = new Set(removed.days.flatMap((day) => day.sessions.map((session) => session.id)))
      const dayIds = new Set(removed.days.map((day) => day.id))
      state.progress = state.progress.filter((item) => !sessionIds.has(item.sessionId))
      state.notes = state.notes.filter((note) => !dayIds.has(note.dayId))
      persist()
    },

    async duplicatePlan(planId) {
      requireAdmin()
      const source = findPlan(planId)
      if (!source) throw new Error('Plan not found.')
      const duplicate = copyPlan(source, { title: `${source.title} (Copy)` })
      state.plans.push(duplicate)
      persist()
      return clone(duplicate)
    },

    async upsertDay(planId, dayDetails) {
      requireAdmin()
      const plan = findPlan(planId)
      if (!plan) throw new Error('Plan not found.')
      assertValid(validateDay(dayDetails))
      const existing = dayDetails.id ? plan.days.find((day) => day.id === dayDetails.id) : null
      const day = existing || { id: createId('day'), planId, sessions: [] }
      const candidate = { ...day, dayNumber: Number(dayDetails.dayNumber), topic: dayDetails.topic.trim() }
      const nextDays = existing ? plan.days.map((item) => item.id === day.id ? candidate : item) : [...plan.days, candidate]
      const dayNumbers = nextDays.map((item) => item.dayNumber)
      if (new Set(dayNumbers).size !== dayNumbers.length) throw new Error(`Day number ${candidate.dayNumber} is duplicated.`)
      if (existing) Object.assign(existing, candidate)
      else plan.days.push(candidate)
      plan.days.sort((a, b) => a.dayNumber - b.dayNumber)
      persist()
      return clone(candidate)
    },

    async deleteDay(planId, dayId) {
      requireAdmin()
      const plan = findPlan(planId)
      if (!plan) throw new Error('Plan not found.')
      const day = plan.days.find((item) => item.id === dayId)
      if (!day) throw new Error('Day not found.')
      const sessionIds = new Set(day.sessions.map((session) => session.id))
      plan.days = plan.days.filter((item) => item.id !== dayId)
      state.progress = state.progress.filter((item) => !sessionIds.has(item.sessionId))
      state.notes = state.notes.filter((note) => note.dayId !== dayId)
      persist()
    },

    async upsertSession(planId, dayId, sessionDetails) {
      requireAdmin()
      assertValid(validateSession(sessionDetails))
      const plan = findPlan(planId)
      const day = plan?.days.find((item) => item.id === dayId)
      if (!day) throw new Error('Day not found.')
      const existing = sessionDetails.id ? day.sessions.find((session) => session.id === sessionDetails.id) : null
      const session = {
        ...(existing || { id: createId('session'), dayId, sortOrder: day.sessions.length + 1 }),
        ...clone(sessionDetails),
        title: sessionDetails.title.trim(),
        resources: (sessionDetails.resources || []).map((resource) => ({ label: resource.label.trim(), url: resource.url.trim() })),
      }
      if (existing) Object.assign(existing, session)
      else day.sessions.push(session)
      day.sessions.sort((a, b) => a.sortOrder - b.sortOrder)
      persist()
      return clone(session)
    },

    async deleteSession(planId, dayId, sessionId) {
      requireAdmin()
      const plan = findPlan(planId)
      const day = plan?.days.find((item) => item.id === dayId)
      if (!day) throw new Error('Day not found.')
      if (!day.sessions.some((session) => session.id === sessionId)) throw new Error('Session not found.')
      day.sessions = day.sessions.filter((session) => session.id !== sessionId)
      day.sessions.forEach((session, index) => { session.sortOrder = index + 1 })
      state.progress = state.progress.filter((item) => item.sessionId !== sessionId)
      persist()
    },

    async reorderSessions(planId, dayId, orderedSessionIds) {
      requireAdmin()
      const plan = findPlan(planId)
      const day = plan?.days.find((item) => item.id === dayId)
      if (!day) throw new Error('Day not found.')
      const currentIds = new Set(day.sessions.map((session) => session.id))
      if (orderedSessionIds.length !== currentIds.size || orderedSessionIds.some((id) => !currentIds.has(id))) {
        throw new Error('Reorder list must include every session exactly once.')
      }
      const byId = new Map(day.sessions.map((session) => [session.id, session]))
      day.sessions = orderedSessionIds.map((id, index) => ({ ...byId.get(id), sortOrder: index + 1 }))
      persist()
      return clone(day.sessions)
    },

    async assignPlan(learnerId, planId, startDate) {
      requireAdmin()
      const learner = findProfile(learnerId)
      if (!learner || learner.role !== 'learner') throw new Error('Learner not found.')
      if (findAssignment(learnerId)) throw new Error('This learner already has an assigned plan.')
      const template = findPlan(planId)
      if (!template) throw new Error('Plan not found.')
      const dateKey = toLocalDateKey(new Date(`${startDate}T12:00:00`))
      if (dateKey !== startDate) throw new Error('Start date is invalid.')

      const learnerPlan = copyPlan(template, {
        title: `${template.title} - ${learner.name}`,
        isLearnerCopy: true,
        templateId: template.id,
      })
      const assignment = { id: createId('assignment'), learnerId, planId: learnerPlan.id, startDate }
      state.plans.push(learnerPlan)
      state.assignments.push(assignment)
      persist()
      return clone({ assignment, plan: learnerPlan })
    },

    async listAssignments() {
      requireAdmin()
      return clone(load().assignments)
    },

    async exportAllData() {
      requireAdmin()
      const { accounts: _accounts, session: _session, ...safeData } = load()
      return clone({ exportedAt: new Date().toISOString(), ...safeData })
    },

    // Stage 2 aliases stay available, now with admin authorization.
    async getLearners() {
      requireAdmin()
      return clone(load().profiles.filter((profile) => profile.role === 'learner'))
    },

    async getPlans() {
      requireAdmin()
      return clone(load().plans)
    },

    async exportData() {
      requireAdmin()
      const { accounts: _accounts, session: _session, ...safeData } = load()
      return clone(safeData)
    },

    async reset() {
      state = clone(initialState || createSeedState())
      persist()
      return clone(state)
    },
  }
}

export const mockAdapter = createMockAdapter()
