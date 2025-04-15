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

// Provider component
export function EventCatalogProvider({ children }: EventCatalogProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [catalogData, setCatalogData] = useState<any>(null);
  const value = {
    isLoading,
    setIsLoading,
    catalogData,
    setCatalogData,
    // Add more values/functions here
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
