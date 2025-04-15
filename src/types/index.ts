// Define base types
export type ResourceID = string;
export type TeamID = string;
export type UserID = string;
export type VersionString = string;

// Interface for Badges used across resources
export interface Badge {
  content: string;
  backgroundColor: string;
  textColor: string;
  icon?: string;
}

// Interface for Repository information
export interface Repository {
  language: string;
  url: string;
}

// Interface for linking resources (used in receives, sends, services, domains, resourceGroups)
export interface ResourceLink {
  id: ResourceID;
  version?: VersionString;
  type?: 'service' | 'event' | 'command' | 'query' | 'domain' | 'flow' | 'channel' | 'team' | 'user'; // Type might be needed for disambiguation in some contexts
}

// Interface for EventCatalog specific metadata
export interface EventCatalogMeta {
  directory: string;
  schema?: string; // Can be JSON, Avro, etc. as string
}

// Interface for Specification links (OpenAPI, AsyncAPI)
export interface SpecificationMeta {
  asyncapiPath?: string;
  openapiPath?: string;
}

// Interface for Deprecation information
export interface DeprecatedMeta {
  date: string; // ISO Date string
  message: string;
}

// Interface for Sidebar metadata (e.g., HTTP method badges)
export interface SidebarMeta {
  badge?: string;
}

// Interface for items within a Resource Group
export interface ResourceGroupItem extends ResourceLink {
  type: 'service' | 'event' | 'command' | 'query' | 'domain' | 'flow' | 'channel' | 'team' | 'user'; // Type is likely required here
}

// Interface for Resource Groups within Domains or other resources
export interface ResourceGroup {
  id: string;
  title: string;
  items: ResourceGroupItem[];
}

// Interface for Channel Parameters
export interface ChannelParameter {
  enum?: string[];
  description?: string;
}

export interface ChannelParameters {
  [key: string]: ChannelParameter;
}

// Interface for linking to Channels (used in Events, Commands)
export interface ChannelLink {
  id: string;
  parameters?: { [key: string]: string };
}

// ---- Core Resource Interfaces ----

// Base interface for message-like resources (Event, Query, Command)
interface MessageBase {
  id: ResourceID;
  name: string;
  version: VersionString;
  summary?: string;
  owners: (TeamID | UserID)[];
  badges?: Badge[];
  schemaPath?: string;
  channels?: ChannelLink[];
  sidebar?: SidebarMeta;
  _eventcatalog: EventCatalogMeta;
}

// Interface for Domain
export interface Domain {
  id: ResourceID;
  name: string;
  version: VersionString;
  summary?: string;
  owners: TeamID[];
  services?: ResourceLink[];
  domains?: ResourceLink[]; // For subdomains
  badges?: Badge[];
  resourceGroups?: ResourceGroup[];
  _eventcatalog: EventCatalogMeta;
  // Note: The JSON structure seems to flatten services/events/etc under the domain key sometimes.
  // This type represents a pure Domain. Adjust if mixed content is expected.
}

// Interface for Service
export interface Service {
  id: ResourceID;
  version: VersionString;
  name: string;
  summary?: string;
  owners: TeamID[];
  receives?: ResourceLink[];
  sends?: ResourceLink[];
  repository?: Repository;
  schemaPath?: string; // Can point to OpenAPI/AsyncAPI etc.
  specifications?: SpecificationMeta;
  deprecated?: DeprecatedMeta;
  _eventcatalog: EventCatalogMeta;
  // Might also contain events, commands, queries nested in JSON depending on generation
}

// Interface for Event
export interface Event extends MessageBase {}

// Interface for Query
export interface Query extends MessageBase {}

// Interface for Command
export interface Command extends MessageBase {}

// ---- Flow Interfaces ----

export interface FlowStepLink {
  id: string;
  label?: string;
}

export interface FlowStepCustom {
  title: string;
  color?: string;
  icon?: string;
  type?: string;
  summary?: string;
  height?: number;
  properties?: Record<string, any>;
  menu?: { label: string; url: string }[];
}

export interface ExternalSystem {
  name: string;
  summary?: string;
  url?: string;
}

export interface Actor {
  name: string;
}

export interface FlowStep {
  id: string;
  title: string;
  summary?: string;
  service?: ResourceLink;
  message?: ResourceLink; // Could be Event or Command
  flow?: ResourceLink;
  custom?: FlowStepCustom;
  externalSystem?: ExternalSystem;
  actor?: Actor;
  type?: 'node' | string; // 'node' or potentially other types
  next_step?: FlowStepLink;
  next_steps?: (FlowStepLink | string)[]; // Can be links with labels or just target IDs
}

export interface Flow {
  id: ResourceID;
  name: string;
  version: VersionString;
  summary?: string;
  owners: TeamID[];
  steps: FlowStep[];
  _eventcatalog: EventCatalogMeta;
}

// ---- Team & User Interfaces ----

export interface Team {
  id: TeamID;
  name: string;
  summary?: string; // Corrected typo from 'summmary'
  members: UserID[];
  email?: string;
  slackDirectMessageUrl?: string;
  msTeamsDirectMessageUrl?: string;
  _eventcatalog: {}; // Seems empty in the provided JSON
}

export interface User {
  id: UserID;
  name: string;
  avatarUrl?: string;
  role?: string;
  email?: string;
  slackDirectMessageUrl?: string;
  msTeamsDirectMessageUrl?: string;
  _eventcatalog: {}; // Seems empty in the provided JSON
}

// ---- Channel Interface ----

export interface Channel {
  id: string; // Channel IDs might have patterns like `payments.{env}.events`
  name: string;
  version: VersionString;
  summary?: string;
  owners: UserID[];
  address: string;
  protocols: string[];
  parameters?: ChannelParameters;
  _eventcatalog: EventCatalogMeta;
}

// ---- Top-Level Structure ----

// Interface for the `messages` object grouping events, queries, commands
export interface Messages {
  events: Event[];
  queries: Query[];
  commands: Command[];
}

// Interface for the main `resources` object
// Note: The JSON provided seems to have a flat structure where `domains` and `services` arrays
// might contain mixed resource types beyond just Domains and Services, reflecting their file path.
// Using `any[]` for now for flexibility, but consider discriminated unions if a clear pattern emerges.
export interface Resources {
  domains: (Domain | Service | Query | Event | Command | Flow)[]; // Array likely contains various resource types found under domain paths
  services: (Service | Query | Event | Command)[]; // Array likely contains various resource types found under service paths
  messages: Messages;
  teams: Team[];
  users: User[];
  channels: Channel[];
}

// Interface for the entire Catalog Data structure (root of the JSON)
export interface CatalogData {
  version: VersionString;
  catalogVersion: string; // e.g., "unknown"
  createdAt: string; // ISO Date string
  resources: Resources;
}
