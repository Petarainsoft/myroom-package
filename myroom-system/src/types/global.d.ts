// Global type definitions for MyRoom system

declare global {
  interface Window {
    MYROOM_CONFIG?: {
      apiBaseUrl?: string;
      apiKey?: string;
      projectId?: string;
      baseDomain?: string;
      useResourceId?: boolean;
      [key: string]: any;
    };
  }
}

export {};