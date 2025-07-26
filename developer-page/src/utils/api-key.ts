/**
 * Utility functions for managing API keys in local storage
 */

// Key used for storing the API key in localStorage
const API_KEY_STORAGE_KEY = 'myr-api-key';

/**
 * Save an API key to localStorage
 * @param apiKey The API key to save
 */
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
};

/**
 * Get the currently stored API key from localStorage
 * @returns The stored API key or null if none exists
 */
export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

/**
 * Remove the API key from localStorage
 */
export const removeApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

/**
 * Check if an API key exists in localStorage
 * @returns True if an API key exists, false otherwise
 */
export const hasApiKey = (): boolean => {
  return !!getApiKey();
};