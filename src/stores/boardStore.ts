import type { StickyNoteColor } from '@mirohq/websdk-types';
import { $catalogData, resolveOwner } from './catalogStore';
import { $displayType, setSelectedNode } from './uiStore';

// Internal state — cleared on each drop
const createdItemsCache: Map<string, any> = new Map();
const originalEdgeStyles: Map<string, { strokeColor: string; strokeWidth: number }> = new Map();

export function getItemKey(category: string, name: string, version: string): string {
  return `${category}:${name}:${version}`;
}

export function getEdgeLabel(type: string | undefined, direction: 'receive' | 'send'): string {
  if (direction === 'receive') {
    switch (type) {
      case 'events':
        return 'receives event';
      case 'commands':
        return 'accepts';
      case 'queries':
        return 'accepts';
      default:
        return 'receives';
    }
  } else {
    switch (type) {
      case 'events':
        return 'publishes event';
      case 'commands':
        return 'invokes command';
      case 'queries':
        return 'requests';
      default:
        return 'sends';
    }
  }
}

export function getStatusForResource(itemData: any): { type: string; text: string } {
  if (itemData.deprecated) {
    return { type: 'disconnected', text: 'Deprecated' };
  }
  if (itemData.draft) {
    return { type: 'warning', text: 'Draft' };
  }
  return { type: 'connected', text: 'Active' };
}

export async function createBoardItem(
  itemData: {
    name: string;
    version: string;
    summary?: string;
    category?: string;
    owners?: any[];
    badges?: any[];
    deprecated?: boolean;
    draft?: boolean;
  },
  style: any,
  x: number,
  y: number
): Promise<any> {
  const displayType = $displayType.get();

  if (displayType === 'appcard') {
    const fields: any[] = [
      { value: itemData.version, tooltip: 'Version' },
      { value: itemData.category || '', tooltip: 'Category' },
    ];

    if (itemData.owners && itemData.owners.length > 0) {
      const ownerNames = itemData.owners.map((o: any) => resolveOwner(typeof o === 'string' ? o : o.id || o)).join(', ');
      fields.push({ value: ownerNames, tooltip: 'Owners' });
    }

    if (itemData.badges && itemData.badges.length > 0) {
      const badgeText = itemData.badges.map((b: any) => (typeof b === 'string' ? b : b.content || b.name || '')).join(', ');
      fields.push({ value: badgeText, tooltip: 'Badges' });
    }

    const status = getStatusForResource(itemData);

    return miro.board.createAppCard({
      title: itemData.name,
      description: itemData.summary || '',
      style: {
        cardTheme: style.iconColor || style.borderColor || '#000000',
      },
      fields,
      status: status as any,
      x,
      y,
    });
  }

  // Default: sticky note
  return miro.board.createStickyNote({
    content: itemData.name,
    style: {
      fillColor: style.fillColor as StickyNoteColor,
    },
    x,
    y,
  });
}

export function clearItemCache(): void {
  createdItemsCache.clear();
}

export async function findExistingBoardItem(name: string, version: string, category?: string): Promise<any> {
  // Check cache first
  if (category) {
    const key = getItemKey(category, name, version);
    const cached = createdItemsCache.get(key);
    if (cached) return cached;
  }

  // Search the board
  const items = await miro.board.get();

  for (const item of items) {
    if (item.type === 'sticky_note') {
      const content = (item as any).content || '';
      if (content.includes(name) && content.includes(version)) {
        if (category) {
          createdItemsCache.set(getItemKey(category, name, version), item);
        }
        return item;
      }
    }

    if (item.type === 'card' || item.type === 'app_card') {
      const title = (item as any).title || '';
      if (title === name || title.includes(name)) {
        if (category) {
          createdItemsCache.set(getItemKey(category, name, version), item);
        }
        return item;
      }
    }
  }

  return null;
}

export async function getOrCreateBoardItem(itemData: any, style: any, x: number, y: number): Promise<any> {
  const category = itemData.category || '';
  const key = getItemKey(category, itemData.name, itemData.version);

  // Check cache
  const cached = createdItemsCache.get(key);
  if (cached) return cached;

  // Check board
  const existing = await findExistingBoardItem(itemData.name, itemData.version, category);
  if (existing) return existing;

  // Create new
  const newItem = await createBoardItem(itemData, style, x, y);
  createdItemsCache.set(key, newItem);
  return newItem;
}

export async function resolveBoardItemCategory(itemId: string): Promise<string | null> {
  const items = await miro.board.get();
  const item = items.find((i: any) => i.id === itemId);
  if (!item) return null;

  // Extract name from the item
  let name = '';
  if (item.type === 'sticky_note') {
    const content = (item as any).content || '';
    // Extract name from "Name (vX.X.X)" format
    const match = content.match(/^(.+?)\s*\(v/);
    name = match ? match[1].trim() : content.trim();
  } else if (item.type === 'card' || item.type === 'app_card') {
    name = (item as any).title || '';
  }

  if (!name) return null;

  const catalogData = $catalogData.get();
  if (!catalogData?.resources) return null;

  const resourceCategories = [
    { key: 'services', items: catalogData.resources.services || [] },
    { key: 'events', items: catalogData.resources.messages?.events || [] },
    { key: 'commands', items: catalogData.resources.messages?.commands || [] },
    { key: 'queries', items: catalogData.resources.messages?.queries || [] },
    { key: 'channels', items: catalogData.resources.channels || [] },
    { key: 'containers', items: catalogData.resources.containers || [] },
  ];

  for (const { key, items: resources } of resourceCategories) {
    const found = resources.find((r: any) => r.name === name);
    if (found) return key;
  }

  return null;
}

export async function zoomToItem(item: any): Promise<void> {
  await miro.board.viewport.set({
    viewport: {
      x: item.x - 500,
      y: item.y - 500,
      width: 1000,
      height: 1000,
    },
    animationDurationInMs: 300,
  });
}

export async function convertAllBoardItems(): Promise<void> {
  const catalogData = $catalogData.get();
  if (!catalogData?.resources) return;

  const allItems = await miro.board.get();
  const nodes = allItems.filter((i: any) => i.type === 'sticky_note' || i.type === 'card' || i.type === 'app_card');
  const connectors = allItems.filter((i: any) => i.type === 'connector');

  // Build a map of old item id → its connections
  const connectionMap = new Map<string, { starts: any[]; ends: any[] }>();
  for (const conn of connectors) {
    const c = conn as any;
    const startId = c.start?.item;
    const endId = c.end?.item;
    if (startId) {
      if (!connectionMap.has(startId)) connectionMap.set(startId, { starts: [], ends: [] });
      connectionMap.get(startId)!.starts.push(c);
    }
    if (endId) {
      if (!connectionMap.has(endId)) connectionMap.set(endId, { starts: [], ends: [] });
      connectionMap.get(endId)!.ends.push(c);
    }
  }

  // Helper to resolve a board item to catalog resource info
  const resolveItem = (item: any): { name: string; version: string; summary: string; category: string; resource: any } | null => {
    let name = '';
    if (item.type === 'sticky_note') {
      const content = (item as any).content || '';
      const match = content.match(/^(.+?)\s*\(v(.+?)\)/);
      if (match) {
        name = match[1].trim();
      } else {
        name = content.replace(/<[^>]*>/g, '').trim();
      }
    } else {
      name = (item as any).title || '';
    }
    if (!name) return null;

    const resources = catalogData.resources;
    const checks = [
      { items: resources.services || [], category: 'services' },
      { items: resources.messages?.events || [], category: 'events' },
      { items: resources.messages?.commands || [], category: 'commands' },
      { items: resources.messages?.queries || [], category: 'queries' },
      { items: resources.channels || [], category: 'channels' },
      { items: resources.containers || [], category: 'containers' },
    ];

    for (const { items, category } of checks) {
      const found = items.find((r: any) => name.includes(r.name));
      if (found) {
        return { name: found.name, version: found.version, summary: found.summary || '', category, resource: found };
      }
    }
    return null;
  };

  for (const node of nodes) {
    const info = resolveItem(node);
    if (!info) continue;

    const { getCategoryStyles } = await import('../utils/categoryUtils');
    const style = getCategoryStyles(info.category);
    const x = (node as any).x;
    const y = (node as any).y;

    // Create replacement item
    const newItem = await createBoardItem(
      {
        name: info.name,
        version: info.version,
        summary: info.summary,
        category: info.category,
        owners: info.resource.owners,
        badges: info.resource.badges,
      },
      style,
      x,
      y
    );

    // Rewire connectors
    const connections = connectionMap.get(node.id);
    if (connections) {
      for (const conn of connections.starts) {
        conn.start.item = newItem.id;
        await conn.sync();
      }
      for (const conn of connections.ends) {
        conn.end.item = newItem.id;
        await conn.sync();
      }
    }

    // Remove old item
    await miro.board.remove(node);
  }
}

export async function selectItem(itemId: string): Promise<void> {
  // Deselect all currently selected items
  const selectedItems = await miro.board.getSelection();
  if (selectedItems.length > 0) {
    await miro.board.deselect({ id: selectedItems.map((i: any) => i.id) });
  }

  // Select the target item
  await miro.board.select({ id: itemId });
}

export async function handleSelectionUpdate(event: any): Promise<void> {
  const HIGHLIGHT_COLOR = '#7C3AED';
  const HIGHLIGHT_WIDTH = 3;

  // Restore previously highlighted edges
  const allItems = await miro.board.get();
  const connectors = allItems.filter((i: any) => i.type === 'connector');
  const boardNodes = allItems.filter((i: any) => i.type === 'sticky_note' || i.type === 'card' || i.type === 'app_card');

  for (const connector of connectors) {
    const original = originalEdgeStyles.get(connector.id);
    if (original) {
      (connector as any).style.strokeColor = original.strokeColor;
      (connector as any).style.strokeWidth = original.strokeWidth;
      await (connector as any).sync();
    }
  }
  originalEdgeStyles.clear();

  const selectedItems = event.items || [];
  if (selectedItems.length !== 1) {
    setSelectedNode(null);
    return;
  }

  const selected = selectedItems[0];
  const selectedId = selected.id;

  if (selected.type === 'connector') {
    setSelectedNode(null);
    return;
  }

  let name = '';
  let summary = '';
  let nodeType = selected.type;

  if (selected.type === 'sticky_note') {
    name = ((selected as any).content || '').replace(/<[^>]*>/g, '').trim();
  } else if (selected.type === 'card' || selected.type === 'app_card') {
    name = (selected as any).title || '';
    summary = (selected as any).description || '';
  }

  const connectedTo: { name: string; label: string; direction: 'incoming' | 'outgoing'; boardItemId?: string }[] = [];

  for (const connector of connectors) {
    const conn = connector as any;
    const startId = conn.start?.item;
    const endId = conn.end?.item;
    const label = conn.captions?.[0]?.content || '';

    if (startId === selectedId) {
      const targetNode = boardNodes.find((n: any) => n.id === endId);
      if (targetNode) {
        const targetName =
          targetNode.type === 'sticky_note'
            ? ((targetNode as any).content || '').replace(/<[^>]*>/g, '').trim()
            : (targetNode as any).title || '';
        connectedTo.push({ name: targetName, label, direction: 'outgoing', boardItemId: endId });
      }
      originalEdgeStyles.set(connector.id, {
        strokeColor: conn.style?.strokeColor || '#2D9CDB',
        strokeWidth: conn.style?.strokeWidth || 2,
      });
      conn.style.strokeColor = HIGHLIGHT_COLOR;
      conn.style.strokeWidth = HIGHLIGHT_WIDTH;
      await conn.sync();
    } else if (endId === selectedId) {
      const sourceNode = boardNodes.find((n: any) => n.id === startId);
      if (sourceNode) {
        const sourceName =
          sourceNode.type === 'sticky_note'
            ? ((sourceNode as any).content || '').replace(/<[^>]*>/g, '').trim()
            : (sourceNode as any).title || '';
        connectedTo.push({ name: sourceName, label, direction: 'incoming', boardItemId: startId });
      }
      originalEdgeStyles.set(connector.id, {
        strokeColor: conn.style?.strokeColor || '#2D9CDB',
        strokeWidth: conn.style?.strokeWidth || 2,
      });
      conn.style.strokeColor = HIGHLIGHT_COLOR;
      conn.style.strokeWidth = HIGHLIGHT_WIDTH;
      await conn.sync();
    }
  }

  setSelectedNode({ id: selectedId, name, type: nodeType, summary, connectedTo });
}
