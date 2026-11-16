import { beforeEach, describe, expect, it } from 'vitest'
import { assertDataAdapter } from './adapter.js'
import { createMockAdapter } from './mockAdapter.js'
import { createSeedState, demoCredentials, seedPlan } from './seed/seedPlan.js'
import { getPlanDayNumber } from '../lib/dates.js'

function makeStorage() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

describe('mock adapter', () => {
  let storage
  let adapter

  beforeEach(() => {
    storage = makeStorage()
    adapter = createMockAdapter({
      storage,
      initialState: createSeedState(new Date(2026, 10, 16, 12)),
    })
  })

  it('implements the shared adapter contract and exposes the complete seed plan', async () => {
    expect(assertDataAdapter(adapter)).toBe(adapter)
    await adapter.signIn(demoCredentials.learner)
    const plan = await adapter.getPlanForLearner()
    expect(plan.days).toHaveLength(7)
    expect(plan.days.every((day) => day.sessions.length === 4)).toBe(true)
  })

  it('seeds relative dates, two complete days, and an unassigned second learner', async () => {
    await adapter.signIn(demoCredentials.learner)
    const assignment = await adapter.getMyAssignment()
    expect(assignment.startDate).toBe('2026-11-14')
    expect(getPlanDayNumber(assignment.startDate, new Date(2026, 10, 16))).toBe(3)
    expect(await adapter.getProgress()).toHaveLength(8)

    await adapter.signOut()
    await adapter.signIn(demoCredentials.learnerWithoutPlan)
    expect(await adapter.getMyAssignment()).toBeNull()
    expect(await adapter.getPlanForLearner()).toBeNull()
  })

  it('lets the admin list both demo learners', async () => {
    await adapter.signIn(demoCredentials.admin)
    expect(await adapter.getLearners()).toHaveLength(2)
  })

  it('persists setSessionDone progress between adapter instances', async () => {
    await adapter.signIn(demoCredentials.learner)
    await adapter.setSessionDone('session-react-3-practice', true)

    const reloadedAdapter = createMockAdapter({ storage })
    await reloadedAdapter.signIn(demoCredentials.learner)
    expect(await reloadedAdapter.getProgress()).toContainEqual(
      expect.objectContaining({ sessionId: 'session-react-3-practice', done: true }),
    )
  })

  it('gets, saves and lists notes without allowing a learner to edit mentor comments', async () => {
    await adapter.signIn(demoCredentials.learner)
    expect(await adapter.getNote('day-react-1')).toMatchObject({ learned: expect.any(String) })

    await adapter.saveNote({
      dayId: 'day-react-3',
      learned: 'Forms connect values to state.',
      mentorComment: 'Learners must not write this.',
    })
    const saved = await adapter.getNote('day-react-3')
    expect(saved.learned).toBe('Forms connect values to state.')
    expect(saved.mentorComment).toBe('')
    expect((await adapter.listNotes())[0].dayId).toBe('day-react-3')
  })

  it('always registers new users as unassigned learners', async () => {
    const user = await adapter.registerLearner({
      name: '  Sam  ',
      email: 'SAM@example.com',
      password: 'StrongPass123',
      role: 'admin',
    })
    expect(user).toMatchObject({ name: 'Sam', email: 'sam@example.com', role: 'learner' })
    expect(await adapter.getMyAssignment()).toBeNull()
  })

  it('exports only the signed-in learner data', async () => {
    await adapter.signIn(demoCredentials.learner)
    const exported = await adapter.exportMyData()
    expect(exported.profile.email).toBe(demoCredentials.learner.email)
    expect(exported).not.toHaveProperty('accounts')
    expect(exported.progress.every((item) => item.learnerId === exported.profile.id)).toBe(true)
  })

  it('uses memory safely when browser storage is missing or throws', async () => {
    const throwingStorage = {
      getItem() { throw new Error('blocked') },
      setItem() { throw new Error('blocked') },
      removeItem() { throw new Error('blocked') },
    }
    const fallbackAdapter = createMockAdapter({
      storage: throwingStorage,
      initialState: createSeedState(new Date(2026, 10, 16)),
    })
    await expect(fallbackAdapter.signIn(demoCredentials.learner)).resolves.toMatchObject({ role: 'learner' })
    await expect(fallbackAdapter.getMyAssignment()).resolves.toMatchObject({ planId: seedPlan.id })

    const noBrowserStorageAdapter = createMockAdapter({
      initialState: createSeedState(new Date(2026, 10, 16)),
    })
    await expect(noBrowserStorageAdapter.signIn(demoCredentials.admin)).resolves.toMatchObject({ role: 'admin' })
  })
})
