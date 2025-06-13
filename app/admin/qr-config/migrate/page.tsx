'use client'

import { useState } from 'react'

// Simple toast function since react-hot-toast might not be available
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
}

export default function MigratePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [migrationResults, setMigrationResults] = useState<any>(null)

  const migrateToDatabase = async () => {
    setIsLoading(true)
    setMigrationResults(null)

    try {
      // Get all localStorage configurations
      const savedConfigsData = localStorage.getItem('elocalpass-saved-configurations')
      
      if (!savedConfigsData) {
        toast.error('No configurations found in localStorage')
        setIsLoading(false)
        return
      }

      const savedConfigs = JSON.parse(savedConfigsData)
      console.log('🔄 MIGRATION: Found', savedConfigs.length, 'configurations in localStorage')

      const results = {
        total: savedConfigs.length,
        success: 0,
        failed: 0,
        errors: [] as string[]
      }

      // Migrate each configuration
      for (const config of savedConfigs) {
        try {
          console.log('🔄 MIGRATION: Migrating config:', config.id, config.name)

          // Check if already exists in database
          const checkResponse = await fetch(`/api/admin/saved-configs/${config.id}`, {
            credentials: 'include'
          })

          if (checkResponse.ok) {
            console.log('⚠️ MIGRATION: Config already exists in database, skipping:', config.id)
            results.success++
            continue
          }

          // Create in database
          const createResponse = await fetch('/api/admin/saved-configs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: config.id, // Preserve the original ID
              name: config.name,
              description: config.description || 'Migrated from localStorage',
              config: config.config,
              emailTemplates: config.emailTemplates,
              // Merge templates into landingPageConfig since there's no templates field in DB schema
              landingPageConfig: config.templates ? {
                ...config.landingPageConfig,
                templates: config.templates
              } : config.landingPageConfig,
              selectedUrlIds: config.selectedUrlIds
            })
          })

          if (createResponse.ok) {
            console.log('✅ MIGRATION: Successfully migrated:', config.id)
            results.success++
          } else {
            const errorData = await createResponse.json()
            console.log('❌ MIGRATION: Failed to migrate:', config.id, errorData)
            results.failed++
            results.errors.push(`${config.name}: ${errorData.error}`)
          }

        } catch (error) {
          console.log('❌ MIGRATION: Error migrating config:', config.id, error)
          results.failed++
          results.errors.push(`${config.name}: ${String(error)}`)
        }
      }

      setMigrationResults(results)
      
      if (results.success > 0) {
        toast.success(`Migration completed! ${results.success}/${results.total} configurations migrated`)
      } else {
        toast.error('Migration failed - no configurations were migrated')
      }

    } catch (error) {
      console.error('Migration error:', error)
      toast.error('Migration failed: ' + String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const clearLocalStorage = async () => {
    if (confirm('Are you sure you want to clear localStorage? This will remove all local configurations. Make sure you have migrated to database first!')) {
      localStorage.removeItem('elocalpass-saved-configurations')
      localStorage.removeItem('elocalpass-landing-config')
      localStorage.removeItem('elocalpass-welcome-email-config')
      localStorage.removeItem('elocalpass-rebuy-email-config')
      localStorage.removeItem('elocalpass-landing-templates')
      localStorage.removeItem('elocalpass-email-templates')
      localStorage.removeItem('elocalpass-current-qr-progress')
      
      toast.success('localStorage cleared successfully')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Database Migration Tool
          </h1>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              ⚠️ Production Readiness Migration
            </h2>
            <p className="text-yellow-700 mb-2">
              This tool migrates all QR configurations from localStorage to the database for production deployment.
            </p>
            <p className="text-yellow-700 text-sm">
              <strong>Why this is needed:</strong> localStorage doesn't work in production - data is lost when users clear browser data or switch devices.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={migrateToDatabase}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Migrating...' : 'Migrate localStorage to Database'}
            </button>

            {migrationResults && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Migration Results:</h3>
                <div className="space-y-1 text-sm">
                  <p>Total configurations: {migrationResults.total}</p>
                  <p className="text-green-600">Successfully migrated: {migrationResults.success}</p>
                  <p className="text-red-600">Failed: {migrationResults.failed}</p>
                  
                  {migrationResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-red-600">Errors:</p>
                      <ul className="list-disc list-inside text-red-600">
                        {migrationResults.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">After Migration:</h3>
              <button
                onClick={clearLocalStorage}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear localStorage (Only after successful migration)
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This will remove all localStorage data. Only do this after confirming the migration was successful.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 