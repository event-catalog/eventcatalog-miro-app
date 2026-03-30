import React, { useMemo, memo } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@nanostores/react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  Search,
  Server,
  Zap,
  MessageSquare,
  SearchIcon,
  ArrowLeftRight,
  GripVertical,
  User,
  Crosshair,
  LayoutGrid,
  Database,
  Pencil,
  Check,
  X,
  Trash2,
  Download,
} from 'lucide-react';
import Footer from '../components/Footer';
import { CategoryType, Resource, StyleResult } from '../utils/types';
import { getIconForCategory, getCategoryStyles } from '../utils/categoryUtils';
import {
  $catalogData,
  setCatalogData,
  addResource,
  updateResource,
  resolveOwner,
  removeResource,
  addBadgeToService,
  removeBadgeFromService,
} from '../stores/catalogStore';
import {
  $displayType,
  $activeCategory,
  $searchTerm,
  $showRelatedServices,
  $selectedNode,
  $editingField,
  $editValue,
  $isLayouting,
  setDisplayType,
  setActiveCategory,
  setSearchTerm,
  setShowRelatedServices,
  setSelectedNode,
  startEdit,
  cancelEdit,
  setIsLayouting,
} from '../stores/uiStore';
import {
  createBoardItem,
  findExistingBoardItem,
  zoomToItem,
  selectItem,
  handleSelectionUpdate,
  convertAllBoardItems,
} from '../stores/boardStore';
import { handleServiceDrop, autoLayoutBoard, handleConnectorCreated } from '../stores/graphStore';

// Resource item for the drill-down list
interface ResourceItemProps {
  resource: Resource;
  category: CategoryType;
  styles: StyleResult;
}

const ResourceItem = memo(({ resource, category, styles }: ResourceItemProps) => {
  const itemData = useMemo(
    () => ({
      id: `${category}-${resource.id}`,
      type: 'sticky',
      category,
      name: resource.name,
      version: resource.version,
      owners: resource.owners,
      badges: resource.badges,
      summary: resource.summary || resource.description || '',
      deprecated: (resource as any).deprecated,
      draft: (resource as any).draft,
      style: styles,
      receives: resource.receives || [],
      sends: resource.sends || [],
      writesTo: (resource as any).writesTo || [],
      readsFrom: (resource as any).readsFrom || [],
    }),
    [category, resource, styles]
  );

  const handleZoomTo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const found = await findExistingBoardItem(resource.name, resource.version, category);
    if (found) {
      await zoomToItem(found);
    }
  };

  const summary = resource.summary || resource.description || '';

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-grab select-none text-sm font-medium text-gray-900 hover:-translate-y-[1px] hover:shadow-sm transition-all duration-200 miro-draggable bg-white group ${(resource as any)._draft ? 'animate-slide-in' : ''}`}
      style={{ border: `1.5px solid ${styles.borderColor}` }}
      data-item={JSON.stringify(itemData)}
    >
      <span className="flex items-center justify-center mt-0.5" style={{ color: styles.iconColor }}>
        {getIconForCategory(category)}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block truncate text-gray-900">{resource.name}</span>
        <span className="block text-xs text-gray-600 font-normal">v{resource.version}</span>
        {summary && <span className="block text-xs text-gray-500 font-normal mt-1 line-clamp-2 leading-relaxed">{summary}</span>}
        {resource.owners && resource.owners.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <User className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 font-normal truncate">
              {resource.owners.map((o: any) => resolveOwner(typeof o === 'string' ? o : o.id || o)).join(', ')}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={handleZoomTo}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded shrink-0 mt-0.5"
        title="Find on board"
      >
        <Crosshair className="w-3.5 h-3.5 text-gray-400" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeResource(category, resource.id, resource.version);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded shrink-0 mt-0.5"
        title="Remove from list"
      >
        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
      </button>
      <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
    </div>
  );
});

const ResourceList = () => {
  const navigate = useNavigate();
  const catalogData = useStore($catalogData);
  const displayType = useStore($displayType);
  const activeCategory = useStore($activeCategory);
  const searchTerm = useStore($searchTerm);
  const showRelatedServices = useStore($showRelatedServices);
  const selectedNode = useStore($selectedNode);
  const editingField = useStore($editingField);
  const editValue = useStore($editValue);
  const isLayouting = useStore($isLayouting);
  const [isResolvingSelection, setIsResolvingSelection] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get('selectedNodeId');
  });

  const categoryConfig = useMemo(
    () => [
      {
        key: 'services' as CategoryType,
        title: 'Services',
        icon: <Server className="w-5 h-5" />,
        color: '#EC4899',
        bgColor: '#FDF2F8',
        borderColor: '#FBCFE8',
      },
      {
        key: 'events' as CategoryType,
        title: 'Events',
        icon: <Zap className="w-5 h-5" />,
        color: '#F97316',
        bgColor: '#FFF7ED',
        borderColor: '#FED7AA',
      },
      {
        key: 'commands' as CategoryType,
        title: 'Commands',
        icon: <MessageSquare className="w-5 h-5" />,
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        borderColor: '#BFDBFE',
      },
      {
        key: 'queries' as CategoryType,
        title: 'Queries',
        icon: <SearchIcon className="w-5 h-5" />,
        color: '#22C55E',
        bgColor: '#F0FDF4',
        borderColor: '#BBF7D0',
      },
      {
        key: 'channels' as CategoryType,
        title: 'Channels',
        icon: <ArrowLeftRight className="w-5 h-5" />,
        color: '#6B7280',
        bgColor: '#F9FAFB',
        borderColor: '#E5E7EB',
      },
      {
        key: 'containers' as CategoryType,
        title: 'Data Stores',
        icon: <Database className="w-5 h-5" />,
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        borderColor: '#DDD6FE',
      },
    ],
    []
  );

  const getResources = (category: CategoryType): Resource[] => {
    if (!catalogData?.resources) return [];
    switch (category) {
      case 'services':
        return catalogData.resources.services || [];
      case 'events':
        return catalogData.resources.messages?.events || [];
      case 'commands':
        return catalogData.resources.messages?.commands || [];
      case 'queries':
        return catalogData.resources.messages?.queries || [];
      case 'channels':
        return catalogData.resources.channels || [];
      case 'containers':
        return catalogData.resources.containers || [];
      default:
        return [];
    }
  };

  const filteredResources = useMemo(() => {
    if (!activeCategory) return [];
    const resources = getResources(activeCategory);
    if (!searchTerm) return resources;
    const term = searchTerm.toLowerCase();
    return resources.filter((r) => r.name.toLowerCase().includes(term) || r.summary?.toLowerCase().includes(term));
  }, [activeCategory, catalogData, searchTerm]);

  React.useEffect(() => {
    const dropHandler = async ({ x, y, target }: any) => {
      const itemData = JSON.parse(target.getAttribute('data-item') || '{}');

      // If dragging a category card from the dashboard, create a new resource
      if (itemData._isNewDrag) {
        const newResource: any = {
          id: `new-${itemData.category}-${crypto.randomUUID()}`,
          name: itemData.name,
          version: itemData.version,
          summary: '',
          owners: [],
          badges: [],
          _draft: true,
        };
        if (itemData.category === 'services') {
          newResource.receives = [];
          newResource.sends = [];
          newResource.writesTo = [];
          newResource.readsFrom = [];
        }
        const boardItem = await createBoardItem(
          { name: itemData.name, version: itemData.version, summary: '', category: itemData.category, owners: [], badges: [] },
          itemData.style,
          x,
          y
        );
        newResource.boardItemId = boardItem.id;
        addResource(itemData.category, newResource);
        return;
      }

      if (itemData.category === 'services') {
        await handleServiceDrop(itemData, x, y);
      } else {
        await createBoardItem(itemData, itemData.style, x, y);
      }
    };
    const handleItemsDeleted = (event: any) => {
      const deletedItems = event.items || [];
      const currentData = $catalogData.get();
      if (!currentData?.resources) return;

      for (const item of deletedItems) {
        // Find and remove any resource that has this board item ID
        const allCategories = ['services', 'events', 'commands', 'queries', 'channels', 'containers'] as const;
        for (const category of allCategories) {
          const path =
            category === 'events' || category === 'commands' || category === 'queries'
              ? currentData.resources.messages?.[category]
              : currentData.resources[category];
          const resource = (path || []).find((r: any) => r.boardItemId === item.id);
          if (resource) {
            removeResource(category, resource.id, resource.version);
            break;
          }
        }
      }
      setSelectedNode(null);
    };
    const init = async () => {
      await miro.board.ui.on('drop', dropHandler);
      await miro.board.ui.on('selection:update', handleSelectionUpdate);
      await miro.board.ui.on('items:create', handleConnectorCreated);
      await miro.board.ui.on('items:delete', handleItemsDeleted);

      // Check if panel was opened with a specific node selected (via URL param from index.ts)
      const params = new URLSearchParams(window.location.search);
      const selectedNodeId = params.get('selectedNodeId');
      if (selectedNodeId) {
        const currentSelection = await miro.board.getSelection();
        if (currentSelection.length > 0) {
          await handleSelectionUpdate({ items: currentSelection } as any);
        }
        setIsResolvingSelection(false);
      } else {
        // Check if there's already a selected item
        const currentSelection = await miro.board.getSelection();
        if (currentSelection.length > 0) {
          await handleSelectionUpdate({ items: currentSelection } as any);
        }
      }
    };
    init();
    return () => {
      miro.board.ui.off('drop', dropHandler);
      miro.board.ui.off('selection:update', handleSelectionUpdate);
      miro.board.ui.off('items:create', handleConnectorCreated);
      miro.board.ui.off('items:delete', handleItemsDeleted);
    };
  }, [catalogData, navigate]);

  // Show nothing while resolving a node selection from URL params (prevents flash)
  if (isResolvingSelection) {
    return <div className="h-screen bg-white" />;
  }

  const handleAutoLayout = async () => {
    setIsLayouting(true);
    try {
      await autoLayoutBoard();
    } finally {
      setIsLayouting(false);
    }
  };

  // Selected node detail view
  if (selectedNode) {
    const incoming = selectedNode.connectedTo.filter((c) => c.direction === 'incoming');
    const outgoing = selectedNode.connectedTo.filter((c) => c.direction === 'outgoing');

    // Try to match to a catalog resource for richer info
    // First try exact match by boardItemId (Miro board item ID), then fall back to name matching
    let matchedResource: any = null;
    let matchedCategory = '';

    const findByBoardItemId = (items: any[], category: string) => {
      const found = items?.find((r: any) => r.boardItemId === selectedNode.id);
      if (found) {
        matchedResource = found;
        matchedCategory = category;
      }
    };
    const findByName = (items: any[], category: string) => {
      const found = items?.find((r: any) => selectedNode.name.includes(r.name));
      if (found) {
        matchedResource = found;
        matchedCategory = category;
      }
    };

    // Try boardItemId first
    findByBoardItemId(catalogData?.resources?.services || [], 'Service');
    if (!matchedResource) findByBoardItemId(catalogData?.resources?.messages?.events || [], 'Event');
    if (!matchedResource) findByBoardItemId(catalogData?.resources?.messages?.commands || [], 'Command');
    if (!matchedResource) findByBoardItemId(catalogData?.resources?.messages?.queries || [], 'Query');
    if (!matchedResource) findByBoardItemId(catalogData?.resources?.channels || [], 'Channel');
    if (!matchedResource) findByBoardItemId(catalogData?.resources?.containers || [], 'Data Store');

    // Fall back to name matching for resources imported without boardItemId
    if (!matchedResource) findByName(catalogData?.resources?.services || [], 'Service');
    if (!matchedResource) findByName(catalogData?.resources?.messages?.events || [], 'Event');
    if (!matchedResource) findByName(catalogData?.resources?.messages?.commands || [], 'Command');
    if (!matchedResource) findByName(catalogData?.resources?.messages?.queries || [], 'Query');
    if (!matchedResource) findByName(catalogData?.resources?.channels || [], 'Channel');
    if (!matchedResource) findByName(catalogData?.resources?.containers || [], 'Data Store');
    // Resolve a connected item's name to its category info
    const resolveConnectedCategory = (name: string): { category: string; color: string; icon: React.ReactNode } => {
      if (catalogData?.resources?.services?.find((s: any) => name.includes(s.name))) {
        return { category: 'Service', color: '#EC4899', icon: <Server className="w-3.5 h-3.5" /> };
      }
      if (catalogData?.resources?.messages?.events?.find((e: any) => name.includes(e.name))) {
        return { category: 'Event', color: '#F97316', icon: <Zap className="w-3.5 h-3.5" /> };
      }
      if (catalogData?.resources?.messages?.commands?.find((c: any) => name.includes(c.name))) {
        return { category: 'Command', color: '#3B82F6', icon: <MessageSquare className="w-3.5 h-3.5" /> };
      }
      if (catalogData?.resources?.messages?.queries?.find((q: any) => name.includes(q.name))) {
        return { category: 'Query', color: '#22C55E', icon: <SearchIcon className="w-3.5 h-3.5" /> };
      }
      if (catalogData?.resources?.channels?.find((ch: any) => name.includes(ch.name))) {
        return { category: 'Channel', color: '#6B7280', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> };
      }
      if (catalogData?.resources?.containers?.find((c: any) => name.includes(c.name))) {
        return { category: 'Data Store', color: '#8B5CF6', icon: <Database className="w-3.5 h-3.5" /> };
      }
      return { category: 'Resource', color: '#6B7280', icon: <Server className="w-3.5 h-3.5" /> };
    };

    const handleConnectedItemClick = async (name: string, boardItemId?: string) => {
      if (boardItemId) {
        const allItems = await miro.board.get();
        const found = allItems.find((item: any) => item.id === boardItemId);
        if (found) {
          await zoomToItem(found);
          await selectItem(found.id);
          return;
        }
      }
      // Fall back to name-based search for items without a boardItemId
      const found = await findExistingBoardItem(name, '');
      if (found) {
        await zoomToItem(found);
        await selectItem(found.id);
      }
    };

    const saveEdit = async () => {
      if (!editingField || !matchedResource || !catalogData) return;

      const updates: Partial<{ name: string; version: string; summary: string }> = {};
      if (editingField === 'name') updates.name = $editValue.get().trim();
      if (editingField === 'version') updates.version = $editValue.get().trim();
      if (editingField === 'summary') updates.summary = $editValue.get().trim();

      updateResource(matchedCategory, matchedResource.id, matchedResource.version, updates);

      // Also update the board item if it exists — match by exact Miro board item ID
      const boardItemId = matchedResource.boardItemId || selectedNode.id;
      const boardItems = await miro.board.get();
      const boardItem = boardItems.find((item: any) => item.id === boardItemId);
      if (boardItem) {
        if (boardItem.type === 'card' || boardItem.type === 'app_card') {
          if (editingField === 'name') (boardItem as any).title = $editValue.get().trim();
          if (editingField === 'summary') (boardItem as any).description = $editValue.get().trim();
          await (boardItem as any).sync();
        }
        if (boardItem.type === 'sticky_note') {
          if (editingField === 'name') {
            const content = (boardItem as any).content || '';
            (boardItem as any).content = content.replace(matchedResource.name, $editValue.get().trim());
            await (boardItem as any).sync();
          }
        }
      }

      cancelEdit();
    };

    const categoryKey = (matchedCategory.toLowerCase() + 's') as CategoryType;
    const detailCategoryConfig = categoryConfig.find((c) => c.key === categoryKey);
    const detailColor = detailCategoryConfig?.color || '#6B7280';
    const detailIcon = detailCategoryConfig?.icon || <Server className="w-5 h-5" />;
    const isService = matchedCategory === 'Service';
    const isMessage = ['Event', 'Command', 'Query'].includes(matchedCategory);
    const isChannel = matchedCategory === 'Channel';
    const isContainer = matchedCategory === 'Data Store';
    const incomingLabel = isService ? 'Incoming Messages' : isMessage ? 'Producers' : isContainer ? 'Read By' : 'Incoming';
    const outgoingLabel = isService
      ? 'Outgoing Messages'
      : isMessage
        ? 'Consumers'
        : isChannel
          ? 'Routes To'
          : isContainer
            ? 'Written By'
            : 'Outgoing';

    // For services, split out containers from messages
    const isContainerConn = (c: any) => resolveConnectedCategory(c.name).category === 'Data Store';
    const isChannelConn = (c: any) => resolveConnectedCategory(c.name).category === 'Channel';

    const incomingMessages = isService ? incoming.filter((c) => !isContainerConn(c)) : incoming;
    const outgoingMessages = isService ? outgoing.filter((c) => !isContainerConn(c)) : [];

    // Containers: "reads from" = containers in incoming, "writes to" = containers in outgoing
    // Also check for "reads & writes" labels
    const readsFrom = isService ? incoming.filter(isContainerConn) : [];
    const writesToConns = isService ? outgoing.filter(isContainerConn) : [];
    // Items with "reads & writes" label appear in outgoing — group them separately
    const readsAndWrites = writesToConns.filter((c) => c.label?.includes('reads & writes'));
    const writesOnly = writesToConns.filter((c) => !c.label?.includes('reads & writes'));

    // For messages/channels, split outgoing into "consumers" and "routes to"
    const outgoingRoutes = isMessage ? outgoing.filter(isChannelConn) : [];
    const outgoingConsumers = isMessage ? outgoing.filter((c) => !isChannelConn(c)) : isService ? outgoingMessages : outgoing;

    return (
      <div className="h-screen flex flex-col bg-white">
        <div className="px-4 pt-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ArrowLeftIcon className="w-4 h-4 text-gray-500" />
            </button>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: detailColor + '20', color: detailColor }}
            >
              {matchedCategory || 'Resource'}
            </span>
            <div className="flex-1" />
            {matchedResource && (
              <button
                onClick={async () => {
                  const categoryKey = (matchedCategory.toLowerCase() + 's') as CategoryType;
                  // Handle "Data Store" → "containers"
                  const resolvedCategory = matchedCategory === 'Data Store' ? 'containers' : categoryKey;
                  removeResource(resolvedCategory, matchedResource.id, matchedResource.version);
                  // Also remove the board item
                  const boardItemId = matchedResource.boardItemId || selectedNode.id;
                  const boardItems = await miro.board.get();
                  const boardItem = boardItems.find((item: any) => item.id === boardItemId);
                  if (boardItem) {
                    await miro.board.remove(boardItem);
                  }
                  setSelectedNode(null);
                }}
                className="p-1 hover:bg-red-50 rounded transition-colors"
                title="Delete resource"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            )}
            {editingField === 'version' ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => $editValue.set(e.target.value)}
                  className="text-xs text-gray-500 border border-purple-300 rounded px-1.5 py-0.5 w-20 focus:outline-none focus:border-purple-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <button onClick={saveEdit} className="p-0.5 text-green-600 hover:text-green-700">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : matchedResource?.version ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">v{matchedResource.version}</span>
                <button
                  onClick={() => startEdit('version', matchedResource.version)}
                  className="p-0.5 text-gray-300 hover:text-purple-600"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : null}
          </div>

          {editingField === 'name' ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => $editValue.set(e.target.value)}
                className="text-base font-bold text-gray-900 border border-purple-300 rounded-lg px-2 py-1 w-full focus:outline-none focus:border-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
              <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-700">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: detailColor, color: 'white' }}
              >
                {detailIcon}
              </div>
              <h1 className="text-base font-bold text-gray-900 truncate flex-1">{selectedNode.name}</h1>
              <button onClick={() => startEdit('name', selectedNode.name)} className="p-0.5 text-gray-300 hover:text-purple-600">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Summary */}
          {editingField === 'summary' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
                <div className="flex items-center gap-1">
                  <button onClick={saveEdit} className="p-0.5 text-green-600 hover:text-green-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={editValue}
                onChange={(e) => $editValue.set(e.target.value)}
                className="w-full text-sm text-gray-700 border border-purple-300 rounded-lg px-2.5 py-2 focus:outline-none focus:border-purple-500 h-24 resize-y leading-relaxed"
                autoFocus
              />
            </div>
          ) : selectedNode.summary || matchedResource?.summary ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
                <button
                  onClick={() => startEdit('summary', selectedNode.summary || matchedResource?.summary || '')}
                  className="p-0.5 text-gray-400 hover:text-purple-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedNode.summary || matchedResource?.summary}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
                <button onClick={() => startEdit('summary', '')} className="p-0.5 text-gray-400 hover:text-purple-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 italic">No summary — click pencil to add</p>
            </div>
          )}

          {/* Incoming connections */}
          {incomingMessages.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {incomingLabel} ({incomingMessages.length})
              </h3>
              <div className="space-y-1.5">
                {incomingMessages.map((conn, i) => {
                  const connInfo = resolveConnectedCategory(conn.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleConnectedItemClick(conn.name, conn.boardItemId)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-[1px] text-left"
                      style={{ backgroundColor: connInfo.color + '10', borderColor: connInfo.color + '30' }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: connInfo.color, color: 'white' }}
                      >
                        {connInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 font-medium truncate">{conn.name}</span>
                        <span className="block text-xs text-gray-500">{conn.label}</span>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Outgoing connections (consumers / services) */}
          {outgoingConsumers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {outgoingLabel} ({outgoingConsumers.length})
              </h3>
              <div className="space-y-1.5">
                {outgoingConsumers.map((conn, i) => {
                  const connInfo = resolveConnectedCategory(conn.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleConnectedItemClick(conn.name, conn.boardItemId)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-[1px] text-left"
                      style={{ backgroundColor: connInfo.color + '10', borderColor: connInfo.color + '30' }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: connInfo.color, color: 'white' }}
                      >
                        {connInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 font-medium truncate">{conn.name}</span>
                        <span className="block text-xs text-gray-500">{conn.label}</span>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Routes To (for messages that connect to channels) */}
          {outgoingRoutes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Routes To ({outgoingRoutes.length})
              </h3>
              <div className="space-y-1.5">
                {outgoingRoutes.map((conn, i) => {
                  const connInfo = resolveConnectedCategory(conn.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleConnectedItemClick(conn.name, conn.boardItemId)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-[1px] text-left"
                      style={{ backgroundColor: connInfo.color + '10', borderColor: connInfo.color + '30' }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: connInfo.color, color: 'white' }}
                      >
                        {connInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 font-medium truncate">{conn.name}</span>
                        <span className="block text-xs text-gray-500">{conn.label}</span>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reads & Writes (bidirectional container connections) */}
          {readsAndWrites.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Reads & Writes ({readsAndWrites.length})
              </h3>
              <div className="space-y-1.5">
                {readsAndWrites.map((conn, i) => {
                  const connInfo = resolveConnectedCategory(conn.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleConnectedItemClick(conn.name, conn.boardItemId)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-[1px] text-left"
                      style={{ backgroundColor: connInfo.color + '10', borderColor: connInfo.color + '30' }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: connInfo.color, color: 'white' }}
                      >
                        {connInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 font-medium truncate">{conn.name}</span>
                        <span className="block text-xs text-gray-500">{conn.label}</span>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reads From (container connections) */}
          {readsFrom.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Reads From ({readsFrom.length})
              </h3>
              <div className="space-y-1.5">
                {readsFrom.map((conn, i) => {
                  const connInfo = resolveConnectedCategory(conn.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleConnectedItemClick(conn.name, conn.boardItemId)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-[1px] text-left"
                      style={{ backgroundColor: connInfo.color + '10', borderColor: connInfo.color + '30' }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: connInfo.color, color: 'white' }}
                      >
                        {connInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 font-medium truncate">{conn.name}</span>
                        <span className="block text-xs text-gray-500">{conn.label}</span>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Writes To (container connections) */}
          {writesOnly.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Writes To ({writesOnly.length})
              </h3>
              <div className="space-y-1.5">
                {writesOnly.map((conn, i) => {
                  const connInfo = resolveConnectedCategory(conn.name);
                  return (
                    <button
                      key={i}
                      onClick={() => handleConnectedItemClick(conn.name, conn.boardItemId)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-[1px] text-left"
                      style={{ backgroundColor: connInfo.color + '10', borderColor: connInfo.color + '30' }}
                    >
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: connInfo.color, color: 'white' }}
                      >
                        {connInfo.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm text-gray-900 font-medium truncate">{conn.name}</span>
                        <span className="block text-xs text-gray-500">{conn.label}</span>
                      </div>
                      <Crosshair className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Owners */}
          {matchedResource?.owners?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Owners</h3>
              <div className="flex flex-wrap gap-1.5">
                {matchedResource.owners.map((owner: any, i: number) => {
                  const ownerId = typeof owner === 'string' ? owner : owner.id || owner;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md"
                    >
                      <User className="w-3 h-3 text-gray-400" />
                      {resolveOwner(ownerId)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Badges</h3>
            <div className="flex flex-wrap gap-1.5">
              {(matchedResource?.badges || []).map((badge: any, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium group/badge"
                >
                  {badge.content}
                  <button
                    onClick={() => removeBadgeFromService(matchedResource.id, matchedResource.version, i)}
                    className="opacity-0 group-hover/badge:opacity-100 hover:text-red-500 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as HTMLFormElement).elements.namedItem('badge') as HTMLInputElement;
                  const value = input.value.trim();
                  if (value && matchedResource) {
                    addBadgeToService(matchedResource.id, matchedResource.version, value);
                    input.value = '';
                  }
                }}
                className="inline-flex"
              >
                <input
                  name="badge"
                  type="text"
                  placeholder="+ Add"
                  className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-300 bg-white text-gray-600 placeholder-gray-400 w-16 focus:w-24 focus:outline-none focus:border-purple-400 transition-all"
                />
              </form>
            </div>
          </div>

          {selectedNode.connectedTo.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400">No connections found</p>
            </div>
          )}
        </div>

        <Footer />
      </div>
    );
  }

  // Dashboard grid view
  if (!activeCategory) {
    const totalResources = categoryConfig.reduce((sum, c) => sum + getResources(c.key).length, 0);

    return (
      <div className="h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Your Architecture</h1>
              <p className="text-xs text-gray-500">{totalResources} resources</p>
            </div>
          </div>
          <button
            onClick={handleAutoLayout}
            disabled={isLayouting}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200 hover:border-purple-200"
            title="Auto-layout board items"
          >
            <LayoutGrid className={`w-3.5 h-3.5 ${isLayouting ? 'animate-spin' : ''}`} />
            <span>{isLayouting ? 'Layouting...' : 'Auto-layout'}</span>
          </button>
        </div>

        {/* Category grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {categoryConfig.map(({ key, title, icon, color, bgColor, borderColor }) => {
              const count = getResources(key).length;
              const singularNames: Record<string, string> = {
                Services: 'Service',
                Events: 'Event',
                Commands: 'Command',
                Queries: 'Query',
                Channels: 'Channel',
                'Data Stores': 'Data Store',
              };
              const singular = singularNames[title] || title;
              const newItemData = {
                id: `new-${key}-drag`,
                type: 'new',
                category: key,
                name: `New ${singular}`,
                version: '1.0.0',
                summary: '',
                owners: [],
                badges: [],
                style: getCategoryStyles(key),
                receives: [],
                sends: [],
                writesTo: [],
                readsFrom: [],
                _draft: true,
                _isNewDrag: true,
              };
              return (
                <div
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    setSearchTerm('');
                  }}
                  className="relative rounded-xl p-4 border hover:shadow-md transition-all duration-200 text-left group cursor-grab miro-draggable"
                  style={{ backgroundColor: bgColor, borderColor }}
                  data-item={JSON.stringify(newItemData)}
                >
                  <GripVertical className="w-3.5 h-3.5 text-gray-300 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: color, color: 'white' }}
                  >
                    {icon}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {count} {count === 1 ? 'resource' : 'resources'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Display mode */}
          <div className="mt-4 bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Mode</span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={async () => {
                    setDisplayType('appcard');
                    await convertAllBoardItems();
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${displayType === 'appcard' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  App Card
                </button>
                <button
                  onClick={async () => {
                    setDisplayType('sticky');
                    await convertAllBoardItems();
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${displayType === 'sticky' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Post-it
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 space-y-2">
            <button
              onClick={() => navigate('/import')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import Resources
            </button>
            {totalResources > 0 && (
              <>
                <button
                  onClick={async () => {
                    const boardItems = await miro.board.get();
                    const exported = {
                      exportedAt: new Date().toISOString(),
                      items: boardItems,
                    };

                    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'miro-board-export.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-200 hover:border-purple-200"
                >
                  <Download className="w-4 h-4" />
                  Export to JSON
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all resources? This cannot be undone.')) {
                      setCatalogData(null);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-xs font-medium border border-gray-200 hover:border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Resources
                </button>
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Drill-down list view
  const categoryStyles = getCategoryStyles(activeCategory);
  const activeCategoryConfig = categoryConfig.find((c) => c.key === activeCategory);
  const categoryTitle = activeCategoryConfig?.title || '';
  const categoryIcon = activeCategoryConfig?.icon;
  const categoryColor = activeCategoryConfig?.color || '#6B7280';

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2.5">
          <button
            onClick={() => {
              setActiveCategory(null);
              setSearchTerm('');
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-500" />
          </button>
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: categoryColor, color: 'white' }}
          >
            {categoryIcon}
          </div>
          <span className="text-sm font-bold text-gray-900">{categoryTitle}</span>
          <span className="text-xs text-gray-400">({filteredResources.length})</span>
          <div className="flex-1" />
          <button
            onClick={async () => {
              if (!activeCategory) return;
              const singularNames: Record<string, string> = {
                Services: 'Service',
                Events: 'Event',
                Commands: 'Command',
                Queries: 'Query',
                Channels: 'Channel',
                'Data Stores': 'Data Store',
              };
              const name = `New ${singularNames[categoryTitle] || categoryTitle}`;
              const version = '1.0.0';

              const newResource: any = {
                id: `new-${activeCategory}-${crypto.randomUUID()}`,
                name,
                version,
                summary: '',
                owners: [],
                badges: [],
                _draft: true,
              };

              // Add category-specific fields
              if (activeCategory === 'services') {
                newResource.receives = [];
                newResource.sends = [];
                newResource.writesTo = [];
                newResource.readsFrom = [];
              }

              const styles = getCategoryStyles(activeCategory);
              const viewport = await miro.board.viewport.get();
              const boardItem = await createBoardItem(
                { name, version, summary: '', category: activeCategory, owners: [], badges: [] },
                styles,
                viewport.x + viewport.width / 2,
                viewport.y + viewport.height / 2
              );
              newResource.boardItemId = boardItem.id;
              addResource(activeCategory, newResource);
            }}
            className="px-2 py-1 rounded-md text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            + New
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder={`Search ${categoryTitle.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-1.5 pl-8 pr-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Dependencies toggle for services */}
      {activeCategory === 'services' && (
        <div className="px-4 pt-2 pb-1 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRelatedServices}
              onChange={(e) => setShowRelatedServices(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
            />
            Include dependencies when adding to board
          </label>
        </div>
      )}

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {filteredResources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No resources found</p>
          </div>
        ) : (
          filteredResources.map((resource) => (
            <ResourceItem
              key={`${activeCategory}-${resource.id}-${resource.version}`}
              resource={resource}
              category={activeCategory}
              styles={categoryStyles}
            />
          ))
        )}
      </div>

      <Footer />
    </div>
  );
};

export default memo(ResourceList);
