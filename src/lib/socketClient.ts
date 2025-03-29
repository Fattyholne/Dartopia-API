import { io, Socket } from 'socket.io-client';

// Default backend URL - adjust as needed based on where your Flask server is running
const BACKEND_URL = 'http://localhost:5000';

let socket: Socket | null = null;
let connectAttempts = 0;
const MAX_CONNECT_ATTEMPTS = 5;

export const getSocket = (): Socket => {
  if (!socket) {
    console.log('Creating new socket connection to:', BACKEND_URL);
    connectAttempts = 0;
    
    socket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to WebSocket if possible
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true, // Create a new connection every time
    });
    
    socket.on('connect', () => {
      connectAttempts = 0;
      console.log('Socket successfully connected to backend server with ID:', socket?.id);
    });
    
    socket.on('connect_error', (error) => {
      connectAttempts++;
      console.error(`Socket connection error (attempt ${connectAttempts}/${MAX_CONNECT_ATTEMPTS}):`, error);
      
      if (connectAttempts >= MAX_CONNECT_ATTEMPTS) {
        console.error('Maximum connection attempts reached. Please check if the backend server is running.');
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.warn(`Socket disconnected from backend server: ${reason}`);
      
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // The server or client has forcefully disconnected
        console.log('Manual reconnection required');
        socket?.connect();
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Add custom debugging for socket state
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected on attempt #${attemptNumber}`);
    });
    
    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
    });
    
    // Add a raw message handler to debug all incoming messages
    socket.onAny((eventName, ...args) => {
      console.log(`Received socket event '${eventName}':`, args);
    });
  } else if (!socket.connected) {
    console.log('Socket exists but not connected. Attempting to connect...');
    socket.connect();
  }
  
  return socket;
};

export const closeSocket = (): void => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
    console.log('Socket connection closed and reference cleared');
  }
};

// Helper function to check socket connection status
export const isSocketConnected = (): boolean => {
  return socket !== null && socket.connected;
};