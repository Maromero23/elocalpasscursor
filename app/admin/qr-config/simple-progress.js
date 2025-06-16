// Simple Progress Tracking System
// This replaces the complex database-first approach

class SimpleProgressTracker {
  constructor() {
    this.storageKey = 'qr-config-progress';
  }

  // Get current progress
  getProgress() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : {
      button1: false,
      button2: false,
      button3: false,
      button4: false,
      button5: false
    };
  }

  // Mark a button as configured
  markConfigured(buttonNumber) {
    const progress = this.getProgress();
    progress[`button${buttonNumber}`] = true;
    localStorage.setItem(this.storageKey, JSON.stringify(progress));
    return progress;
  }

  // Check if button is configured
  isConfigured(buttonNumber) {
    const progress = this.getProgress();
    return progress[`button${buttonNumber}`] || false;
  }

  // Clear all progress
  clearProgress() {
    localStorage.removeItem(this.storageKey);
    return {
      button1: false,
      button2: false,
      button3: false,
      button4: false,
      button5: false
    };
  }

  // Get configured buttons array
  getConfiguredButtons() {
    const progress = this.getProgress();
    return Object.keys(progress)
      .filter(key => progress[key])
      .map(key => parseInt(key.replace('button', '')));
  }
}

// Usage examples:
// const tracker = new SimpleProgressTracker();
// tracker.markConfigured(3); // Button 3 turns green
// tracker.isConfigured(3);   // Returns true
// tracker.clearProgress();   // All buttons turn gray 