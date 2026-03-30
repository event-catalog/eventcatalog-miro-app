import React, { createContext, useContext, ReactNode, useState } from 'react';
import { CatalogData } from '../types';

// Define the context type
interface EventCatalogContextType {
  // Add your shared state and functions here
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  catalogData: CatalogData;
  setCatalogData: (data: CatalogData) => void;
  // Add more state/functions as needed
}

// Create the context with a default value
const EventCatalogContext = createContext<EventCatalogContextType | undefined>(undefined);

// Provider props type
interface EventCatalogProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'eventcatalog-data';

// Provider component
export function EventCatalogProvider({ children }: EventCatalogProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [catalogData, setCatalogDataState] = useState<any>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setCatalogData = (data: any) => {
    setCatalogDataState(data);
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save catalog data to localStorage:', e);
    }
  };

  const value = {
    isLoading,
    setIsLoading,
    catalogData,
    setCatalogData,
  };

  return <EventCatalogContext.Provider value={value}>{children}</EventCatalogContext.Provider>;
}

// Custom hook to use the context
export function useEventCatalog() {
  const context = useContext(EventCatalogContext);
  if (context === undefined) {
    throw new Error('useEventCatalog must be used within an EventCatalogProvider');
  }
  return context;
}
