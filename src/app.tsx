import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import ConnectToEventCatalog from './pages/ConnectToEventCatalog';
import { EventCatalogProvider } from './hooks/EventCatalogContext';
import ResourceList from './pages/ResourceList';
const root = document.getElementById('root');
import '../src/assets/style.css';

const App = () => (
  <div>
    <Routes>
      <Route path="/*" element={<ConnectToEventCatalog />} />
      <Route path="/resource-list/*" element={<ResourceList />} />
    </Routes>
  </div>
);

ReactDOM.createRoot(root!).render(
  <BrowserRouter>
    <EventCatalogProvider>
      <App />
    </EventCatalogProvider>
  </BrowserRouter>
);
