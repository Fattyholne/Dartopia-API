import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { getSocket } from './lib/socketClient';

// Configure backend URL
const BACKEND_URL = 'http://localhost:5000';
const ENV = import.meta.env.MODE || 'development';

console.log('Dartopia application starting...');
console.log('Environment:', ENV);
console.log('Backend URL:', BACKEND_URL);

// Initialize socket connection
const initializeApp = async () => {
  try {
    // Initialize socket connection
    const socket = getSocket();
    
    // Wait for socket to connect or timeout
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Socket connection timeout, continuing anyway');
        resolve();
      }, 5000); // 5 second timeout

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('Socket connected successfully');
        resolve();
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.warn('Socket connection error:', error);
        resolve(); // Continue anyway, the app will show connection status
      });
    });

    // Set up cleanup
    window.addEventListener('beforeunload', () => {
      console.log('Page unloading, cleaning up resources');
    });

    // Remove loading indicator if it exists
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Mount React app - no Router here since it's already in App.tsx
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </React.StrictMode>
    );

    console.log('React application rendered successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
    // Show error state in the UI
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h1>Application Error</h1>
          <p>Could not initialize the application. Please check the console for details.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }
};

// Start the application
initializeApp();