import { beforeEach, describe, expect, it } from 'vitest'
import { assertDataAdapter } from './adapter.js'
import { createMockAdapter } from './mockAdapter.js'
import { demoCredentials, seedPlan } from './seed/seedPlan.js'

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
    adapter = createMockAdapter({ storage })
  })

  it('implements the shared adapter contract and exposes the complete seed plan', async () => {
    expect(assertDataAdapter(adapter)).toBe(adapter)
    const plan = await adapter.getPlan(seedPlan.id)
    expect(plan.days).toHaveLength(7)
    expect(plan.days.every((day) => day.sessions.length === 4)).toBe(true)
  })

  it('seeds one admin, two learners and sample progress', async () => {
    expect(await adapter.getLearners()).toHaveLength(2)
    expect((await adapter.getProgress('user-learner-maya')).length).toBeGreaterThan(0)
    await expect(adapter.signIn(demoCredentials.admin)).resolves.toMatchObject({ role: 'admin' })
  })

  it('persists progress between adapter instances', async () => {
    await adapter.setSessionProgress({
      learnerId: 'user-learner-noah',
      sessionId: 'session-react-1-practice',
      done: true,
    })
    const reloadedAdapter = createMockAdapter({ storage })
    const progress = await reloadedAdapter.getProgress('user-learner-noah')
    expect(progress).toContainEqual(
      expect.objectContaining({ sessionId: 'session-react-1-practice', done: true }),
    )
  })

  it('always registers new users as learners', async () => {
    const user = await adapter.registerLearner({
      name: '  Sam  ',
      email: 'SAM@example.com',
      password: 'StrongPass123',
      role: 'admin',
    })
    expect(user).toMatchObject({ name: 'Sam', email: 'sam@example.com', role: 'learner' })
  })

  it('does not export mock passwords or the current session', async () => {
    const exported = await adapter.exportData()
    expect(exported).not.toHaveProperty('accounts')
    expect(exported).not.toHaveProperty('session')
  })
})
