export function getAdminRouteRedirect(user, pathname) {
  if (!user) return '/login'
  if (user.role !== 'admin') return '/app/today'
  if (user.mustChangePassword && pathname !== '/admin/change-password') return '/admin/change-password'
  return null
}

export function validatePasswordChange({ currentPassword, newPassword, confirmPassword }) {
  const errors = []
  if (!currentPassword) errors.push('Current password is required.')
  if ((newPassword || '').length < 10) errors.push('New password must be at least 10 characters.')
  if (newPassword && newPassword === currentPassword) errors.push('New password must differ from the current password.')
  if (newPassword !== confirmPassword) errors.push('Password confirmation does not match.')
  return errors
}
