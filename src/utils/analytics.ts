import posthog from 'posthog-js';

// PostHog configuration — same project as EventCatalog Studio
const POSTHOG_KEY = 'phc_HQZncKORYsXgO87WuSjSdKbQSTzylljE6HTtUw0fBIH';
const POSTHOG_HOST = 'https://e.eventcatalog.dev/relay-fBIH';

// Analytics event names — all prefixed MIRO_ to distinguish from Studio events
export const ANALYTICS_EVENTS = {
  APP_OPENED: 'MIRO_app_opened',
  CATALOG_IMPORTED_FILE: 'MIRO_catalog_imported_file',
  CATALOG_IMPORTED_PASTE: 'MIRO_catalog_imported_paste',
  RESOURCE_DROPPED_TO_BOARD: 'MIRO_resource_dropped_to_board',
  NEW_RESOURCE_CREATED: 'MIRO_new_resource_created',
  RESOURCE_REMOVED: 'MIRO_resource_removed',
  RESOURCE_EDITED: 'MIRO_resource_edited',
  AUTO_LAYOUT_USED: 'MIRO_auto_layout_used',
  CATEGORY_SELECTED: 'MIRO_category_selected',
  CATALOG_LOADED: 'MIRO_catalog_loaded',
  CATALOG_EXPORTED: 'MIRO_catalog_exported',
} as const;

// Cached board context
let cachedContext: { miro_board_id: string } | null = null;
let boardContextPromise: Promise<void> | null = null;
let initialized = false;

/**
 * Initialize PostHog only (no Miro SDK calls).
 * Safe to call from the headless index.ts context.
 */
export function initAnalytics() {
  if (initialized) return;
  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'always',
      capture_performance: false,
      autocapture: false,
      disable_session_recording: true,
    });
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

/**
 * Capture the board context. Must be called from the panel context
 * where miro.board is available. Uses PostHog's anonymous ID for user tracking
 * to avoid requiring the identity:read permission.
 */
export function captureBoardContext() {
  if (boardContextPromise) return boardContextPromise;
  boardContextPromise = (async () => {
    try {
      const boardInfo = await miro.board.getInfo();
      cachedContext = {
        miro_board_id: boardInfo.id,
      };
    } catch (error) {
      console.error('Failed to capture board context:', error);
    }
  })();
  return boardContextPromise;
}

/**
 * Capture an analytics event with base context.
 * No PII is ever included — only structural/behavioral data.
 */
async function captureEvent(eventName: string, properties: Record<string, any> = {}) {
  try {
    // Wait for board context if it's being fetched
    if (boardContextPromise && !cachedContext) {
      await boardContextPromise;
    }
    posthog.capture(eventName, {
      ...cachedContext,
      ...properties,
    });
  } catch (error) {
    console.error(`Failed to capture event ${eventName}:`, error);
  }
}

// --- Event functions ---

export function trackAppOpened() {
  captureEvent(ANALYTICS_EVENTS.APP_OPENED);
}

export function trackCatalogImportedFile() {
  captureEvent(ANALYTICS_EVENTS.CATALOG_IMPORTED_FILE);
}

export function trackCatalogImportedPaste() {
  captureEvent(ANALYTICS_EVENTS.CATALOG_IMPORTED_PASTE);
}

export function trackResourceDroppedToBoard(category: string) {
  captureEvent(ANALYTICS_EVENTS.RESOURCE_DROPPED_TO_BOARD, { category });
}

export function trackNewResourceCreated(category: string) {
  captureEvent(ANALYTICS_EVENTS.NEW_RESOURCE_CREATED, { category });
}

export function trackResourceRemoved(category: string) {
  captureEvent(ANALYTICS_EVENTS.RESOURCE_REMOVED, { category });
}

export function trackResourceEdited(field: string) {
  captureEvent(ANALYTICS_EVENTS.RESOURCE_EDITED, { field });
}

export function trackAutoLayoutUsed() {
  captureEvent(ANALYTICS_EVENTS.AUTO_LAYOUT_USED);
}

export function trackCategorySelected(category: string) {
  captureEvent(ANALYTICS_EVENTS.CATEGORY_SELECTED, { category });
}

export function trackCatalogLoaded(data: any) {
  const resources = data?.resources || {};
  captureEvent(ANALYTICS_EVENTS.CATALOG_LOADED, {
    service_count: resources.services?.length || 0,
    event_count: resources.messages?.events?.length || 0,
    command_count: resources.messages?.commands?.length || 0,
    query_count: resources.messages?.queries?.length || 0,
    channel_count: resources.channels?.length || 0,
    container_count: resources.containers?.length || 0,
    total_resources:
      (resources.services?.length || 0) +
      (resources.messages?.events?.length || 0) +
      (resources.messages?.commands?.length || 0) +
      (resources.messages?.queries?.length || 0) +
      (resources.channels?.length || 0) +
      (resources.containers?.length || 0),
  });
}

export function trackCatalogExported() {
  captureEvent(ANALYTICS_EVENTS.CATALOG_EXPORTED);
}
