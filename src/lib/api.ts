
/**
 * API service for communicating with the CodeFlow Buddy backend
 */

// Base URL for the API server
const API_URL = 'http://localhost:5000/api';

/**
 * Creates a new session on the backend
 */
export const createSession = async (): Promise<{ id: string }> => {
  const response = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Sends a message to the specified session
 */
export const sendMessage = async (sessionId: string, content: string): Promise<{ id: string, content: string, timestamp: string }> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Gets all messages for a specified session
 */
export const getMessages = async (sessionId: string): Promise<Array<{ id: string, content: string, timestamp: string, role: string }>> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/messages`);
  
  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.status}`);
  }
  
  return response.json();
};

/**
 * WebRTC signaling - sends a signal to the specified session
 */
export const sendSignal = async (
  sessionId: string, 
  type: string, 
  data: any, 
  senderId: string
): Promise<{ id: string, timestamp: string }> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/signals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data, sender_id: senderId })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to send signal: ${response.status}`);
  }
  
  return response.json();
};

/**
 * WebRTC signaling - gets all signals for a specified receiver
 */
export const getSignals = async (
  sessionId: string, 
  receiverId: string
): Promise<Array<{ id: string, type: string, data: any, sender_id: string, timestamp: string }>> => {
  const response = await fetch(`${API_URL}/sessions/${sessionId}/signals/${receiverId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get signals: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Updates the ScreenSharePanel component to use WebRTC for screen sharing
 * This would be used in a real implementation to send screen sharing data
 */
export const initializeScreenShare = async (
  sessionId: string, 
  userId: string, 
  stream: MediaStream
): Promise<void> => {
  console.log(`Initializing screen share for session ${sessionId} and user ${userId}`);
  // In a real implementation, this would set up the WebRTC connection
  // and use the signaling API to establish peer connections
};

/**
 * Ends an active screen sharing session
 */
export const endScreenShare = async (
  sessionId: string, 
  userId: string
): Promise<void> => {
  console.log(`Ending screen share for session ${sessionId} and user ${userId}`);
  // In a real implementation, this would close the WebRTC connection
  // and notify other users that screen sharing has ended
};
