import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import ConnectToEventCatalog from './pages/ConnectToEventCatalog';
import ResourceList from './pages/ResourceList';
import { initAnalytics, captureBoardContext } from './utils/analytics';
const root = document.getElementById('root');
import '../src/assets/style.css';

// Initialize PostHog (no Miro SDK needed)
initAnalytics();

const App = () => {
  React.useEffect(() => {
    captureBoardContext();
  }, []);

  return (
    <div>
      <Routes>
        <Route path="/*" element={<ResourceList />} />
        <Route path="/import/*" element={<ConnectToEventCatalog />} />
      </Routes>
    </div>
  );
};

ReactDOM.createRoot(root!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
