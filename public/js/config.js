/**
 * SOCyberX Configuration
 * 
 * Centralized configuration for Cloud Functions URLs and other settings.
 * This file is loaded before other scripts that need these values.
 * 
 * For local development: Uses localhost emulator
 * For production: Uses production Cloud Functions URL
 * 
 * To override for production, set window.__SOCYBERX_CONFIG__ before this script loads.
 */

(function() {
  'use strict';

  // Default configuration
  const defaultConfig = {
    // Cloud Functions base URL
    // Auto-detects based on hostname
    FUNCTIONS_BASE_URL: (function() {
      const hostname = window.location.hostname;
      
      // Production domain
      if (hostname === 'socyberx.com' || hostname === 'www.socyberx.com') {
        return 'https://us-central1-cyberrank-a4380.cloudfunctions.net';
      }
      
      // Local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001/cyberrank-a4380/us-central1';
      }
      
      // Default fallback (production)
      return 'https://us-central1-cyberrank-a4380.cloudfunctions.net';
    })(),
    
    // OTP Feature Flag - OTP temporarily disabled – can be re-enabled by setting OTP_ENABLED = true
    // When disabled: Skip OTP generation, skip email sending, auto-verify all requests
    // Set to true to enable OTP verification (requires Cloud Functions)
    OTP_ENABLED: false
  };

  // Merge with user-provided config (if any)
  const userConfig = window.__SOCYBERX_CONFIG__ || {};
  const config = Object.assign({}, defaultConfig, userConfig);

  // Expose config globally
  window.__SOCYBERX_CONFIG__ = config;

  // Also expose individual values for convenience
  window.SOCYBERX_CONFIG = {
    get FUNCTIONS_BASE_URL() {
      return window.__SOCYBERX_CONFIG__.FUNCTIONS_BASE_URL;
    },
    get OTP_ENABLED() {
      return window.__SOCYBERX_CONFIG__.OTP_ENABLED;
    }
  };

  // Expose as APP_CONFIG for compatibility
  window.APP_CONFIG = config;

  console.log('[Config] SOCyberX configuration loaded:', {
    FUNCTIONS_BASE_URL: config.FUNCTIONS_BASE_URL,
    OTP_ENABLED: config.OTP_ENABLED,
    hostname: window.location.hostname
  });
  console.log('[Config] window.APP_CONFIG ready:', window.APP_CONFIG);
})();

