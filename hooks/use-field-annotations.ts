import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface FieldAnnotation {
  id?: string
  color?: string | null
  comment?: string | null
  createdAt?: string
  createdBy?: {
    name?: string
    email?: string
  }
}

export interface AnnotationsMap {
  [affiliateId: string]: {
    [fieldName: string]: FieldAnnotation
  }
}

export const ANNOTATION_COLORS = {
  yellow: { 
    name: 'Needs Update', 
    bg: 'bg-yellow-100', 
    color: '#fef3c7',
    text: 'text-yellow-800' 
  },
  red: { 
    name: 'Error/Urgent', 
    bg: 'bg-red-100', 
    color: '#fee2e2',
    text: 'text-red-800' 
  },
  green: { 
    name: 'Verified/Good', 
    bg: 'bg-green-100', 
    color: '#dcfce7',
    text: 'text-green-800' 
  },
  blue: { 
    name: 'In Progress', 
    bg: 'bg-blue-100', 
    color: '#dbeafe',
    text: 'text-blue-800' 
  },
  orange: { 
    name: 'Review Needed', 
    bg: 'bg-orange-100', 
    color: '#fed7aa',
    text: 'text-orange-800' 
  }
} as const

export function useFieldAnnotations() {
  const { data: session } = useSession()
  const [annotations, setAnnotations] = useState<AnnotationsMap>({})
  const [loading, setLoading] = useState(false)

  const loadAnnotations = async (affiliateIds: string[]) => {
    if (!session?.user || affiliateIds.length === 0) {
      setAnnotations({})
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/affiliates/annotations?affiliateIds=${affiliateIds.join(',')}`)
      const data = await response.json()
      
      if (data.success) {
        setAnnotations(data.annotations || {})
      }
    } catch (error) {
      console.error('Error loading annotations:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAnnotation = async (
    affiliateId: string, 
    fieldName: string, 
    color?: string | null, 
    comment?: string | null
  ) => {
    if (!session?.user) return false

    try {
      const response = await fetch('/api/admin/affiliates/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId,
          fieldName,
          color: color || null,
          comment: comment || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setAnnotations(prev => ({
          ...prev,
          [affiliateId]: {
            ...prev[affiliateId],
            [fieldName]: data.annotation
          }
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Error saving annotation:', error)
      return false
    }
  }

  const removeAnnotation = async (affiliateId: string, fieldName: string) => {
    if (!session?.user) return false

    try {
      const response = await fetch(`/api/admin/affiliates/annotations?affiliateId=${affiliateId}&fieldName=${fieldName}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setAnnotations(prev => {
          const newAnnotations = { ...prev }
          if (newAnnotations[affiliateId]) {
            delete newAnnotations[affiliateId][fieldName]
            if (Object.keys(newAnnotations[affiliateId]).length === 0) {
              delete newAnnotations[affiliateId]
            }
          }
          return newAnnotations
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error removing annotation:', error)
      return false
    }
  }

  const getAnnotation = (affiliateId: string, fieldName: string): FieldAnnotation | null => {
    return annotations[affiliateId]?.[fieldName] || null
  }

  const getFieldBackgroundColor = (affiliateId: string, fieldName: string): string => {
    const annotation = getAnnotation(affiliateId, fieldName)
    if (!annotation?.color) return ''
    
    const colorConfig = ANNOTATION_COLORS[annotation.color as keyof typeof ANNOTATION_COLORS]
    return colorConfig?.color || ''
  }

  const hasComment = (affiliateId: string, fieldName: string): boolean => {
    const annotation = getAnnotation(affiliateId, fieldName)
    return !!(annotation?.comment && annotation.comment.trim().length > 0)
  }

  return {
    annotations,
    loading,
    loadAnnotations,
    saveAnnotation,
    removeAnnotation,
    getAnnotation,
    getFieldBackgroundColor,
    hasComment,
    ANNOTATION_COLORS
  }
} 