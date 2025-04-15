import React, { useMemo, useCallback, memo, useEffect } from 'react';
import { useEventCatalog } from '../hooks/EventCatalogContext';
import { useNavigate } from 'react-router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Search } from 'lucide-react';
import Footer from '../components/Footer';
import type { StickyNoteColor, Tag } from '@mirohq/websdk-types';
import { CategoryType, MessageDetails, StyleResult, Resource } from '../utils/types';
import { getIconForCategory, getCategoryStyles } from '../utils/categoryUtils';

// Extract CategoryFilter component
interface CategoryFilterProps {
  category: CategoryType;
  title: string;
  isSelected: boolean;
  onToggle: (category: CategoryType) => void;
}

const CategoryFilter = memo(({ category, title, isSelected, onToggle }: CategoryFilterProps) => {
  const styles = useMemo(() => getCategoryStyles(category), [category]);

  return (
    <button
      onClick={() => onToggle(category)}
      className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 border ${styles.backgroundColor} ${isSelected ? 'text-gray-900 border-gray-300' : 'text-gray-500 border-gray-200 opacity-50'}`}
    >
      {title}
    </button>
  );
});

// Extract ResourceItem component
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
      style: styles,
      receives: resource.receives || [],
      sends: resource.sends || [],
    }),
    [category, resource, styles]
  );

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-grab select-none text-sm font-medium text-gray-900 hover:-translate-y-[1px] hover:shadow-sm transition-all duration-200 miro-draggable`}
      style={{ backgroundColor: styles.backgroundColor }}
      data-item={JSON.stringify(itemData)}
    >
      <span className="flex items-center justify-center text-gray-600">{getIconForCategory(category)}</span>
      <span className="flex-1">
        {resource.name} v({resource.version})
      </span>
    </div>
  );
});

const ResourceList = () => {
  const navigate = useNavigate();
  const { catalogData } = useEventCatalog();
  const [miroTags, setMiroTags] = React.useState<{ type: string; tag: Tag }[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<CategoryType[]>([
    'services',
    'events',
    'commands',
    'queries',
  ]);
  const [searchTerms, setSearchTerms] = React.useState<Record<CategoryType, string>>({
    services: '',
    events: '',
    commands: '',
    queries: '',
  });

  // Memoize category titles
  const categoryTitles = useMemo(
    () =>
      ({
        services: 'Services',
        events: 'Events',
        commands: 'Commands',
        queries: 'Queries',
      }) as const,
    []
  );

  const toggleCategory = useCallback((category: CategoryType) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }, []);

  const handleSearchChange = useCallback((category: CategoryType, value: string) => {
    setSearchTerms((prev) => ({
      ...prev,
      [category]: value,
    }));
  }, []);

  // Memoize findMessageDetails
  const findMessageDetails = useCallback(
    (id: string): MessageDetails | undefined => {
      if (!catalogData?.resources?.messages) return undefined;

      const { events = [], commands = [], queries = [] } = catalogData.resources.messages;
      const messages = [
        ...events.map((event) => ({ ...event, type: 'events' })),
        ...commands.map((command) => ({ ...command, type: 'commands' })),
        ...queries.map((query) => ({ ...query, type: 'queries' })),
      ];

      const foundMessage = messages.find((msg) => msg?.id === id);
      if (!foundMessage) return undefined;

      return {
        name: foundMessage.name,
        version: foundMessage.version,
        summary: foundMessage.summary,
        type: foundMessage.type,
      };
    },
    [catalogData]
  );

  // Memoize drop handler creation
  const createDropHandler = useCallback(
    async ({ x, y, target }: any) => {
      const itemData = JSON.parse(target.getAttribute('data-item') || '{}');

      const serviceNode = await miro.board.createStickyNote({
        content: `${itemData.name} (v${itemData.version})`,
        style: {
          fillColor: itemData.style.fillColor as StickyNoteColor,
        },
        x,
        y,
      });

      if (itemData.category === 'services') {
        const receives = itemData.receives || [];
        const sends = itemData.sends || [];

        const VERTICAL_SPACING = 200;
        const totalReceivesHeight = (receives.length - 1) * VERTICAL_SPACING;
        const totalSendsHeight = (sends.length - 1) * VERTICAL_SPACING;
        const maxHeight = Math.max(totalReceivesHeight, totalSendsHeight);
        const startY = y - maxHeight / 2;

        // Process receives
        await Promise.all(
          receives.map(async (receive: any, i: number) => {
            const messageDetails = findMessageDetails(receive.id);
            if (messageDetails) {
              const receiveNode = await miro.board.createStickyNote({
                content: `${messageDetails.name} (v${messageDetails.version})`,
                style: {
                  fillColor: getCategoryStyles(messageDetails.type || 'events').fillColor as StickyNoteColor,
                },
                x: x - 300,
                y: startY + i * VERTICAL_SPACING,
              });

              await miro.board.createConnector({
                start: {
                  item: receiveNode.id,
                  position: { x: 1, y: 0.5 },
                },
                end: {
                  item: serviceNode.id,
                  position: { x: 0, y: 0.5 },
                },
                style: {
                  strokeColor: '#2D9CDB',
                  strokeWidth: 2,
                  strokeStyle: 'normal',
                },
              });
            }
          })
        );

        // Process sends
        await Promise.all(
          sends.map(async (message: any, i: number) => {
            const messageDetails = findMessageDetails(message.id);
            if (messageDetails) {
              const sendNode = await miro.board.createStickyNote({
                content: `${messageDetails.name} (v${messageDetails.version})`,
                style: {
                  fillColor: getCategoryStyles(messageDetails.type || 'events').fillColor as StickyNoteColor,
                },
                x: x + 300,
                y: startY + i * VERTICAL_SPACING,
              });

              await miro.board.createConnector({
                start: {
                  item: serviceNode.id,
                  position: { x: 1, y: 0.5 },
                },
                end: {
                  item: sendNode.id,
                  position: { x: 0, y: 0.5 },
                },
                style: {
                  strokeColor: '#2D9CDB',
                  strokeWidth: 2,
                  strokeStyle: 'normal',
                },
              });
            }
          })
        );
      }
    },
    [findMessageDetails]
  );

  // Optimize useEffect with proper cleanup
  React.useEffect(() => {
    if (!catalogData) {
      navigate('/');
      return;
    }

    const initDragAndDrop = async () => {
      await miro.board.ui.on('drop', createDropHandler);
    };

    initDragAndDrop();

    return () => {
      miro.board.ui.off('drop', createDropHandler);
    };
  }, [catalogData, navigate, createDropHandler]);

  // Memoize filterResources
  const filterResources = useCallback(
    (category: CategoryType): Resource[] => {
      const searchTerm = searchTerms[category]?.toLowerCase() || '';
      if (!catalogData?.resources) return [];

      let resources: Resource[] = [];
      switch (category) {
        case 'services':
          resources = catalogData.resources.services || [];
          break;
        case 'events':
          resources = catalogData.resources.messages?.events || [];
          break;
        case 'commands':
          resources = catalogData.resources.messages?.commands || [];
          break;
        case 'queries':
          resources = catalogData.resources.messages?.queries || [];
          break;
      }

      if (!searchTerm) return resources;

      return resources.filter(
        (resource) => resource.name.toLowerCase().includes(searchTerm) || resource.summary?.toLowerCase().includes(searchTerm)
      );
    },
    [catalogData, searchTerms]
  );

  return (
    <div className="h-screen flex flex-col">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </button>
      <span className="px-3 py-2 text-sm text-gray-500">Drag and drop resources to the board</span>

      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-3 py-1.5 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(categoryTitles).map(([category, title]) => (
            <CategoryFilter
              key={category}
              category={category as CategoryType}
              title={title}
              isSelected={selectedCategories.includes(category as CategoryType)}
              onToggle={toggleCategory}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {selectedCategories.map((category) => {
          const styles = getCategoryStyles(category);
          const resources = filterResources(category);

          return (
            <div key={category} className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2
                    className={`text-lg font-semibold ${styles.fillColor === 'pink' ? 'text-pink-700' : styles.fillColor === 'yellow' ? 'text-amber-600' : styles.fillColor === 'green' ? 'text-green-700' : 'text-purple-700'}`}
                  >
                    {categoryTitles[category]}
                  </h2>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="text"
                    placeholder={`Search ${category}...`}
                    value={searchTerms[category]}
                    onChange={(e) => handleSearchChange(category, e.target.value)}
                    className="w-full py-1.5 pl-9 pr-3 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {resources.map((resource) => (
                  <ResourceItem key={`${category}-${resource.id}`} resource={resource} category={category} styles={styles} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Footer />
    </div>
  );
};

export default memo(ResourceList);
