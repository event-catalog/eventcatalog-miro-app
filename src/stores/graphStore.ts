import dagre from 'dagre';
import { getCategoryStyles } from '../utils/categoryUtils';
import {
  findMessageDetails,
  findChannelDetails,
  findContainerDetails,
  findProducersOfMessage,
  findConsumersOfMessage,
} from './catalogStore';
import { $showRelatedServices } from './uiStore';
import { getEdgeLabel, getOrCreateBoardItem, clearItemCache, resolveBoardItemCategory } from './boardStore';

// Types
export type GraphNode = { id: string; data: any; style: any; category: string };
export type GraphEdge = {
  source: string;
  target: string;
  label: string;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: string;
  bidirectional?: boolean;
};

// Constants
export const NODE_WIDTH = 250;
export const NODE_HEIGHT = 150;
export const DAGRE_CONFIG = { rankdir: 'LR', ranksep: 400, nodesep: 150, edgesep: 100, align: 'UL' };

/**
 * Builds the complete graph (nodes + edges) for a service drop.
 */
export function buildServiceGraph(itemData: any): { nodes: Map<string, GraphNode>; edges: GraphEdge[] } {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const addNode = (id: string, data: any, style: any, category: string) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, data, style, category });
    }
  };

  const addEdge = (
    source: string,
    target: string,
    label: string,
    strokeColor: string = '#2D9CDB',
    strokeWidth: number = 2,
    strokeStyle: string = 'normal',
    bidirectional: boolean = false
  ) => {
    edges.push({ source, target, label, strokeColor, strokeWidth, strokeStyle, bidirectional });
  };

  const { name, version } = itemData;
  const serviceId = `services:${name}:${version}`;
  const serviceStyle = getCategoryStyles('services');
  addNode(serviceId, itemData, serviceStyle, 'services');

  // Only add dependencies if the toggle is on
  if ($showRelatedServices.get()) {
    // Process receives
    const receives = itemData.receives || [];
    for (const recv of receives) {
      const msgDetails = findMessageDetails(recv.id);
      if (!msgDetails) continue;

      const msgCategory = msgDetails.type || 'events';
      const msgId = `${msgCategory}:${msgDetails.name}:${msgDetails.version}`;
      const msgStyle = getCategoryStyles(msgCategory);
      addNode(msgId, { ...msgDetails, category: msgCategory }, msgStyle, msgCategory);

      const edgeLabel = getEdgeLabel(msgDetails.type, 'receive');

      // Check for channels (from property on the receive)
      const fromChannels = recv.from || [];
      if (fromChannels.length > 0) {
        for (const ch of fromChannels) {
          const channelId = typeof ch === 'string' ? ch : ch.id;
          const channelDetails = findChannelDetails(channelId);
          if (channelDetails) {
            const chNodeId = `channels:${channelDetails.name}:${channelDetails.version}`;
            const chStyle = getCategoryStyles('channels');
            addNode(chNodeId, { ...channelDetails, category: 'channels' }, chStyle, 'channels');

            // message → channel → service
            addEdge(msgId, chNodeId, edgeLabel, '#9CA3AF');
            addEdge(chNodeId, serviceId, edgeLabel, '#9CA3AF');
          }
        }
      } else {
        // Direct: message → service
        addEdge(msgId, serviceId, edgeLabel);
      }
    }

    // Process sends
    const sends = itemData.sends || [];
    for (const sent of sends) {
      const msgDetails = findMessageDetails(sent.id);
      if (!msgDetails) continue;

      const msgCategory = msgDetails.type || 'events';
      const msgId = `${msgCategory}:${msgDetails.name}:${msgDetails.version}`;
      const msgStyle = getCategoryStyles(msgCategory);
      addNode(msgId, { ...msgDetails, category: msgCategory }, msgStyle, msgCategory);

      const edgeLabel = getEdgeLabel(msgDetails.type, 'send');

      const toChannels = sent.to || [];
      if (toChannels.length > 0) {
        for (const ch of toChannels) {
          const channelId = typeof ch === 'string' ? ch : ch.id;
          const channelDetails = findChannelDetails(channelId);
          if (channelDetails) {
            const chNodeId = `channels:${channelDetails.name}:${channelDetails.version}`;
            const chStyle = getCategoryStyles('channels');
            addNode(chNodeId, { ...channelDetails, category: 'channels' }, chStyle, 'channels');

            // service → channel → message
            addEdge(serviceId, chNodeId, edgeLabel, '#9CA3AF');
            addEdge(chNodeId, msgId, edgeLabel, '#9CA3AF');
          }
        }
      } else {
        // Direct: service → message
        addEdge(serviceId, msgId, edgeLabel);
      }
    }

    // Process writesTo / readsFrom containers
    const writesTo = itemData.writesTo || [];
    const readsFrom = itemData.readsFrom || [];

    const writesSet = new Set(writesTo.map((c: any) => (typeof c === 'string' ? c : c.id)));
    const readsSet = new Set(readsFrom.map((c: any) => (typeof c === 'string' ? c : c.id)));

    const allContainerIds = new Set([...writesSet, ...readsSet]);

    for (const containerId of allContainerIds) {
      const containerDetails = findContainerDetails(containerId as string);
      if (!containerDetails) continue;

      const containerNodeId = `containers:${containerDetails.name}:${containerDetails.version}`;
      const containerStyle = getCategoryStyles('containers');
      addNode(containerNodeId, { ...containerDetails, category: 'containers' }, containerStyle, 'containers');

      const tech = containerDetails.technology ? ` (${containerDetails.technology})` : '';

      if (writesSet.has(containerId) && readsSet.has(containerId)) {
        // Bidirectional
        addEdge(serviceId, containerNodeId, `reads & writes${tech}`, '#8B5CF6', 2, 'normal', true);
      } else if (writesSet.has(containerId)) {
        addEdge(serviceId, containerNodeId, `writes to${tech}`, '#8B5CF6');
      } else {
        addEdge(containerNodeId, serviceId, `reads from${tech}`, '#8B5CF6');
      }
    }

    // Related services
    for (const recv of receives) {
      const producers = findProducersOfMessage(recv.id);
      for (const producer of producers) {
        if (producer.name === name && producer.version === version) continue;
        const producerId = `services:${producer.name}:${producer.version}`;
        const producerStyle = getCategoryStyles('services');
        addNode(producerId, { ...producer, category: 'services' }, producerStyle, 'services');

        const msgDetails = findMessageDetails(recv.id);
        if (msgDetails) {
          const msgCategory = msgDetails.type || 'events';
          const msgId = `${msgCategory}:${msgDetails.name}:${msgDetails.version}`;
          const edgeLabel = getEdgeLabel(msgDetails.type, 'send');
          addEdge(producerId, msgId, edgeLabel);
        }
      }
    }

    for (const sent of sends) {
      const consumers = findConsumersOfMessage(sent.id);
      for (const consumer of consumers) {
        if (consumer.name === name && consumer.version === version) continue;
        const consumerId = `services:${consumer.name}:${consumer.version}`;
        const consumerStyle = getCategoryStyles('services');
        addNode(consumerId, { ...consumer, category: 'services' }, consumerStyle, 'services');

        const msgDetails = findMessageDetails(sent.id);
        if (msgDetails) {
          const msgCategory = msgDetails.type || 'events';
          const msgId = `${msgCategory}:${msgDetails.name}:${msgDetails.version}`;
          const edgeLabel = getEdgeLabel(msgDetails.type, 'receive');
          addEdge(msgId, consumerId, edgeLabel);
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Runs dagre layout on the graph and returns a map of nodeId → {x, y} positions.
 */
export function runDagreLayout(nodes: Map<string, GraphNode>, edges: GraphEdge[]): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph(DAGRE_CONFIG);
  g.setDefaultEdgeLabel(() => ({}));

  for (const [id] of nodes) {
    g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const [id] of nodes) {
    const nodeInfo = g.node(id);
    positions.set(id, { x: nodeInfo.x, y: nodeInfo.y });
  }

  return positions;
}

/**
 * Creates all board items and connectors from graph data.
 */
export async function renderGraphToBoard(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
  positions: Map<string, { x: number; y: number }>,
  offsetX: number,
  offsetY: number
): Promise<void> {
  const boardItems = new Map<string, any>();

  // Create nodes sequentially to avoid race conditions
  for (const [id, node] of nodes) {
    const pos = positions.get(id);
    if (!pos) continue;

    const item = await getOrCreateBoardItem(
      { ...node.data, category: node.category },
      node.style,
      pos.x + offsetX,
      pos.y + offsetY
    );
    boardItems.set(id, item);
  }

  // Create connectors
  for (const edge of edges) {
    const startItem = boardItems.get(edge.source);
    const endItem = boardItems.get(edge.target);
    if (!startItem || !endItem) continue;

    const connectorData: any = {
      shape: 'elbowed',
      start: {
        item: startItem.id,
        position: { x: 1, y: 0.5 },
      },
      end: {
        item: endItem.id,
        position: { x: 0, y: 0.5 },
      },
      style: {
        strokeColor: edge.strokeColor,
        strokeWidth: edge.strokeWidth,
        strokeStyle: edge.strokeStyle,
        startStrokeCap: edge.bidirectional ? 'stealth' : 'none',
        endStrokeCap: 'stealth',
      },
      captions: [{ content: edge.label }],
    };

    await miro.board.createConnector(connectorData);
  }
}

/**
 * Orchestrates the full service drop: clear cache, build graph, layout, render.
 */
export async function handleServiceDrop(itemData: any, x: number, y: number): Promise<void> {
  clearItemCache();
  const { nodes, edges } = buildServiceGraph(itemData);
  const positions = runDagreLayout(nodes, edges);
  await renderGraphToBoard(nodes, edges, positions, x, y);
}

/**
 * Auto-layouts all existing board items using dagre.
 */
export async function autoLayoutBoard(): Promise<void> {
  const allItems = await miro.board.get({ type: ['sticky_note', 'card', 'app_card'] });
  const connectors = await miro.board.get({ type: ['connector'] });

  if (allItems.length === 0) return;

  const g = new dagre.graphlib.Graph();
  g.setGraph(DAGRE_CONFIG);
  g.setDefaultEdgeLabel(() => ({}));

  // Add all items as nodes
  for (const item of allItems) {
    g.setNode(item.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Add connectors as edges
  for (const conn of connectors) {
    const c = conn as any;
    if (c.start?.item && c.end?.item) {
      g.setEdge(c.start.item, c.end.item);
    }
  }

  dagre.layout(g);

  // Compute current center
  let sumX = 0;
  let sumY = 0;
  for (const item of allItems) {
    sumX += (item as any).x || 0;
    sumY += (item as any).y || 0;
  }
  const centerX = sumX / allItems.length;
  const centerY = sumY / allItems.length;

  // Compute layout center
  let layoutSumX = 0;
  let layoutSumY = 0;
  for (const item of allItems) {
    const nodeInfo = g.node(item.id);
    layoutSumX += nodeInfo.x;
    layoutSumY += nodeInfo.y;
  }
  const layoutCenterX = layoutSumX / allItems.length;
  const layoutCenterY = layoutSumY / allItems.length;

  const offsetX = centerX - layoutCenterX;
  const offsetY = centerY - layoutCenterY;

  // Reposition all items
  for (const item of allItems) {
    const nodeInfo = g.node(item.id);
    (item as any).x = nodeInfo.x + offsetX;
    (item as any).y = nodeInfo.y + offsetY;
    await (item as any).sync();
  }

  // Zoom to fit all items
  await miro.board.viewport.zoomTo(allItems);
}

/**
 * Handles connector creation events — sets labels, styling, and shape.
 */
export async function handleConnectorCreated(event: any): Promise<void> {
  const items = event.items || [];

  for (const item of items) {
    if (item.type !== 'connector') continue;

    const connector = item as any;
    const startId = connector.start?.item;
    const endId = connector.end?.item;

    if (!startId || !endId) continue;

    const startCategory = await resolveBoardItemCategory(startId);
    const endCategory = await resolveBoardItemCategory(endId);

    // Determine label and stroke color based on category pairs
    let label = '';
    let strokeColor = '#2D9CDB';

    if (startCategory === 'services' && (endCategory === 'events' || endCategory === 'commands' || endCategory === 'queries')) {
      label = getEdgeLabel(endCategory, 'send');
      strokeColor = '#2D9CDB';
    } else if (
      (startCategory === 'events' || startCategory === 'commands' || startCategory === 'queries') &&
      endCategory === 'services'
    ) {
      label = getEdgeLabel(startCategory, 'receive');
      strokeColor = '#2D9CDB';
    } else if (startCategory === 'services' && endCategory === 'channels') {
      label = 'publishes to';
      strokeColor = '#9CA3AF';
    } else if (startCategory === 'channels' && endCategory === 'services') {
      label = 'subscribes from';
      strokeColor = '#9CA3AF';
    } else if (
      (startCategory === 'events' || startCategory === 'commands' || startCategory === 'queries') &&
      endCategory === 'channels'
    ) {
      label = 'routed through';
      strokeColor = '#9CA3AF';
    } else if (
      startCategory === 'channels' &&
      (endCategory === 'events' || endCategory === 'commands' || endCategory === 'queries')
    ) {
      label = 'delivers';
      strokeColor = '#9CA3AF';
    } else if (startCategory === 'services' && endCategory === 'containers') {
      label = 'writes to';
      strokeColor = '#8B5CF6';
    } else if (startCategory === 'containers' && endCategory === 'services') {
      label = 'reads from';
      strokeColor = '#8B5CF6';
    } else if (startCategory === 'services' && endCategory === 'services') {
      label = 'connects to';
      strokeColor = '#2D9CDB';
    }

    connector.captions = [{ content: label }];
    connector.shape = 'elbowed';
    connector.style = {
      ...connector.style,
      strokeColor,
      endStrokeCap: 'stealth',
    };

    await connector.sync();
  }
}
