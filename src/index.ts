import { initAnalytics, trackAppOpened } from './utils/analytics';

export async function init() {
  initAnalytics();

  miro.board.ui.on('icon:click', async () => {
    trackAppOpened();
    await miro.board.ui.openPanel({ url: 'app.html' });
  });

  miro.board.ui.on('selection:update', async (event) => {
    const items = (event as any).items || [];
    if (items.length === 1 && items[0].type !== 'connector') {
      const item = items[0] as any;
      const name = item.type === 'sticky_note' ? (item.content || '').replace(/<[^>]*>/g, '').trim() : item.title || '';
      const selectedId = item.id;
      await miro.board.ui.openPanel({
        url: `app.html?selectedNodeId=${encodeURIComponent(selectedId)}&selectedNodeName=${encodeURIComponent(name)}`,
      });
    }
  });
}

init();
