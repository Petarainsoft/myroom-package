/**
 * Application Configuration
 * 
 * This file contains global configuration settings for the MyRoom application.
 * It can be easily modified after build to update domain and other settings.
 * 
 * For production deployment:
 * 1. Edit the config-domain.js file in your web server root
 * 2. Set the baseDomain value to your actual domain
 */

// Check if domain is configured via external script
const getConfiguredDomain = () => {
  // Check if running in browser environment
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.baseDomain) {
    return window.MYROOM_CONFIG.baseDomain;
  }
  
  // Default domain (used during development or if not configured)
  return 'https://ffb5-116-110-43-199.ngrok-free.app';
};

// Base domain configuration
// This will be used for all URLs in the application
// Can be overridden after build by updating config-domain.js
export const domainConfig = {
  // The base domain URL (without trailing slash)
  baseDomain: getConfiguredDomain(),
  
  // Paths for different resources
  paths: {
    webComponent: '/myroom-component.js',
    embedHtml: '/embed.html',
    models: {
      rooms: '/models/rooms',
      items: '/models/items',
      avatars: '/models/avatars'
    }
  }
};

// Helper functions to generate URLs
export const getFullUrl = (path: string): string => {
  return `${domainConfig.baseDomain}${path}`;
};

export const getWebComponentUrl = (): string => {
  return getFullUrl(domainConfig.paths.webComponent);
};

export const getEmbedUrl = (params?: Record<string, string>): string => {
  const baseUrl = getFullUrl(domainConfig.paths.embedHtml);
  
  if (!params) return baseUrl;
  
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    urlParams.append(key, value);
  });
  
  return `${baseUrl}?${urlParams.toString()}`;
};

// Default export for easier importing
export default {
  domainConfig,
  getFullUrl,
  getWebComponentUrl,
  getEmbedUrl
};