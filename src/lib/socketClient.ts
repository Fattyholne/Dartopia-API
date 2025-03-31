import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

export const getSocket = (): Socket => {
  if (!socket) {
    const BACKEND_URL = 'http://localhost:5000';
    
    console.log('[Socket] Initializing new connection to:', BACKEND_URL);
    
    socket = io(BACKEND_URL, {
      reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
    });
    
    // Set up event handlers
    socket.on('connect', () => {
      connectionAttempts = 0;
      console.log('[Socket] Connected successfully:', {
        timestamp: new Date().toISOString(),
        id: socket?.id,
        connected: socket?.connected
      });
      
      // Send a ping immediately after connecting to verify two-way communication
      socket.emit('ping_server', { timestamp: Date.now() });
    });
    
    socket.on('connection_status', (info) => {
      console.log('[Socket] Server info:', info);
    });
    
    socket.on('server_ready', (info) => {
      console.log('[Socket] Server is ready:', info);
      // The server is ready to process requests
      window.dispatchEvent(new CustomEvent('backend_connected', { detail: info }));
    });
    
    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', {
        timestamp: new Date().toISOString(),
        reason,
        wasConnected: socket?.connected
      });
      
      window.dispatchEvent(new CustomEvent('backend_disconnected', { 
        detail: { reason, timestamp: Date.now() } 
      }));
    });
    
    socket.on('connect_error', (error) => {
      connectionAttempts++;
      console.error('[Socket] Connection error:', {
        timestamp: new Date().toISOString(),
        error: error.message,
        attempts: connectionAttempts
      });
      
      if (connectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        window.dispatchEvent(new CustomEvent('backend_connection_failed', { 
          detail: { error: error.message, timestamp: Date.now() } 
        }));
      }
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', {
        timestamp: new Date().toISOString(),
        attemptNumber
      });
    });
    
    socket.on('reconnect', (attemptNumber) => {
      connectionAttempts = 0;
      console.log('[Socket] Reconnected after attempts:', {
        timestamp: new Date().toISOString(),
        attemptNumber
      });
      
      window.dispatchEvent(new CustomEvent('backend_reconnected', { 
        detail: { attempts: attemptNumber, timestamp: Date.now() } 
      }));
    });
    
    socket.on('reconnect_failed', () => {
      console.error('[Socket] Failed to reconnect after all attempts', {
        timestamp: new Date().toISOString()
      });
      
      window.dispatchEvent(new CustomEvent('backend_connection_failed', { 
        detail: { error: 'Maximum reconnection attempts reached', timestamp: Date.now() } 
      }));
    });
    
    socket.on('error', (error) => {
      console.error('[Socket] Socket error:', {
        timestamp: new Date().toISOString(),
        error
      });
    });
    
    // Keep-alive ping interval
    setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('ping_server', { timestamp: Date.now() });
      }
    }, 30000); // Every 30 seconds
  }
  
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[Socket] Connection closed');
  }
};

export const emitEvent = (event: string, data: any): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    if (socket && socket.connected) {
      socket.emit(event, data);
      resolve(true);
    } else {
      console.warn(`[Socket] Can't emit '${event}': Socket not connected. Attempting to reconnect...`);
      
      // Try to reconnect
      if (socket && !socket.connected) {
        socket.connect();
        
        // Wait for connection
        setTimeout(() => {
          if (socket && socket.connected) {
            socket.emit(event, data);
            resolve(true);
          } else {
            reject(new Error('Failed to reconnect to server'));
          }
        }, 2000);
      } else {
        reject(new Error('Socket not initialized'));
      }
    }
  });
};

// Check if backend is connected
export const isConnected = (): boolean => {
  return !!(socket && socket.connected);
};

// Wait for backend connection
export const waitForConnection = (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (socket && socket.connected) {
      resolve(true);
      return;
    }
    
    const socket = getSocket(); // Initialize if not already
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      window.removeEventListener('backend_connected', handleConnect);
      resolve(false);
    }, timeout);
    
    // Listen for connection event
    function handleConnect() {
      clearTimeout(timeoutId);
      window.removeEventListener('backend_connected', handleConnect);
      resolve(true);
    }
    
    window.addEventListener('backend_connected', handleConnect);
  });
};