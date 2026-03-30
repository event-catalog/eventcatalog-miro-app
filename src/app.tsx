import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import ConnectToEventCatalog from './pages/ConnectToEventCatalog';
import ResourceList from './pages/ResourceList';
const root = document.getElementById('root');
import '../src/assets/style.css';

const App = () => (
  <div>
    <Routes>
      <Route path="/*" element={<ResourceList />} />
      <Route path="/import/*" element={<ConnectToEventCatalog />} />
    </Routes>
  </div>
);

ReactDOM.createRoot(root!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
