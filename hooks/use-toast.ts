"use client"

import { useState, useCallback, useEffect } from 'react'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning'
  title: string
  message?: string
  duration?: number
  isVisible: boolean
}

export function useToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([])

  const addToast = useCallback((
    type: 'success' | 'error' | 'warning',
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: ToastNotification = {
      id,
      type,
      title,
      message,
      duration: duration || 7000,
      isVisible: true
    }

    setNotifications(prev => [...prev, newNotification])
  }, [])

  const removeToast = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1))
      }, 7000)

      return () => clearTimeout(timer)
    }
  }, [notifications])

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast('success', title, message, duration)
  }, [addToast])

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast('error', title, message, duration)
  }, [addToast])

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast('warning', title, message, duration)
  }, [addToast])

  return {
    notifications,
    removeToast,
    success,
    error,
    warning
  }
}
