import React, { useState } from 'react';

// SAVED BUTTON 5 ANALYTICS CONFIGURATION
// This code was removed from landing page config but saved for future analytics implementation

// Analytics State
const [analyticsConfig, setAnalyticsConfig] = useState({
  trackScans: true,
  trackVisits: true,
  trackSubmissions: true,
  enableHeatmap: false,
  analyticsRetentionDays: 365,
  enableRealTimeStats: true
})

// Button 5 Analytics UI Section
const Button5AnalyticsSection = () => (
  <div className="bg-amber-50 p-6 rounded-lg border-2 border-amber-200">
    <h2 className="text-xl font-bold text-amber-900 mb-4">📊 Button 5: Analytics & Tracking Configuration</h2>
    <p className="text-amber-700 text-sm mb-4">Configure analytics tracking for QR codes, landing pages, and user interactions. Monitor performance and engagement metrics.</p>
    
    {/* Analytics Toggle Options */}
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-bold text-amber-800 mb-3">Tracking Options</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex items-center bg-white p-3 rounded border border-amber-200">
          <input
            type="checkbox"
            checked={analyticsConfig.trackScans}
            onChange={(e) => setAnalyticsConfig({...analyticsConfig, trackScans: e.target.checked})}
            className="mr-3"
          />
          <div>
            <span className="text-sm font-medium text-amber-700">QR Code Scans</span>
            <p className="text-xs text-amber-600">Track when and where QR codes are scanned</p>
          </div>
        </label>
        
        <label className="flex items-center bg-white p-3 rounded border border-amber-200">
          <input
            type="checkbox"
            checked={analyticsConfig.trackVisits}
            onChange={(e) => setAnalyticsConfig({...analyticsConfig, trackVisits: e.target.checked})}
            className="mr-3"
          />
          <div>
            <span className="text-sm font-medium text-amber-700">Landing Page Visits</span>
            <p className="text-xs text-amber-600">Monitor landing page traffic and engagement</p>
          </div>
        </label>
        
        <label className="flex items-center bg-white p-3 rounded border border-amber-200">
          <input
            type="checkbox"
            checked={analyticsConfig.trackSubmissions}
            onChange={(e) => setAnalyticsConfig({...analyticsConfig, trackSubmissions: e.target.checked})}
            className="mr-3"
          />
          <div>
            <span className="text-sm font-medium text-amber-700">Form Submissions</span>
            <p className="text-xs text-amber-600">Track successful form completions and conversions</p>
          </div>
        </label>
        
        <label className="flex items-center bg-white p-3 rounded border border-amber-200">
          <input
            type="checkbox"
            checked={analyticsConfig.enableRealTimeStats}
            onChange={(e) => setAnalyticsConfig({...analyticsConfig, enableRealTimeStats: e.target.checked})}
            className="mr-3"
          />
          <div>
            <span className="text-sm font-medium text-amber-700">Real-Time Statistics</span>
            <p className="text-xs text-amber-600">Live updates of current activity and metrics</p>
          </div>
        </label>
      </div>
    </div>
    
    {/* Advanced Analytics Options */}
    <div className="bg-white p-4 rounded-lg border border-amber-200 mb-6">
      <h3 className="text-lg font-bold text-amber-800 mb-3">Advanced Options</h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={analyticsConfig.enableHeatmap}
            onChange={(e) => setAnalyticsConfig({...analyticsConfig, enableHeatmap: e.target.checked})}
            className="mr-2"
          />
          <div>
            <span className="text-sm font-medium text-amber-700">Enable Heatmap Tracking</span>
            <p className="text-xs text-amber-600">Track user interactions and clicks on landing pages (requires additional setup)</p>
          </div>
        </label>
        
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">Data Retention Period</label>
          <select
            value={analyticsConfig.analyticsRetentionDays}
            onChange={(e) => setAnalyticsConfig({...analyticsConfig, analyticsRetentionDays: parseInt(e.target.value)})}
            className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>6 Months</option>
            <option value={365}>1 Year</option>
            <option value={730}>2 Years</option>
          </select>
          <p className="text-xs text-amber-600 mt-1">
            How long to keep analytics data before automatic deletion
          </p>
        </div>
      </div>
    </div>
    
    {/* Analytics Dashboard Preview */}
    <div className="bg-white p-4 rounded-lg border border-amber-200">
      <h3 className="text-lg font-bold text-amber-900 mb-4">📈 Analytics Dashboard Preview</h3>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-blue-600">--</div>
          <div className="text-sm text-blue-600">Total QR Scans</div>
        </div>
        <div className="bg-green-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-green-600">--</div>
          <div className="text-sm text-green-600">Landing Page Visits</div>
        </div>
        <div className="bg-purple-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-purple-600">--</div>
          <div className="text-sm text-purple-600">Form Submissions</div>
        </div>
      </div>
      <div className="text-center text-sm text-amber-600">
        📊 Live analytics data will appear here after QR configuration is created and deployed
      </div>
    </div>
    
    {/* Export Options */}
    <div className="mt-6 bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Data Export Options</h3>
      <div className="flex gap-4 flex-wrap">
        <button 
          type="button"
          className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          disabled
        >
          📊 Export CSV Report
        </button>
        <button 
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled
        >
          📈 Generate PDF Analytics
        </button>
        <button 
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          disabled
        >
          📧 Schedule Email Reports
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Export options will be enabled after QR configuration deployment
      </p>
    </div>
  </div>
)
