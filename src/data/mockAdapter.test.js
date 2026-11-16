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
    await adapter.setSessionDone('session-maya-3-practice', true)

    const reloadedAdapter = createMockAdapter({ storage })
    await reloadedAdapter.signIn(demoCredentials.learner)
    expect(await reloadedAdapter.getProgress()).toContainEqual(
      expect.objectContaining({ sessionId: 'session-maya-3-practice', done: true }),
    )
  })

  it('gets, saves and lists notes without allowing a learner to edit mentor comments', async () => {
    await adapter.signIn(demoCredentials.learner)
    expect(await adapter.getNote('day-maya-1')).toMatchObject({ learned: expect.any(String) })

    await adapter.saveNote({
      dayId: 'day-maya-3',
      learned: 'Forms connect values to state.',
      mentorComment: 'Learners must not write this.',
    })
    const saved = await adapter.getNote('day-maya-3')
    expect(saved.learned).toBe('Forms connect values to state.')
    expect(saved.mentorComment).toBe('')
    expect((await adapter.listNotes())[0].dayId).toBe('day-maya-3')
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
    await expect(fallbackAdapter.getMyAssignment()).resolves.toMatchObject({ planId: 'plan-react-maya' })

    const noBrowserStorageAdapter = createMockAdapter({
      initialState: createSeedState(new Date(2026, 10, 16)),
    })
    await expect(noBrowserStorageAdapter.signIn(demoCredentials.admin)).resolves.toMatchObject({ role: 'admin' })
  })

  it('rejects every admin operation when the current user is a learner', async () => {
    await adapter.signIn(demoCredentials.learner)
    const operations = [
      () => adapter.listLearners(),
      () => adapter.getLearnerOverview('user-learner-maya'),
      () => adapter.listNotesForLearner('user-learner-maya'),
      () => adapter.setMentorComment({ learnerId: 'user-learner-maya', dayId: 'day-maya-1', mentorComment: '' }),
      () => adapter.setLearnerActive('user-learner-maya', false),
      () => adapter.listPlans(),
      () => adapter.getPlan(seedPlan.id),
      () => adapter.createPlan({ title: 'No', description: '' }),
      () => adapter.updatePlan(seedPlan.id, { title: 'No', description: '' }),
      () => adapter.deletePlan(seedPlan.id),
      () => adapter.duplicatePlan(seedPlan.id),
      () => adapter.upsertDay(seedPlan.id, { dayNumber: 8, topic: 'No' }),
      () => adapter.deleteDay(seedPlan.id, 'day-react-1'),
      () => adapter.upsertSession(seedPlan.id, 'day-react-1', {}),
      () => adapter.deleteSession(seedPlan.id, 'day-react-1', 'session-react-1-research'),
      () => adapter.reorderSessions(seedPlan.id, 'day-react-1', []),
      () => adapter.assignPlan('user-learner-noah', seedPlan.id, '2026-11-16'),
      () => adapter.listAssignments(),
      () => adapter.exportAllData(),
    ]

    for (const operation of operations) {
      await expect(operation()).rejects.toThrow('Permission denied: admin access required.')
    }
  })

  it('assignPlan deep-copies every day and session before creating the assignment', async () => {
    await adapter.signIn(demoCredentials.admin)
    const templateBefore = await adapter.getPlan(seedPlan.id)
    const result = await adapter.assignPlan('user-learner-noah', seedPlan.id, '2026-11-16')

    expect(result.plan.title).toBe('React in 7 days - Noah')
    expect(result.plan.id).not.toBe(templateBefore.id)
    expect(result.plan.days[0].id).not.toBe(templateBefore.days[0].id)
    expect(result.plan.days[0].sessions[0].id).not.toBe(templateBefore.days[0].sessions[0].id)

    await adapter.upsertDay(result.plan.id, { ...result.plan.days[0], topic: 'Noah’s custom topic' })
    expect((await adapter.getPlan(result.plan.id)).days[0].topic).toBe('Noah’s custom topic')
    expect((await adapter.getPlan(seedPlan.id)).days[0].topic).toBe(templateBefore.days[0].topic)
  })

  it('blocks deletion of a plan that has an assignment', async () => {
    await adapter.signIn(demoCredentials.admin)
    await expect(adapter.deletePlan('plan-react-maya')).rejects.toThrow('has an assignment')
  })

  it('supports validated plan, day, session, reorder, and duplicate operations', async () => {
    await adapter.signIn(demoCredentials.admin)
    const plan = await adapter.createPlan({ title: 'Testing plan', description: 'Adapter round trip' })
    const day = await adapter.upsertDay(plan.id, { dayNumber: 1, topic: 'Testing basics' })
    const first = await adapter.upsertSession(plan.id, day.id, {
      type: 'research', startTime: '20:00', endTime: '20:30', title: 'Read', resources: [], practicePath: '', exercise: '',
    })
    const second = await adapter.upsertSession(plan.id, day.id, {
      type: 'practice', startTime: '20:30', endTime: '21:00', title: 'Build', resources: [], practicePath: 'src/test.js', exercise: 'Write a test.',
    })
    expect((await adapter.reorderSessions(plan.id, day.id, [second.id, first.id])).map((session) => session.id)).toEqual([second.id, first.id])
    const duplicate = await adapter.duplicatePlan(plan.id)
    expect(duplicate.title).toBe('Testing plan (Copy)')
    expect(duplicate.days[0].sessions[0].id).not.toBe(second.id)
    await adapter.deleteSession(plan.id, day.id, first.id)
    await adapter.deleteDay(plan.id, day.id)
    await expect(adapter.deletePlan(plan.id)).resolves.toBeUndefined()
  })

  it('completes the forced password-change flow and clears the profile flag', async () => {
    const forcedState = createSeedState(new Date(2026, 10, 16))
    forcedState.profiles.find((profile) => profile.id === 'user-admin-demo').mustChangePassword = true
    const forcedAdapter = createMockAdapter({ storage: makeStorage(), initialState: forcedState })
    await forcedAdapter.signIn(demoCredentials.admin)
    await expect(forcedAdapter.changePassword({ currentPassword: 'wrong', newPassword: 'NewAdminPass123!' })).rejects.toThrow('incorrect')
    await expect(forcedAdapter.changePassword({ currentPassword: demoCredentials.admin.password, newPassword: 'NewAdminPass123!' })).resolves.toMatchObject({ mustChangePassword: false })
    await forcedAdapter.signOut()
    await expect(forcedAdapter.signIn({ email: demoCredentials.admin.email, password: 'NewAdminPass123!' })).resolves.toMatchObject({ role: 'admin' })
  })
})
