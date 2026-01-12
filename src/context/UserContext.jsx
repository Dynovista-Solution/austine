import { createContext, useContext, useEffect, useState } from 'react'
import apiService from '../services/api'

const UserContext = createContext(null)

let hasInitializedUser = false

function normalizeUser(rawUser) {
  if (!rawUser) return null
  const profile = rawUser.profile || {}
  const nameFromProfile = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
  const fallbackName = rawUser.name || nameFromProfile
  const [firstName = '', ...rest] = (profile.firstName || fallbackName || '').trim().split(/\s+/)
  const lastName = profile.lastName || rest.join(' ').trim()

  return {
    ...rawUser,
    profile,
    name: fallbackName?.trim() || `${firstName} ${lastName}`.trim(),
    firstName: profile.firstName || firstName,
    lastName,
    address: profile.address || rawUser.address || '',
    city: profile.city || rawUser.city || '',
    postal: profile.postal || rawUser.postal || '',
    country: profile.country || rawUser.country || ''
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Bootstrap from token
  useEffect(() => {
    if (hasInitializedUser) return
    hasInitializedUser = true
    
    let ignore = false
    async function init() {
      if (!localStorage.getItem('authToken')) {
        setUser(null)
        setIsLoggedIn(false)
        return
      }
      try {
        setLoading(true)
        const res = await apiService.getProfile()
        const u = res?.data?.user || res?.data
        if (!ignore) {
          const normalized = normalizeUser(u)
          setUser(normalized)
          setIsLoggedIn(true)
        }
      } catch {
        if (!ignore) {
          setUser(null)
          setIsLoggedIn(false)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    init()
    return () => { ignore = true }
  }, [])

  async function login(email, password) {
    setError('')
    setLoading(true)
    try {
      const res = await apiService.login(email, password)
      const u = res?.data?.user || res?.data
      const normalized = normalizeUser(u)
      setUser(normalized)
      setIsLoggedIn(true)
      return normalized
    } catch (e) {
      setError(e.message || 'Failed to sign in')
      throw e
    } finally {
      setLoading(false)
    }
  }

  async function signup(userData) {
    setError('')
    setLoading(true)
    try {
      // Backend register expects { name, email, password }
      const name = [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim() || userData.firstName || 'Customer'
      const profile = {
        firstName: (userData.firstName || '').trim(),
        lastName: (userData.lastName || '').trim()
      }
      const res = await apiService.register({ name, email: userData.email, password: userData.password, profile })
      const u = res?.data?.user || res?.data
      const mergedUser = normalizeUser({
        ...u,
        name,
        profile: {
          ...(u?.profile || {}),
          ...profile
        }
      })
      setUser(mergedUser)
      setIsLoggedIn(true)
      return mergedUser
    } catch (e) {
      setError(e.message || 'Failed to sign up')
      throw e
    } finally {
      setLoading(false)
    }
  }

  async function update(partial) {
    if (!isLoggedIn) return
    setLoading(true)
    setError('')
    try {
      const payload = {}
      if (partial.name) payload.name = partial.name.trim()
      if (partial.email) payload.email = partial.email.trim()

      const profilePayload = {
        ...(partial.profile || {})
      }
      const profileFields = ['firstName', 'lastName', 'address', 'city', 'postal', 'country', 'phone']
      profileFields.forEach((key) => {
        if (partial[key] !== undefined) {
          profilePayload[key] = typeof partial[key] === 'string' ? partial[key].trim() : partial[key]
        }
      })

      if (Object.keys(profilePayload).length) {
        payload.profile = profilePayload
      }

      const res = await apiService.updateProfile(payload)
      const u = res?.data?.user || res?.data
      const normalized = normalizeUser(u)
      setUser(normalized)
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    try { apiService.logout() } catch {}
    setUser(null)
    setIsLoggedIn(false)
    setError('')
  }

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, signup, update, logout, loading, error }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
