import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getDataAdapter } from '../data/adapter.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const adapter = useMemo(() => getDataAdapter(), [])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const refreshUser = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await adapter.getCurrentUser()
      if (currentUser && !currentUser.active) {
        await adapter.signOut()
        setUser(null)
        setNotice('Your account is inactive. Ask your mentor for help.')
      } else {
        setUser(currentUser)
      }
    } finally {
      setLoading(false)
    }
  }, [adapter])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const value = useMemo(
    () => ({
      adapter,
      user,
      loading,
      notice,
      clearNotice: () => setNotice(''),
      async signIn(credentials) {
        const signedInUser = await adapter.signIn(credentials)
        setNotice('')
        setUser(signedInUser)
        return signedInUser
      },
      async register(details) {
        const newUser = await adapter.registerLearner(details)
        setNotice('')
        setUser(newUser)
        return newUser
      },
      async signOut(message = '') {
        await adapter.signOut()
        setUser(null)
        setNotice(message)
      },
      async updateName(name) {
        const updatedUser = await adapter.updateMyProfile({ name })
        setUser(updatedUser)
        return updatedUser
      },
      async changePassword(details) {
        const updatedUser = await adapter.changePassword(details)
        setUser(updatedUser)
        return updatedUser
      },
      refreshUser,
    }),
    [adapter, loading, notice, refreshUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
