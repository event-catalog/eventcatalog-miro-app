export type CategoryType = 'services' | 'events' | 'commands' | 'queries';

export interface MessageDetails {
  name: string;
  version: string;
  summary?: string;
  type?: string;
}

export interface StyleResult {
  backgroundColor: string;
  fillColor: string;
}

export interface Resource {
  id: string;
  name: string;
  version: string;
  owners?: any[];
  badges?: any[];
  summary?: string;
  description?: string;
  receives?: any[];
  sends?: any[];
}
