/**
 * MyRoom Domain Configuration Script
 * 
 * This script allows you to easily change the domain after build and deployment.
 */

(function() {
  // Set this to your actual domain after deployment
  window.MYROOM_CONFIG = {
    // baseDomain: 'http://192.168.1.5:5173' // LAN test (mobile device access)
    baseDomain: 'http://localhost:5175' // local test only
    // baseDomain: 'https://myroom.petarainsoft.com'
  };
  
  console.log('MyRoom domain configuration loaded:', window.MYROOM_CONFIG.baseDomain);
  
  // Automatically update any config module that might be loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Dispatch a custom event that components can listen for
    document.dispatchEvent(new CustomEvent('myroom-domain-configured', { 
      detail: window.MYROOM_CONFIG 
    }));
  });
})();