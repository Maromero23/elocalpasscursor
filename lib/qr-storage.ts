// Shared storage for QR configurations
// In a real app, this would be stored in a database

// Use global to persist across module reloads in development
declare global {
  var qrConfigurationsStorage: Map<string, any> | undefined
}

export const qrConfigurations = global.qrConfigurationsStorage || new Map()

if (process.env.NODE_ENV !== 'production') {
  global.qrConfigurationsStorage = qrConfigurations
}
