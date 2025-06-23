/**
 * MyRoom Domain Configuration Script
 * 
 * This script allows you to easily change the domain after build and deployment.
 * Place this file in your web server root directory and modify the baseDomain value.
 */

(function() {
  // Set this to your actual domain after deployment
  window.MYROOM_CONFIG = {
    baseDomain: 'https://2620-116-110-43-199.ngrok-free.app'
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