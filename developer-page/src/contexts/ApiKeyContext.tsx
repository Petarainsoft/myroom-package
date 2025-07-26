import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProjectService } from '../services';
import { ApiKey } from '../services/project.service';

interface ApiKeyContextType {
  activeApiKey: string | null;
  setActiveApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [activeApiKey, setActiveApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    // Load the active API key from localStorage on component mount
    const storedApiKey = ProjectService.getActiveApiKey();
    if (storedApiKey) {
      setActiveApiKeyState(storedApiKey);
    }
  }, []);

  const setActiveApiKey = (apiKey: string) => {
    ProjectService.setActiveApiKey(apiKey);
    setActiveApiKeyState(apiKey);
  };

  const clearApiKey = () => {
    localStorage.removeItem('apiKey');
    setActiveApiKeyState(null);
  };

  const value = {
    activeApiKey,
    setActiveApiKey,
    clearApiKey,
  };

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>;
};