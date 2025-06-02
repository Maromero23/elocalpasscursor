"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning'
  title: string
  message?: string
  duration?: number
  isVisible: boolean
}

interface ToastNotificationProps {
  notifications: ToastNotification[]
  onRemove: (id: string) => void
}

export function ToastNotifications({ notifications, onRemove }: ToastNotificationProps) {
  return (
    <div className="fixed top-6 right-4 z-[9999] max-w-xs w-full pointer-events-none pr-4">
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              relative transform transition-all duration-300 ease-in-out pointer-events-auto
              translate-x-0 opacity-100
              bg-white rounded-lg shadow-lg border-l-4 p-3 w-full
              ${notification.type === 'success' 
                ? 'border-green-500' 
                : notification.type === 'error' 
                ? 'border-red-500' 
                : 'border-yellow-500'
              }
            `}
            style={{ 
              wordWrap: 'break-word', 
              overflowWrap: 'break-word',
              maxWidth: '320px'
            }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                {notification.type === 'warning' && (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 break-words">
                  {notification.title}
                </p>
                {notification.message && (
                  <p className="mt-1 text-sm text-gray-600 break-words">
                    {notification.message}
                  </p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => onRemove(notification.id)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
