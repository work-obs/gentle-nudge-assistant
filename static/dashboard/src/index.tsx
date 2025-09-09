import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';

const container = document.getElementById('dashboard-root');
if (!container) {
  throw new Error('Dashboard root container not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);