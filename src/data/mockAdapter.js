import { createSeedState } from './seed/seedPlan.js'

const STORAGE_KEY = 'study-tracker:mock-data:v1'

function clone(value) {
  return structuredClone(value)
}

function createMemoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage || createMemoryStorage()
  } catch {
    return createMemoryStorage()
  }
}

function createId(prefix) {
  const uniquePart = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uniquePart}`
}

export function createMockAdapter({ storage = getDefaultStorage(), initialState } = {}) {
  let state

  function persist() {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  function load() {
    if (state) return state

    const stored = storage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.version === 1) {
          state = parsed
          return state
        }
      } catch {
        // A broken local demo should recover automatically from the known-good seed.
      }
    }

    state = clone(initialState || createSeedState())
    persist()
    return state
  }

  function findProfile(userId) {
    return load().profiles.find((profile) => profile.id === userId) || null
  }

  return {
    async getCurrentUser() {
      const userId = load().session?.userId
      return userId ? clone(findProfile(userId)) : null
    },

    async signIn({ email, password }) {
      const normalizedEmail = email.trim().toLowerCase()
      const account = load().accounts.find(
        (item) => item.email.toLowerCase() === normalizedEmail && item.password === password,
      )

      if (!account) throw new Error('Email or password is incorrect.')

      const profile = findProfile(account.userId)
      if (!profile?.active) throw new Error('This account is inactive.')

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
      return clone(load().profiles.filter((profile) => profile.role === 'learner'))
    },

    async getPlans() {
      return clone(load().plans)
    },

    async getPlan(planId) {
      const plan = load().plans.find((item) => item.id === planId)
      return plan ? clone(plan) : null
    },

    async getAssignmentForLearner(learnerId) {
      const assignment = load().assignments.find((item) => item.learnerId === learnerId)
      if (!assignment) return null
      const plan = state.plans.find((item) => item.id === assignment.planId)
      return clone({ ...assignment, plan })
    },

    async getProgress(learnerId) {
      return clone(load().progress.filter((item) => item.learnerId === learnerId))
    },

    async setSessionProgress({ learnerId, sessionId, done }) {
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
    },

    async getNotes(learnerId) {
      return clone(load().notes.filter((note) => note.learnerId === learnerId))
    },

    async saveNote({ learnerId, dayId, ...fields }) {
      const notes = load().notes
      const existing = notes.find((note) => note.learnerId === learnerId && note.dayId === dayId)
      const allowedFields = ['learned', 'built', 'confused', 'remember', 'question', 'mentorComment']
      const changes = Object.fromEntries(
        Object.entries(fields).filter(([key]) => allowedFields.includes(key)),
      )
      const nextNote = {
        ...(existing || { learnerId, dayId, mentorComment: '' }),
        ...changes,
        updatedAt: new Date().toISOString(),
      }

      if (existing) Object.assign(existing, nextNote)
      else notes.push(nextNote)

      persist()
      return clone(nextNote)
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
