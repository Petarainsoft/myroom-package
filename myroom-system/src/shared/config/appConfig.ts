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
const getConfiguredBaseDomain = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.baseDomain) {
    return window.MYROOM_CONFIG.baseDomain;
  }
  
  // Default domain (used during development or if not configured)
  return 'http://localhost:5175'; // local test, should change port accordingly
  //return 'http://192.168.1.x:5173'; change to deployed url to LAN test, for example: mobile device access. Change Port accordingly
  // return 'https://myroom.petarainsoft.com';
};
const getConfiguredBackendDomain = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.backendDomain) {
    return window.MYROOM_CONFIG.backendDomain;
  }
  return 'https://api.myroom.petarainsoft.com'; // Default backend domain, to be filled later
};
const getConfiguredApiKey = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.apiKey) {
    return window.MYROOM_CONFIG.apiKey;
  }
  return ''; // Default empty, should be set securely
};

// Base domain configuration
// This will be used for all URLs in the application
// Can be overridden after build by updating config-domain.js
export const domainConfig = {
  baseDomain: getConfiguredBaseDomain(),
  backendDomain: getConfiguredBackendDomain(),
  apiKey: getConfiguredApiKey(),
  paths: {
    webComponent: '/dist/myroom-webcomponent.umd.js',
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