import { mockAdapter } from './mockAdapter.js'

export const REQUIRED_ADAPTER_METHODS = Object.freeze([
  'getCurrentUser',
  'signIn',
  'signOut',
  'registerLearner',
  'getLearners',
  'getPlans',
  'getPlan',
  'getAssignmentForLearner',
  'getMyAssignment',
  'getPlanForLearner',
  'getProgress',
  'setSessionProgress',
  'setSessionDone',
  'getNotes',
  'getNote',
  'saveNote',
  'listNotes',
  'updateMyProfile',
  'exportMyData',
  'exportData',
])

export function assertDataAdapter(adapter) {
  const missingMethods = REQUIRED_ADAPTER_METHODS.filter((method) => typeof adapter?.[method] !== 'function')

  if (missingMethods.length > 0) {
    throw new TypeError(`Invalid data adapter. Missing: ${missingMethods.join(', ')}`)
  }

  return adapter
}

export function getDataAdapter(mode = import.meta.env.VITE_DATA_MODE || 'mock') {
  if (mode === 'mock') return assertDataAdapter(mockAdapter)

  // The Supabase implementation belongs to a later stage; fail clearly if enabled early.
  throw new Error(`Data mode "${mode}" is not available in Stage 2. Use VITE_DATA_MODE=mock.`)
}
