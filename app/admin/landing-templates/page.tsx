'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { ProtectedRoute } from '../../../components/auth/protected-route'
import Link from 'next/link'
import { Building2, Users, MapPin, QrCode, Palette, Eye, Save, Plus, Edit3, Trash2 } from 'lucide-react'

interface LandingPageTemplate {
  id: string
  name: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  headerText: string
  descriptionText: string
  ctaButtonText: string
  showPayPal: boolean
  showContactForm: boolean
  customCSS?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

const getNavItems = (userRole: string) => {
  if (userRole === "ADMIN") {
    return [
      { href: "/admin", label: "Dashboard", icon: Building2 },
      { href: "/admin/distributors", label: "Distributors", icon: Users },
      { href: "/admin/locations", label: "Locations", icon: MapPin },
      { href: "/admin/sellers", label: "Sellers", icon: Users },
      { href: "/admin/qr-config", label: "QR Config", icon: QrCode },
      { href: "/admin/landing-templates", label: "Landing Templates", icon: Palette },
    ]
  }
  return []
}

const defaultTemplate: Partial<LandingPageTemplate> = {
  name: 'Nueva Plantilla',
  primaryColor: '#f97316',
  secondaryColor: '#fb923c',
  backgroundColor: '#fef3f2',
  headerText: '¡Bienvenido a tu eLocalPass!',
  descriptionText: 'Tu pase local para descubrir experiencias increíbles en nuestra ciudad. Válido para múltiples establecimientos y experiencias únicas.',
  ctaButtonText: 'Confirmar mi Pass',
  showPayPal: true,
  showContactForm: true,
  isDefault: false
}

export default function LandingTemplatesPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LandingPageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<LandingPageTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<LandingPageTemplate>>(defaultTemplate)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/landing-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingTemplate(null)
    setFormData(defaultTemplate)
    setShowModal(true)
  }

  const openEditModal = (template: LandingPageTemplate) => {
    setEditingTemplate(template)
    setFormData(template)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTemplate(null)
    setFormData(defaultTemplate)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingTemplate 
        ? `/api/admin/landing-templates/${editingTemplate.id}`
        : '/api/admin/landing-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchTemplates()
        closeModal()
      }
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (template: LandingPageTemplate) => {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${template.name}"?`)) return

    try {
      const response = await fetch(`/api/admin/landing-templates/${template.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const setAsDefault = async (template: LandingPageTemplate) => {
    try {
      const response = await fetch(`/api/admin/landing-templates/${template.id}/set-default`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchTemplates()
      }
    } catch (error) {
      console.error('Error setting default template:', error)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-orange-400 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-white">Admin Dashboard</h1>
                <div className="flex space-x-4">
                  {navItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-orange-500 transition-colors"
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white">Welcome, {session?.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Landing Page Templates</h1>
                  <p className="mt-2 text-gray-600">Customize landing page templates for QR code generations</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Template
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading templates...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* Template Preview */}
                    <div 
                      className="h-32 p-4 flex items-center justify-center relative"
                      style={{ 
                        backgroundColor: template.backgroundColor,
                        background: `linear-gradient(135deg, ${template.backgroundColor} 0%, ${template.secondaryColor}20 100%)`
                      }}
                    >
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 rounded mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: template.primaryColor }}
                        >
                          eL
                        </div>
                        <h3 className="text-sm font-medium text-gray-700">{template.headerText}</h3>
                      </div>
                      
                      {template.isDefault && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Default
                        </div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setPreviewTemplate(template)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {!template.isDefault && (
                            <button
                              onClick={() => deleteTemplate(template)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.descriptionText}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: template.primaryColor }}
                          ></div>
                          <span className="text-xs text-gray-500">Primary</span>
                        </div>
                        
                        {!template.isDefault && (
                          <button
                            onClick={() => setAsDefault(template)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900">
                        {editingTemplate ? 'Edit Template' : 'Create Template'}
                      </h3>
                      <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Basic Information</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Template Name
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.name || ''}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Logo URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={formData.logoUrl || ''}
                              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com/logo.png"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Header Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.headerText || ''}
                              onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description Text
                            </label>
                            <textarea
                              required
                              rows={3}
                              value={formData.descriptionText || ''}
                              onChange={(e) => setFormData({ ...formData, descriptionText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.ctaButtonText || ''}
                              onChange={(e) => setFormData({ ...formData, ctaButtonText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Design & Features */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Design & Features</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Primary Color
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={formData.primaryColor || '#f97316'}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formData.primaryColor || '#f97316'}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Secondary Color
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={formData.secondaryColor || '#fb923c'}
                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formData.secondaryColor || '#fb923c'}
                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Background Color
                            </label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={formData.backgroundColor || '#fef3f2'}
                                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={formData.backgroundColor || '#fef3f2'}
                                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.showPayPal || false}
                                onChange={(e) => setFormData({ ...formData, showPayPal: e.target.checked })}
                                className="mr-2 h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-gray-700">Show PayPal Integration</span>
                            </label>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.showContactForm || false}
                                onChange={(e) => setFormData({ ...formData, showContactForm: e.target.checked })}
                                className="mr-2 h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-gray-700">Show Contact Form Fields</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Custom CSS (Optional)
                            </label>
                            <textarea
                              rows={4}
                              value={formData.customCSS || ''}
                              onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                              placeholder=".custom-style { color: red; }"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                          type="button"
                          onClick={closeModal}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium">Preview: {previewTemplate.name}</h3>
                    <button
                      onClick={() => setPreviewTemplate(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6">
                    {/* Here we would render the LandingPageTemplate component */}
                    <div className="text-center text-gray-500 py-8">
                      <Eye className="h-12 w-12 mx-auto mb-4" />
                      <p>Landing page preview would render here with sample data</p>
                      <p className="text-sm mt-2">Template: {previewTemplate.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
