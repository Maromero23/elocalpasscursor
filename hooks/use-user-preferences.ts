import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserPreferences {
  affiliateColumnWidths?: Record<string, number>
}

export function useUserPreferences() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)

  // Load preferences from database
  useEffect(() => {
    if (session?.user) {
      loadPreferences()
    } else {
      setLoading(false)
    }
  }, [session])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      const data = await response.json()
      
      if (data.success) {
        setPreferences(data.preferences)
        
        // Migrate from localStorage if database is empty and localStorage has data
        if (!data.preferences.affiliateColumnWidths && typeof window !== 'undefined') {
          const localStorageData = localStorage.getItem('affiliateColumnWidths')
          if (localStorageData) {
            try {
              const parsedData = JSON.parse(localStorageData)
              await updatePreferences({ affiliateColumnWidths: parsedData })
              // Clear localStorage after migration
              localStorage.removeItem('affiliateColumnWidths')
            } catch (e) {
              console.warn('Failed to migrate column widths from localStorage:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences }
      
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPreferences)
      })

      const data = await response.json()
      
      if (data.success) {
        setPreferences(updatedPreferences)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating preferences:', error)
      return false
    }
  }

  const updateColumnWidth = async (field: string, width: number) => {
    const currentWidths = preferences.affiliateColumnWidths || {}
    const newWidths = { ...currentWidths, [field]: width }
    return await updatePreferences({ affiliateColumnWidths: newWidths })
  }

  return {
    preferences,
    loading,
    updatePreferences,
    updateColumnWidth,
    columnWidths: preferences.affiliateColumnWidths || {}
  }
} 