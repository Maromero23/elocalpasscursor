'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
// import { ProtectedRoute } from '../../../components/auth/protected-route'
import Link from 'next/link'
import { Building2, Users, MapPin, QrCode, Palette, Eye, Save, Plus, Edit3, Trash2 } from 'lucide-react'

interface LandingPageTemplate {
  id: string
  name: string
  
  // Logo and Colors
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  
  // Header Section Text (individual lines)
  thankYouText: string
  giftText: string
  signUpText: string
  completeFieldsText: string
  
  // Form Section
  choosePeopleText: string
  chooseDaysText: string
  nameFieldLabel: string
  nameFieldPlaceholder: string
  emailFieldLabel: string
  emailFieldPlaceholder: string
  emailConfirmLabel: string
  emailConfirmPlaceholder: string
  ctaButtonText: string
  
  // Footer Section
  enjoyText: string
  privacyLinkText: string
  
  // Configuration Options
  showPeopleSelector: boolean
  showDaysSelector: boolean
  minPeople: number
  maxPeople: number
  minDays: number
  maxDays: number
  
  // Features
  showPayPal: boolean
  showContactForm: boolean
  customCSS?: string
  isDefault: boolean
  
  // Font Colors
  primaryTextColor: string
  secondaryTextColor: string
  formLabelColor: string
  buttonTextColor: string
  footerTextColor: string
  selectorTextColor: string
  
  // Text Colors
  thankYouTextColor: string
  giftTextColor: string
  signUpTextColor: string
  completeFieldsTextColor: string
  
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
  thankYouText: 'THANKS YOU VERY MUCH FOR GIVING YOURSELF THE OPPORTUNITY TO DISCOVER THE BENEFITS OF THE CLUB.',
  giftText: 'TO RECEIVE YOUR 7-DAY FULL ACCESS GIFT TO ELOCALPASS, SIMPLY FILL OUT THE FIELDS BELOW AND YOU WILL RECEIVE YOUR FREE ELOCALPASS VIA EMAIL.',
  signUpText: 'SIGN UP TO GET YOUR FREE ELOCALPASS!',
  completeFieldsText: 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:',
  choosePeopleText: 'CHOOSE THE NUMBER OF PEOPLE BETWEEN 1 AND 6',
  chooseDaysText: 'CHOOSE THE NUMBER OF DAYS BETWEEN 1 AND 10',
  nameFieldLabel: 'Name:',
  nameFieldPlaceholder: '(IT MUST MATCH YOUR ID)',
  emailFieldLabel: 'Email:',
  emailFieldPlaceholder: '(TO RECEIVE YOUR ELOCALPASS)',
  emailConfirmLabel: 'Email confirmation:',
  emailConfirmPlaceholder: '(TO RECEIVE YOUR ELOCALPASS)',
  ctaButtonText: 'Get your eLocalPass now!',
  enjoyText: 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.',
  privacyLinkText: 'Click HERE to read the privacy notice and data usage',
  showPeopleSelector: true,
  showDaysSelector: false,
  minPeople: 1,
  maxPeople: 6,
  minDays: 1,
  maxDays: 10,
  showPayPal: true,
  showContactForm: true,
  isDefault: false,
  primaryTextColor: '#ffffff',
  secondaryTextColor: '#ffffff',
  formLabelColor: '#1f4ba6',
  buttonTextColor: '#ffffff',
  footerTextColor: '#ffffff',
  selectorTextColor: '#ffffff',
  thankYouTextColor: '#ffffff',
  giftTextColor: '#ffffff',
  signUpTextColor: '#ffffff',
  completeFieldsTextColor: '#ffffff'
}

export default function LandingTemplatesPage() {
  const { data: session } = useSession()
  const navItems = getNavItems(session?.user?.role || "")
  
  const [templates, setTemplates] = useState<LandingPageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LandingPageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<LandingPageTemplate | null>(null)

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
      console.log('Submitting form data:', formData)
      
      // Clean data - remove timestamps and id that should be handled by Prisma
      const cleanData = {
        name: formData.name,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        backgroundColor: formData.backgroundColor,
        thankYouText: formData.thankYouText,
        giftText: formData.giftText,
        signUpText: formData.signUpText,
        completeFieldsText: formData.completeFieldsText,
        choosePeopleText: formData.choosePeopleText,
        chooseDaysText: formData.chooseDaysText,
        nameFieldLabel: formData.nameFieldLabel,
        nameFieldPlaceholder: formData.nameFieldPlaceholder,
        emailFieldLabel: formData.emailFieldLabel,
        emailFieldPlaceholder: formData.emailFieldPlaceholder,
        emailConfirmLabel: formData.emailConfirmLabel,
        emailConfirmPlaceholder: formData.emailConfirmPlaceholder,
        ctaButtonText: formData.ctaButtonText,
        enjoyText: formData.enjoyText,
        privacyLinkText: formData.privacyLinkText,
        showPeopleSelector: formData.showPeopleSelector,
        showDaysSelector: formData.showDaysSelector,
        minPeople: formData.minPeople,
        maxPeople: formData.maxPeople,
        minDays: formData.minDays,
        maxDays: formData.maxDays,
        showPayPal: formData.showPayPal,
        showContactForm: formData.showContactForm,
        customCSS: formData.customCSS,
        isDefault: formData.isDefault,
        primaryTextColor: formData.primaryTextColor,
        secondaryTextColor: formData.secondaryTextColor,
        formLabelColor: formData.formLabelColor,
        buttonTextColor: formData.buttonTextColor,
        footerTextColor: formData.footerTextColor,
        selectorTextColor: formData.selectorTextColor,
        thankYouTextColor: formData.thankYouTextColor,
        giftTextColor: formData.giftTextColor,
        signUpTextColor: formData.signUpTextColor,
        completeFieldsTextColor: formData.completeFieldsTextColor
      }
      
      const url = editingTemplate 
        ? `/api/admin/landing-templates/${editingTemplate.id}`
        : '/api/admin/landing-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      console.log('Making request to:', url, 'with method:', method)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        console.log('Template saved successfully')
        await fetchTemplates()
        closeModal()
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
        alert(`Error saving template: ${errorData}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert(`Error saving template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAsNewTemplate = async () => {
    // Prompt user for new template name
    const newTemplateName = prompt('Enter a name for the new template:', `Copy of ${formData.name}`)
    
    if (!newTemplateName) {
      return // User cancelled
    }

    setSaving(true)

    try {
      console.log('Submitting form data:', formData)
      
      // Clean data - remove timestamps and id that should be handled by Prisma
      const cleanData = {
        name: newTemplateName, // Use the new name provided by user
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        backgroundColor: formData.backgroundColor,
        thankYouText: formData.thankYouText,
        giftText: formData.giftText,
        signUpText: formData.signUpText,
        completeFieldsText: formData.completeFieldsText,
        choosePeopleText: formData.choosePeopleText,
        chooseDaysText: formData.chooseDaysText,
        nameFieldLabel: formData.nameFieldLabel,
        nameFieldPlaceholder: formData.nameFieldPlaceholder,
        emailFieldLabel: formData.emailFieldLabel,
        emailFieldPlaceholder: formData.emailFieldPlaceholder,
        emailConfirmLabel: formData.emailConfirmLabel,
        emailConfirmPlaceholder: formData.emailConfirmPlaceholder,
        ctaButtonText: formData.ctaButtonText,
        enjoyText: formData.enjoyText,
        privacyLinkText: formData.privacyLinkText,
        showPeopleSelector: formData.showPeopleSelector,
        showDaysSelector: formData.showDaysSelector,
        minPeople: formData.minPeople,
        maxPeople: formData.maxPeople,
        minDays: formData.minDays,
        maxDays: formData.maxDays,
        showPayPal: formData.showPayPal,
        showContactForm: formData.showContactForm,
        customCSS: formData.customCSS,
        isDefault: false, // New templates should not be default
        primaryTextColor: formData.primaryTextColor,
        secondaryTextColor: formData.secondaryTextColor,
        formLabelColor: formData.formLabelColor,
        buttonTextColor: formData.buttonTextColor,
        footerTextColor: formData.footerTextColor,
        selectorTextColor: formData.selectorTextColor,
        thankYouTextColor: formData.thankYouTextColor,
        giftTextColor: formData.giftTextColor,
        signUpTextColor: formData.signUpTextColor,
        completeFieldsTextColor: formData.completeFieldsTextColor
      }
      
      const url = '/api/admin/landing-templates'
      
      const method = 'POST'
      
      console.log('Making request to:', url, 'with method:', method)
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData)
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        console.log('New template saved successfully')
        await fetchTemplates()
        closeModal()
        alert(`New template "${newTemplateName}" created successfully!`)
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
        alert(`Error saving template: ${errorData}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert(`Error saving template: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  return (
    // <ProtectedRoute allowedRoles={["ADMIN"]}>
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
                        <h3 className="text-sm font-medium text-gray-700">{template.thankYouText}</h3>
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
                        {template.giftText}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: template.primaryColor }}
                          ></div>
                          <span className="text-xs text-gray-500">Primary</span>
                        </div>
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
                              Thank You Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.thankYouText || ''}
                              onChange={(e) => setFormData({ ...formData, thankYouText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Gift Text
                            </label>
                            <textarea
                              required
                              rows={3}
                              value={formData.giftText || ''}
                              onChange={(e) => setFormData({ ...formData, giftText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sign Up Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.signUpText || ''}
                              onChange={(e) => setFormData({ ...formData, signUpText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Complete Fields Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.completeFieldsText || ''}
                              onChange={(e) => setFormData({ ...formData, completeFieldsText: e.target.value })}
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

                          {/* Font Colors Section */}
                          <div className="border-t pt-4">
                            <h5 className="font-medium text-gray-900 mb-4">Font Colors</h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Primary Text Color */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Primary Text Color (Headers)
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={formData.primaryTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={formData.primaryTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, primaryTextColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* Secondary Text Color */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Secondary Text Color (Body)
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={formData.secondaryTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, secondaryTextColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={formData.secondaryTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, secondaryTextColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* Form Label Color */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Form Label Color
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={formData.formLabelColor || '#1f4ba6'}
                                    onChange={(e) => setFormData({ ...formData, formLabelColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={formData.formLabelColor || '#1f4ba6'}
                                    onChange={(e) => setFormData({ ...formData, formLabelColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* Button Text Color */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Button Text Color
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={formData.buttonTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={formData.buttonTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* Footer Text Color */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Footer Text Color
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={formData.footerTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={formData.footerTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {/* Selector Text Color */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Selector Text Color
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="color"
                                    value={formData.selectorTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, selectorTextColor: e.target.value })}
                                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={formData.selectorTextColor || '#ffffff'}
                                    onChange={(e) => setFormData({ ...formData, selectorTextColor: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Choose People Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.choosePeopleText || ''}
                              onChange={(e) => setFormData({ ...formData, choosePeopleText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Choose Days Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.chooseDaysText || ''}
                              onChange={(e) => setFormData({ ...formData, chooseDaysText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name Field Label
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.nameFieldLabel || ''}
                              onChange={(e) => setFormData({ ...formData, nameFieldLabel: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Name Field Placeholder
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.nameFieldPlaceholder || ''}
                              onChange={(e) => setFormData({ ...formData, nameFieldPlaceholder: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Field Label
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.emailFieldLabel || ''}
                              onChange={(e) => setFormData({ ...formData, emailFieldLabel: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Field Placeholder
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.emailFieldPlaceholder || ''}
                              onChange={(e) => setFormData({ ...formData, emailFieldPlaceholder: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Confirm Label
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.emailConfirmLabel || ''}
                              onChange={(e) => setFormData({ ...formData, emailConfirmLabel: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Confirm Placeholder
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.emailConfirmPlaceholder || ''}
                              onChange={(e) => setFormData({ ...formData, emailConfirmPlaceholder: e.target.value })}
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

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Enjoy Text
                            </label>
                            <textarea
                              required
                              rows={3}
                              value={formData.enjoyText || ''}
                              onChange={(e) => setFormData({ ...formData, enjoyText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Privacy Link Text
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.privacyLinkText || ''}
                              onChange={(e) => setFormData({ ...formData, privacyLinkText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.showPeopleSelector || false}
                                onChange={(e) => setFormData({ ...formData, showPeopleSelector: e.target.checked })}
                                className="mr-2 h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-gray-700">Show People Selector</span>
                            </label>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.showDaysSelector || false}
                                onChange={(e) => setFormData({ ...formData, showDaysSelector: e.target.checked })}
                                className="mr-2 h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm font-medium text-gray-700">Show Days Selector</span>
                            </label>

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
                              Min People
                            </label>
                            <input
                              type="number"
                              required
                              value={formData.minPeople || 1}
                              onChange={(e) => setFormData({ ...formData, minPeople: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max People
                            </label>
                            <input
                              type="number"
                              required
                              value={formData.maxPeople || 6}
                              onChange={(e) => setFormData({ ...formData, maxPeople: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Min Days
                            </label>
                            <input
                              type="number"
                              required
                              value={formData.minDays || 1}
                              onChange={(e) => setFormData({ ...formData, minDays: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Days
                            </label>
                            <input
                              type="number"
                              required
                              value={formData.maxDays || 10}
                              onChange={(e) => setFormData({ ...formData, maxDays: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
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

                      {/* Content Fields */}
                      <div className="space-y-6">
                        <h4 className="font-medium text-gray-900">Content & Text</h4>
                        
                        {/* Thank You Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thank You Text
                              </label>
                              <textarea
                                required
                                rows={3}
                                value={formData.thankYouText || ''}
                                onChange={(e) => setFormData({ ...formData, thankYouText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Thank You Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.thankYouTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, thankYouTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.thankYouTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, thankYouTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gift Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gift Text
                              </label>
                              <textarea
                                required
                                rows={3}
                                value={formData.giftText || ''}
                                onChange={(e) => setFormData({ ...formData, giftText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gift Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.giftTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, giftTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.giftTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, giftTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sign Up Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sign Up Text
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.signUpText || ''}
                                onChange={(e) => setFormData({ ...formData, signUpText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sign Up Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.signUpTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, signUpTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.signUpTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, signUpTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Complete Fields Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Complete Fields Text
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.completeFieldsText || ''}
                                onChange={(e) => setFormData({ ...formData, completeFieldsText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Complete Fields Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.completeFieldsTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, completeFieldsTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.completeFieldsTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, completeFieldsTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Selector Section */}
                      <div className="space-y-6">
                        <h4 className="font-medium text-gray-900">Selector Options</h4>
                        
                        {/* Choose People Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose People Text
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.choosePeopleText || ''}
                                onChange={(e) => setFormData({ ...formData, choosePeopleText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose People Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.selectorTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, selectorTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.selectorTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, selectorTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Choose Days Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose Days Text
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.chooseDaysText || ''}
                                onChange={(e) => setFormData({ ...formData, chooseDaysText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose Days Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.selectorTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, selectorTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.selectorTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, selectorTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Button Text Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number Buttons & CTA Button
                              </label>
                              <p className="text-sm text-gray-600">
                                This controls the text color for all buttons: People selector (1-6), Days selector (1-10), and the main CTA button.
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Button Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.buttonTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.buttonTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, buttonTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields Section */}
                      <div className="space-y-6">
                        <h4 className="font-medium text-gray-900">Form Fields</h4>
                        
                        {/* Form Labels with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name Field Label
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.nameFieldLabel || ''}
                                    onChange={(e) => setFormData({ ...formData, nameFieldLabel: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Field Label
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.emailFieldLabel || ''}
                                    onChange={(e) => setFormData({ ...formData, emailFieldLabel: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Confirmation Label
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.emailConfirmLabel || ''}
                                    onChange={(e) => setFormData({ ...formData, emailConfirmLabel: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Form Labels Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.formLabelColor || '#1f4ba6'}
                                  onChange={(e) => setFormData({ ...formData, formLabelColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.formLabelColor || '#1f4ba6'}
                                  onChange={(e) => setFormData({ ...formData, formLabelColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Color for "Name:", "Email:", "Email confirmation:" labels
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Section */}
                      <div className="space-y-6">
                        <h4 className="font-medium text-gray-900">Footer & Privacy</h4>
                        
                        {/* Footer Text with Color */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2">
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Footer Enjoyment Text
                                  </label>
                                  <textarea
                                    required
                                    rows={3}
                                    value={formData.enjoyText || ''}
                                    onChange={(e) => setFormData({ ...formData, enjoyText: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Privacy Link Text
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.privacyLinkText || ''}
                                    onChange={(e) => setFormData({ ...formData, privacyLinkText: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Footer Text Color
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="color"
                                  value={formData.footerTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={formData.footerTextColor || '#ffffff'}
                                  onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Color for footer text and privacy notice
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Default Selections Section */}
                      <div className="space-y-6">
                        <h4 className="font-medium text-gray-900">Default Selections (Pre-highlighted)</h4>
                        <p className="text-sm text-gray-600">These values will be automatically highlighted when users view the landing page. Users cannot change these selections.</p>
                      </div>

                      {/* Customization Control */}
                      <div className="space-y-6">
                        <h4 className="font-medium text-gray-900">Customization Control</h4>
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
                      {editingTemplate && (
                        <button
                          type="button"
                          onClick={handleSaveAsNewTemplate}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Save as New Template
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                      </button>
                    </div>
                  </form>
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
                  <div className="p-4">
                    {/* Real Landing Page Preview */}
                    <div 
                      className="min-h-screen"
                      style={{ backgroundColor: previewTemplate.backgroundColor || '#ffffff' }}
                    >
                      {/* Header Section with Logo and Blue Text */}
                      <div className="text-center py-8 px-8" style={{ backgroundColor: '#ffffff' }}>
                        {/* Logo */}
                        <div className="mb-6">
                          {previewTemplate.logoUrl ? (
                            <img 
                              src={previewTemplate.logoUrl} 
                              alt="Logo" 
                              className="h-24 mx-auto"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-32 h-24 mx-auto bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xl">LOGO</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Main Header Text - Blue */}
                        <h1 
                          className="text-2xl md:text-3xl font-bold mb-4 max-w-4xl mx-auto leading-tight"
                          style={{ 
                            color: previewTemplate.thankYouTextColor || '#ffffff',
                            backgroundColor: previewTemplate.backgroundColor || '#ffffff'
                          }}
                        >
                          {previewTemplate.thankYouText || 'THANKS YOU VERY MUCH FOR GIVING YOURSELF THE OPPORTUNITY TO DISCOVER THE BENEFITS OF THE CLUB.'}
                        </h1>
                        
                        {/* Gift Text - Blue */}
                        <p 
                          className="text-xl md:text-2xl font-bold mb-4 max-w-4xl mx-auto leading-tight"
                          style={{ 
                            color: previewTemplate.giftTextColor || '#ffffff',
                            backgroundColor: previewTemplate.backgroundColor || '#ffffff'
                          }}
                        >
                          {previewTemplate.giftText || 'TO RECEIVE YOUR 7-DAY FULL ACCESS GIFT TO ELOCALPASS, SIMPLY FILL OUT THE FIELDS BELOW AND YOU WILL RECEIVE YOUR FREE ELOCALPASS VIA EMAIL.'}
                        </p>
                        
                        {/* Sign Up Text */}
                        <p className="text-lg font-semibold mb-2" style={{ color: previewTemplate.signUpTextColor || '#ffffff' }}>
                          {previewTemplate.signUpText || 'SIGN UP TO GET YOUR FREE ELOCALPASS!'}
                        </p>
                        
                        {/* Complete Fields Text - Orange */}
                        <p 
                          className="text-lg font-semibold mb-8"
                          style={{ 
                            color: previewTemplate.completeFieldsTextColor || '#ffffff',
                            backgroundColor: previewTemplate.backgroundColor || '#ffffff'
                          }}
                        >
                          {previewTemplate.completeFieldsText || 'JUST COMPLETE THE FIELDS BELOW AND RECEIVE YOUR GIFT VIA EMAIL:'}
                        </p>
                      </div>

                      {/* Form Section - Blue Background */}
                      <div 
                        className="py-12"
                        style={{ 
                          background: 'linear-gradient(to bottom, #1f4ba6 0%, #1f4ba6 50%, #0f2557 100%)'
                        }}
                      >
                        <div className="px-8">
                          {/* People Selector */}
                          {(previewTemplate.showPeopleSelector ?? true) && (
                            <div className="mb-6 max-w-2xl mx-auto">
                              {/* Two blue bordered boxes side by side */}
                              <div className="flex gap-4">
                                {/* Left box with person icon and text - 1/3 width */}
                                <div className="w-1/3 border border-orange-400 rounded-lg p-4 flex items-center" style={{ borderWidth: '0.5px' }}>
                                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5" style={{ color: previewTemplate.selectorTextColor || '#ffffff' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-white font-semibold text-sm" style={{ color: previewTemplate.selectorTextColor || '#ffffff' }}>
                                    {previewTemplate.choosePeopleText || 'CHOOSE THE NUMBER OF PEOPLE BETWEEN 1 AND 6'}
                                  </span>
                                </div>
                                
                                {/* Right box with numbered buttons - 2/3 width */}
                                <div className="w-2/3 border border-orange-400 rounded-lg p-4" style={{ borderWidth: '0.5px' }}>
                                  <div className="flex space-x-2 justify-center flex-wrap">
                                    {[1,2,3,4,5,6].map(num => (
                                      <button
                                        key={num}
                                        className="w-12 h-12 rounded font-bold text-lg mb-2"
                                        style={{ 
                                          backgroundColor: previewTemplate.secondaryColor || '#f97316',
                                          color: previewTemplate.buttonTextColor || '#ffffff'
                                        }}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Days Selector - Optional */}
                          {previewTemplate.showDaysSelector && (
                            <div className="mb-6 max-w-2xl mx-auto">
                              {/* Two blue bordered boxes side by side */}
                              <div className="flex gap-4">
                                {/* Left box with calendar icon and text - smaller to match people selector */}
                                <div className="w-1/3 border border-orange-400 rounded-lg p-4 flex items-center" style={{ borderWidth: '0.5px' }}>
                                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-5 h-5" style={{ color: previewTemplate.selectorTextColor || '#ffffff' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <span className="text-white font-semibold text-sm" style={{ color: previewTemplate.selectorTextColor || '#ffffff' }}>
                                    {previewTemplate.chooseDaysText || 'CHOOSE THE NUMBER OF DAYS BETWEEN 1 AND 10'}
                                  </span>
                                </div>
                                
                                {/* Right box with numbered buttons - larger to match people selector */}
                                <div className="w-2/3 border border-orange-400 rounded-lg p-4" style={{ borderWidth: '0.5px' }}>
                                  <div className="flex space-x-2 justify-center flex-wrap">
                                    {Array.from({length: (previewTemplate.maxDays || 10) - (previewTemplate.minDays || 1) + 1}, (_, i) => i + (previewTemplate.minDays || 1)).map(num => (
                                      <button
                                        key={num}
                                        className="w-12 h-12 rounded font-bold text-lg mb-2"
                                        style={{ 
                                          backgroundColor: previewTemplate.secondaryColor || '#f97316',
                                          color: previewTemplate.buttonTextColor || '#ffffff'
                                        }}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Form Fields */}
                          <div className="space-y-3 max-w-2xl mx-auto">
                            {/* Name Field */}
                            <div className="bg-white rounded-lg p-2 flex items-center">
                              <label className="text-blue-600 font-semibold mr-4 whitespace-nowrap min-w-fit" style={{ color: previewTemplate.formLabelColor || '#1f4ba6' }}>
                                {previewTemplate.nameFieldLabel || 'Name:'}
                              </label>
                              <div className="flex-1 border border-gray-300 rounded px-3 py-1.5">
                                <input
                                  type="text"
                                  placeholder={previewTemplate.nameFieldPlaceholder || '(IT MUST MATCH YOUR ID)'}
                                  className="w-full bg-transparent border-0 text-gray-700 placeholder-gray-500 focus:outline-none text-sm"
                                  disabled
                                />
                              </div>
                            </div>

                            {/* Email Field */}
                            <div className="bg-white rounded-lg p-2 flex items-center">
                              <label className="text-blue-600 font-semibold mr-4 whitespace-nowrap min-w-fit" style={{ color: previewTemplate.formLabelColor || '#1f4ba6' }}>
                                {previewTemplate.emailFieldLabel || 'Email:'}
                              </label>
                              <div className="flex-1 border border-gray-300 rounded px-3 py-1.5">
                                <input
                                  type="email"
                                  placeholder={previewTemplate.emailFieldPlaceholder || '(TO RECEIVE YOUR ELOCALPASS)'}
                                  className="w-full bg-transparent border-0 text-gray-700 placeholder-gray-500 focus:outline-none text-sm"
                                  disabled
                                />
                              </div>
                            </div>

                            {/* Email Confirmation Field */}
                            <div className="bg-white rounded-lg p-2 flex items-center">
                              <label className="text-blue-600 font-semibold mr-4 whitespace-nowrap min-w-fit" style={{ color: previewTemplate.formLabelColor || '#1f4ba6' }}>
                                {previewTemplate.emailConfirmLabel || 'Email confirmation:'}
                              </label>
                              <div className="flex-1 border border-gray-300 rounded px-3 py-1.5">
                                <input
                                  type="email"
                                  placeholder={previewTemplate.emailConfirmPlaceholder || '(TO RECEIVE YOUR ELOCALPASS)'}
                                  className="w-full bg-transparent border-0 text-gray-700 placeholder-gray-500 focus:outline-none text-sm"
                                  disabled
                                />
                              </div>
                            </div>

                            {/* CTA Button */}
                            <div className="text-center pt-4 pb-6">
                              <button
                                className="text-white font-bold py-4 px-12 rounded-full text-lg hover:opacity-90 transition-opacity"
                                style={{ 
                                  backgroundColor: previewTemplate.secondaryColor || '#f97316',
                                  color: previewTemplate.buttonTextColor || '#ffffff'
                                }}
                                disabled
                              >
                                {previewTemplate.ctaButtonText || 'Get your eLocalPass now!'}
                              </button>
                            </div>
                          </div>

                          {/* Footer Text */}
                          <div className="mt-6 text-center">
                            {/* Footer text in bordered box matching screenshot */}
                            <div className="border border-orange-400 py-3 px-6 rounded-lg mb-6 mx-auto max-w-2xl" style={{ borderWidth: '0.5px' }}>
                              <p className="text-white text-sm font-extralight leading-relaxed text-center" style={{ color: previewTemplate.footerTextColor || '#ffffff' }}>
                                {previewTemplate.enjoyText || 'FULLY ENJOY THE EXPERIENCE OF PAYING LIKE A LOCAL. ELOCALPASS GUARANTEES THAT YOU WILL NOT RECEIVE ANY KIND OF SPAM AND THAT YOUR DATA IS PROTECTED.'}
                              </p>
                            </div>
                            
                            {/* Privacy link text */}
                            <p className="text-white text-sm cursor-pointer" style={{ color: previewTemplate.footerTextColor || '#ffffff' }}>
                              Click <span className="font-semibold underline">HERE</span> to read the privacy notice and data usage
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom CSS Preview */}
                  {previewTemplate.customCSS && (
                    <style dangerouslySetInnerHTML={{ __html: previewTemplate.customCSS }} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
