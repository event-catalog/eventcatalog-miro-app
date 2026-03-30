import { atom, computed } from 'nanostores';

// State atoms
const getInitialData = (): any => {
  try {
    const stored = localStorage.getItem('eventcatalog-data');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const $catalogData = atom<any>(getInitialData());

// Computed stores
export const $services = computed($catalogData, (catalogData) => catalogData?.resources?.services || []);
export const $events = computed($catalogData, (catalogData) => catalogData?.resources?.messages?.events || []);
export const $commands = computed($catalogData, (catalogData) => catalogData?.resources?.messages?.commands || []);
export const $queries = computed($catalogData, (catalogData) => catalogData?.resources?.messages?.queries || []);
export const $channels = computed($catalogData, (catalogData) => catalogData?.resources?.channels || []);
export const $containers = computed($catalogData, (catalogData) => catalogData?.resources?.containers || []);

// Actions
export function setCatalogData(data: any) {
  $catalogData.set(data);
  if (data === null) {
    localStorage.removeItem('eventcatalog-data');
  } else {
    localStorage.setItem('eventcatalog-data', JSON.stringify(data));
  }
}

export function addService(service: any) {
  addResource('services', service);
}

export function addResource(category: string, resource: any) {
  const current = $catalogData.get();
  const path = getResourcePath(category);
  const items = getResourceArray(current?.resources, path);
  const updated = { ...current, resources: setResourceArray(current?.resources, path, [resource, ...items]) };
  setCatalogData(updated);
}

// Helper to get the resource array path for a given category
function getResourcePath(category: string): string[] {
  switch (category) {
    case 'Service':
    case 'services':
      return ['services'];
    case 'Event':
    case 'events':
      return ['messages', 'events'];
    case 'Command':
    case 'commands':
      return ['messages', 'commands'];
    case 'Query':
    case 'queries':
      return ['messages', 'queries'];
    case 'Channel':
    case 'channels':
      return ['channels'];
    case 'Data Store':
    case 'containers':
      return ['containers'];
    default:
      return ['services'];
  }
}

function getResourceArray(resources: any, path: string[]): any[] {
  let current = resources;
  for (const key of path) {
    current = current?.[key];
  }
  return current || [];
}

function setResourceArray(resources: any, path: string[], value: any[]): any {
  if (path.length === 1) {
    return { ...resources, [path[0]]: value };
  }
  return { ...resources, [path[0]]: { ...resources?.[path[0]], [path[1]]: value } };
}

export function updateResource(
  category: string,
  id: string,
  version: string,
  updates: Partial<{ name: string; version: string; summary: string }>
) {
  const current = $catalogData.get();
  const path = getResourcePath(category);
  const items = getResourceArray(current?.resources, path);
  let updatedItem: any = undefined;

  const updatedItems = items.map((item: any) => {
    if (item.id === id && item.version === version) {
      updatedItem = { ...item, ...updates };
      return updatedItem;
    }
    return item;
  });

  setCatalogData({ ...current, resources: setResourceArray(current?.resources, path, updatedItems) });
  return updatedItem;
}

// Keep backward compat alias
export const updateService = (
  id: string,
  version: string,
  updates: Partial<{ name: string; version: string; summary: string }>
) => updateResource('services', id, version, updates);

export function addBadgeToService(id: string, version: string, badgeContent: string) {
  const current = $catalogData.get();
  // Search across all resource types
  const allPaths = [
    ['services'],
    ['messages', 'events'],
    ['messages', 'commands'],
    ['messages', 'queries'],
    ['channels'],
    ['containers'],
  ];
  for (const path of allPaths) {
    const items = getResourceArray(current?.resources, path);
    const idx = items.findIndex((item: any) => item.id === id && item.version === version);
    if (idx !== -1) {
      const updated = [...items];
      updated[idx] = {
        ...updated[idx],
        badges: [...(updated[idx].badges || []), { content: badgeContent, backgroundColor: 'blue', textColor: 'blue' }],
      };
      setCatalogData({ ...current, resources: setResourceArray(current?.resources, path, updated) });
      return;
    }
  }
}

export function removeBadgeFromService(id: string, version: string, badgeIndex: number) {
  const current = $catalogData.get();
  const allPaths = [
    ['services'],
    ['messages', 'events'],
    ['messages', 'commands'],
    ['messages', 'queries'],
    ['channels'],
    ['containers'],
  ];
  for (const path of allPaths) {
    const items = getResourceArray(current?.resources, path);
    const idx = items.findIndex((item: any) => item.id === id && item.version === version);
    if (idx !== -1) {
      const updated = [...items];
      const badges = [...(updated[idx].badges || [])];
      badges.splice(badgeIndex, 1);
      updated[idx] = { ...updated[idx], badges };
      setCatalogData({ ...current, resources: setResourceArray(current?.resources, path, updated) });
      return;
    }
  }
}

export function removeResource(category: string, id: string, version: string) {
  const current = $catalogData.get();
  if (!current?.resources) return;

  const updated = { ...current, resources: { ...current.resources } };

  switch (category) {
    case 'services':
      updated.resources.services = (updated.resources.services || []).filter((s: any) => !(s.id === id && s.version === version));
      break;
    case 'events':
      updated.resources.messages = {
        ...updated.resources.messages,
        events: (updated.resources.messages?.events || []).filter((e: any) => !(e.id === id && e.version === version)),
      };
      break;
    case 'commands':
      updated.resources.messages = {
        ...updated.resources.messages,
        commands: (updated.resources.messages?.commands || []).filter((c: any) => !(c.id === id && c.version === version)),
      };
      break;
    case 'queries':
      updated.resources.messages = {
        ...updated.resources.messages,
        queries: (updated.resources.messages?.queries || []).filter((q: any) => !(q.id === id && q.version === version)),
      };
      break;
    case 'channels':
      updated.resources.channels = (updated.resources.channels || []).filter((c: any) => !(c.id === id && c.version === version));
      break;
    case 'containers':
      updated.resources.containers = (updated.resources.containers || []).filter(
        (c: any) => !(c.id === id && c.version === version)
      );
      break;
  }

  setCatalogData(updated);
}

// Query functions
export function findMessageDetails(id: string) {
  const catalogData = $catalogData.get();
  const messages = catalogData?.resources?.messages;
  if (!messages) return undefined;

  const types = ['events', 'commands', 'queries'] as const;
  for (const type of types) {
    const found = (messages[type] || []).find((m: any) => m.id === id);
    if (found) {
      return { name: found.name, version: found.version, summary: found.summary, type };
    }
  }
  return undefined;
}

export function findChannelDetails(id: string) {
  const catalogData = $catalogData.get();
  const channels = catalogData?.resources?.channels || [];
  const found = channels.find((c: any) => c.id === id);
  if (!found) return undefined;
  return { name: found.name, version: found.version, summary: found.summary, routes: found.routes };
}

export function findContainerDetails(id: string) {
  const catalogData = $catalogData.get();
  const containers = catalogData?.resources?.containers || [];
  const found = containers.find((c: any) => c.id === id);
  if (!found) return undefined;
  return {
    name: found.name,
    version: found.version,
    summary: found.summary,
    technology: found.technology,
    container_type: found.container_type,
  };
}

export function findProducersOfMessage(messageId: string) {
  const catalogData = $catalogData.get();
  const services = catalogData?.resources?.services || [];
  return services.filter((s: any) => (s.sends || []).some((msg: any) => msg.id === messageId));
}

export function findConsumersOfMessage(messageId: string) {
  const catalogData = $catalogData.get();
  const services = catalogData?.resources?.services || [];
  return services.filter((s: any) => (s.receives || []).some((msg: any) => msg.id === messageId));
}

export function resolveOwner(id: string) {
  const catalogData = $catalogData.get();
  const users = catalogData?.resources?.users || [];
  const teams = catalogData?.resources?.teams || [];

  const user = users.find((u: any) => u.id === id);
  if (user) return user.name;

  const team = teams.find((t: any) => t.id === id);
  if (team) return team.name;

  return id;
}

export function getChannelChain(sourceId: string, targetId: string, visited: Set<string> = new Set()): any[] {
  if (visited.has(sourceId)) return [];
  visited.add(sourceId);

  const catalogData = $catalogData.get();
  const channels = catalogData?.resources?.channels || [];

  for (const channel of channels) {
    const routes = channel.routes || [];
    for (const route of routes) {
      if (route.from === sourceId && route.to === targetId) {
        return [channel];
      }
      if (route.from === sourceId) {
        const rest = getChannelChain(route.to, targetId, visited);
        if (rest.length > 0) {
          return [channel, ...rest];
        }
      }
    }
  }

  return [];
}
