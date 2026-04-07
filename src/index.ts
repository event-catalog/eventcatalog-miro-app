import { initAnalytics, trackAppOpened } from './utils/analytics';

export async function init() {
  initAnalytics();

  miro.board.ui.on('icon:click', async () => {
    trackAppOpened();
    await miro.board.ui.openPanel({ url: 'app.html' });
  });

}

init();
