import { describe, expect, it } from 'vitest'
import { getAdminRouteRedirect, validatePasswordChange } from './adminGuard.js'

describe('forced admin password guard', () => {
  it('redirects a forced-change admin away from every other admin route', () => {
    const admin = { role: 'admin', mustChangePassword: true }
    expect(getAdminRouteRedirect(admin, '/admin')).toBe('/admin/change-password')
    expect(getAdminRouteRedirect(admin, '/admin/plans')).toBe('/admin/change-password')
    expect(getAdminRouteRedirect(admin, '/admin/change-password')).toBeNull()
  })

  it('allows a normal admin and rejects non-admin users', () => {
    expect(getAdminRouteRedirect({ role: 'admin', mustChangePassword: false }, '/admin')).toBeNull()
    expect(getAdminRouteRedirect({ role: 'learner' }, '/admin')).toBe('/app/today')
  })

  it('validates a confirmed, different, ten-character password', () => {
    expect(validatePasswordChange({ currentPassword: 'OldPassword1!', newPassword: 'NewPassword2!', confirmPassword: 'NewPassword2!' })).toEqual([])
    expect(validatePasswordChange({ currentPassword: 'samepassword', newPassword: 'samepassword', confirmPassword: 'different' })).toEqual(expect.arrayContaining([
      'New password must differ from the current password.',
      'Password confirmation does not match.',
    ]))
  })
})
