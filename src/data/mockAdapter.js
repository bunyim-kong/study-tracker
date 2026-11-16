import { createSafeStorage, getBrowserStorage } from '../lib/storage.js'
import { createSeedState } from './seed/seedPlan.js'

const STORAGE_KEY = 'study-tracker:mock-data:v2'

function clone(value) {
  return structuredClone(value)
}

function createId(prefix) {
  const uniquePart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uniquePart}`
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
        if (parsed?.version === 2) {
          state = parsed
          return state
        }
      } catch {
        // A broken local demo recovers from the known-good seed below.
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

  function allowedLearnerId(requestedLearnerId) {
    const profile = requireCurrentProfile()
    if (profile.role === 'admin') return requestedLearnerId || profile.id
    if (requestedLearnerId && requestedLearnerId !== profile.id) {
      throw new Error('You can only access your own study data.')
    }
    return profile.id
  }

  function findAssignment(learnerId) {
    return load().assignments.find((item) => item.learnerId === learnerId) || null
  }

  function findSession(sessionId) {
    for (const plan of load().plans) {
      for (const day of plan.days) {
        const session = day.sessions.find((item) => item.id === sessionId)
        if (session) return { plan, session }
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

    const progress = load().progress
    const existing = progress.find(
      (item) => item.learnerId === learnerId && item.sessionId === sessionId,
    )
    const nextRecord = {
      learnerId,
      sessionId,
      done: Boolean(done),
      doneAt: done ? new Date().toISOString() : null,
    }

    if (existing) Object.assign(existing, nextRecord)
    else progress.push(nextRecord)
    persist()
    return clone(nextRecord)
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

    async registerLearner({ name, email, password }) {
      const cleanName = name.trim()
      const normalizedEmail = email.trim().toLowerCase()
      if (!cleanName) throw new Error('Name is required.')
      if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Enter a valid email address.')
      if (password.length < 10) throw new Error('Password must be at least 10 characters.')
      if (load().accounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
        throw new Error('An account with that email already exists.')
      }

      const userId = createId('user')
      const profile = {
        id: userId,
        name: cleanName,
        email: normalizedEmail,
        role: 'learner',
        active: true,
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
      }
      state.profiles.push(profile)
      state.accounts.push({ userId, email: normalizedEmail, password })
      state.session = { userId }
      persist()
      return clone(profile)
    },

    async getLearners() {
      requireCurrentProfile()
      return clone(load().profiles.filter((profile) => profile.role === 'learner'))
    },

    async getPlans() {
      requireCurrentProfile()
      return clone(load().plans)
    },

    async getPlan(planId) {
      requireCurrentProfile()
      const plan = load().plans.find((item) => item.id === planId)
      return plan ? clone(plan) : null
    },

    async getAssignmentForLearner(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const assignment = findAssignment(safeLearnerId)
      if (!assignment) return null
      const plan = load().plans.find((item) => item.id === assignment.planId)
      return clone({ ...assignment, plan })
    },

    async getMyAssignment() {
      const profile = requireCurrentProfile()
      const assignment = findAssignment(profile.id)
      return assignment ? clone(assignment) : null
    },

    async getPlanForLearner(learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const assignment = findAssignment(safeLearnerId)
      if (!assignment) return null
      const plan = load().plans.find((item) => item.id === assignment.planId)
      return plan ? clone(plan) : null
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
      return clone(
        load().notes
          .filter((note) => note.learnerId === safeLearnerId)
          .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)),
      )
    },

    async getNote(dayId, learnerId) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const note = load().notes.find(
        (item) => item.learnerId === safeLearnerId && item.dayId === dayId,
      )
      return note ? clone(note) : null
    },

    async saveNote({ learnerId, dayId, ...fields }) {
      const safeLearnerId = allowedLearnerId(learnerId)
      const profile = requireCurrentProfile()
      const notes = load().notes
      const existing = notes.find(
        (note) => note.learnerId === safeLearnerId && note.dayId === dayId,
      )
      const learnerFields = ['learned', 'built', 'confused', 'remember', 'question']
      const allowedFields = profile.role === 'admin' ? [...learnerFields, 'mentorComment'] : learnerFields
      const changes = Object.fromEntries(
        Object.entries(fields).filter(([key]) => allowedFields.includes(key)),
      )
      const nextNote = {
        ...(existing || { learnerId: safeLearnerId, dayId, mentorComment: '' }),
        ...changes,
        updatedAt: new Date().toISOString(),
      }

      if (existing) Object.assign(existing, nextNote)
      else notes.push(nextNote)
      persist()
      return clone(nextNote)
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
      const plan = assignment
        ? load().plans.find((item) => item.id === assignment.planId) || null
        : null
      return clone({
        exportedAt: new Date().toISOString(),
        profile,
        assignment,
        plan,
        progress: load().progress.filter((item) => item.learnerId === profile.id),
        notes: load().notes.filter((note) => note.learnerId === profile.id),
      })
    },

    async exportData() {
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
