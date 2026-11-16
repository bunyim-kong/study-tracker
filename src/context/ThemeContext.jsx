import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getBrowserStorage } from '../lib/storage.js'

const ThemeContext = createContext(null)
const THEME_KEY = 'study-tracker:theme'

export function ThemeProvider({ children }) {
  const storage = useMemo(() => getBrowserStorage(), [])
  const [theme, setTheme] = useState(() => storage.getItem(THEME_KEY) || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    storage.setItem(THEME_KEY, theme)
  }, [storage, theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.')
  return context
}
