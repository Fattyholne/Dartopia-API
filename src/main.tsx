import { createRoot } from 'react-dom/client'
import React from 'react'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'
import { getSocket, closeSocket } from './lib/socketClient'

// Configure backend URL and environment
const BACKEND_URL = 'http://localhost:5000';
const ENV = import.meta.env.MODE || 'development';

// Add some global logging
console.log('Dartopia application starting...');
console.log('Environment:', ENV);
console.log('Backend URL:', BACKEND_URL);
console.log('DOM is ready, initializing React app');

// Initialize the socket connection before mounting the React app
try {
  // Pre-initialize socket connection
  const socket = getSocket();
  console.log('WebSocket initialization completed');
  
  // Clean up socket connection on page unload
  window.addEventListener('beforeunload', () => {
    console.log('Page unloading, closing socket connection');
    closeSocket();
  });
} catch (error) {
  console.error('Error initializing WebSocket:', error);
}

// Remove loading indicator if it exists
const loadingElement = document.getElementById('loading');
if (loadingElement) {
  loadingElement.style.display = 'none';
  console.log('Clearing loading screen');
}

// Render the React application
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

console.log('App rendered successfully');
