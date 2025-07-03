import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Check } from 'lucide-react'
import { ANNOTATION_COLORS, type FieldAnnotation } from '@/hooks/use-field-annotations'

interface FieldAnnotationMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  currentAnnotation?: FieldAnnotation | null
  onSave: (color: string | null, comment: string | null) => Promise<boolean>
  onRemove: () => Promise<boolean>
}

export function FieldAnnotationMenu({
  isOpen,
  position,
  onClose,
  currentAnnotation,
  onSave,
  onRemove
}: FieldAnnotationMenuProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(currentAnnotation?.color || null)
  const [comment, setComment] = useState(currentAnnotation?.comment || '')
  const [saving, setSaving] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Update state when currentAnnotation changes
  useEffect(() => {
    setSelectedColor(currentAnnotation?.color || null)
    setComment(currentAnnotation?.comment || '')
  }, [currentAnnotation])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Delay adding the listener to avoid immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Focus comment input when menu opens and has comment
  useEffect(() => {
    if (isOpen && comment && commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }, [isOpen, comment])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await onSave(selectedColor, comment.trim() || null)
      if (success) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    setSaving(true)
    try {
      const success = await onRemove()
      if (success) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color === selectedColor ? null : color)
  }

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-72"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 300)
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          Field Annotation
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Color Selection */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Color Code
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ANNOTATION_COLORS).map(([colorKey, colorConfig]) => (
            <button
              key={colorKey}
              onClick={() => handleColorSelect(colorKey)}
              className={`
                p-2 rounded-md border-2 text-xs font-medium transition-all
                ${selectedColor === colorKey 
                  ? 'border-gray-800 shadow-md' 
                  : 'border-gray-200 hover:border-gray-400'
                }
              `}
              style={{ backgroundColor: colorConfig.color }}
            >
              <div className="flex items-center justify-center gap-1">
                {selectedColor === colorKey && <Check className="w-3 h-3" />}
                <span className={colorConfig.text}>{colorConfig.name}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Clear Color Option */}
        <button
          onClick={() => setSelectedColor(null)}
          className={`
            mt-2 w-full p-2 rounded-md border-2 text-xs font-medium transition-all
            ${selectedColor === null 
              ? 'border-gray-800 bg-gray-100 shadow-md' 
              : 'border-gray-200 hover:border-gray-400 bg-white'
            }
          `}
        >
          <div className="flex items-center justify-center gap-1">
            {selectedColor === null && <Check className="w-3 h-3" />}
            <span className="text-gray-700">No Color</span>
          </div>
        </button>
      </div>

      {/* Comment Input */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Comment/Note
        </label>
        <textarea
          ref={commentInputRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a note about what needs to be done..."
          className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        
        {(currentAnnotation?.color || currentAnnotation?.comment) && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Remove
          </button>
        )}
        
        <button
          onClick={onClose}
          disabled={saving}
          className="px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
} 