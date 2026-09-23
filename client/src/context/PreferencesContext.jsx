import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from './AuthContext'

const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Other',
]

const DEFAULT_UPI_APPS = ['GPay', 'PhonePe', 'Paytm', 'Amazon Pay', 'BHIM', 'Other']

const emptyPrefs = {
  categories: DEFAULT_CATEGORIES,
  upiApps: DEFAULT_UPI_APPS,
  customCategories: [],
  customUpiApps: [],
}

const PreferencesContext = createContext(null)

export const PreferencesProvider = ({ children }) => {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(emptyPrefs)

  useEffect(() => {
    if (!user) {
      setPrefs(emptyPrefs)
      return
    }
    let cancelled = false
    api
      .get('/auth/preferences')
      .then(({ data }) => {
        if (!cancelled) setPrefs(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  const apply =
    (request) =>
    async (...args) => {
      const { data } = await request(...args)
      setPrefs(data)
      return data
    }

  const addCategory = apply((name) => api.post('/auth/preferences/categories', { name }))
  const removeCategory = apply((name) =>
    api.delete(`/auth/preferences/categories/${encodeURIComponent(name)}`)
  )
  const addUpiApp = apply((name) => api.post('/auth/preferences/upi-apps', { name }))
  const removeUpiApp = apply((name) =>
    api.delete(`/auth/preferences/upi-apps/${encodeURIComponent(name)}`)
  )

  const value = {
    ...prefs,
    addCategory,
    removeCategory,
    addUpiApp,
    removeUpiApp,
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}