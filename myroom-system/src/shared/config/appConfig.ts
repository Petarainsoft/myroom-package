/**
 * Application Configuration
 * 
 * This file contains global configuration settings for the MyRoom application.
 * Simplified to use backend API only for all asset loading.
 */
const getConfiguredBackendDomain = () => {
  // Check window.MYROOM_CONFIG first (from config-domain.js)
  if (typeof window !== 'undefined' && (window as any).MYROOM_CONFIG && (window as any).MYROOM_CONFIG.backendDomain) {
    return (window as any).MYROOM_CONFIG.backendDomain;
  }
  // Fallback to localhost for development
  return 'http://localhost:3579';
};
const getConfiguredApiKey = () => {
  if (typeof window !== 'undefined' && (window as any).MYROOM_CONFIG && (window as any).MYROOM_CONFIG.apiKey) {
    return (window as any).MYROOM_CONFIG.apiKey;
  }
  // Default API key for development
  return 'pk_test_1234567890abcdef1234567890abcdef';
};

const getConfiguredProjectId = () => {
  if (typeof window !== 'undefined' && (window as any).MYROOM_CONFIG && (window as any).MYROOM_CONFIG.projectId) {
    return (window as any).MYROOM_CONFIG.projectId;
  }
  // Check environment variable safely
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_PROJECT_ID) {
    return process.env.REACT_APP_PROJECT_ID;
  }
  // Project will be determined from apiKey by backend, no need for default
  return null;
};



// Simplified domain configuration - backend API only
export const domainConfig = {
  backendDomain: getConfiguredBackendDomain(),
  apiKey: getConfiguredApiKey(),
  projectId: getConfiguredProjectId()
};

// Helper function to generate embed URLs
export const getEmbedUrl = (params: any = {}) => {
  const baseUrl = `${domainConfig.backendDomain}/embed`;
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, params[key].toString());
    }
  });
  
  return searchParams.toString() ? `${baseUrl}?${searchParams.toString()}` : baseUrl;
};

// Default export for easier importing
export default {
  domainConfig,
  getEmbedUrl
};