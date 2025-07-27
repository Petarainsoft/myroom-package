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
  return 'http://localhost:5175'; // assets server, should change port accordingly
  //return 'http://192.168.1.x:5173'; change to deployed url to LAN test, for example: mobile device access. Change Port accordingly
  // return 'https://myroom.petarainsoft.com';
};
const getConfiguredBackendDomain = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.backendDomain) {
    return window.MYROOM_CONFIG.backendDomain;
  }
  return 'http://localhost:3000'; // Default backend domain, to be filled later
};
const getConfiguredApiKey = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.apiKey) {
    return window.MYROOM_CONFIG.apiKey;
  }
  // Default API key for development
  return 'pk_test_1234567890abcdef1234567890abcdef';
};
const getConfiguredUseResourceId = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && typeof window.MYROOM_CONFIG.useResourceId === 'boolean') {
    return window.MYROOM_CONFIG.useResourceId;
  }
  return false; // Default to false for backward compatibility
};
const getConfiguredProjectId = () => {
  if (typeof window !== 'undefined' && window.MYROOM_CONFIG && window.MYROOM_CONFIG.projectId) {
    return window.MYROOM_CONFIG.projectId;
  }
  // Check environment variable safely
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_PROJECT_ID) {
    return process.env.REACT_APP_PROJECT_ID;
  }
  return 'default-project'; // Default project ID
};

// Static boolean to temporarily disable local GLB resource loading
// Set to true to disable local server GLB loading (for testing/debugging)
export const DISABLE_LOCAL_GLB_LOADING = true;

// Base domain configuration
// This will be used for all URLs in the application
// Can be overridden after build by updating config-domain.js
export const domainConfig = {
  baseDomain: getConfiguredBaseDomain(),
  backendDomain: getConfiguredBackendDomain(),
  apiKey: getConfiguredApiKey(),
  useResourceId: getConfiguredUseResourceId(),
  projectId: getConfiguredProjectId(),
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