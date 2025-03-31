# Dartopia AI - Intelligent Dartboard Companion

Dartopia AI is an intelligent dartboard companion system that combines computer vision, AI, and real-time analytics to enhance your dart playing experience.

## Project Structure

The project consists of two main components:

1. **Dartopia-API**: A Flask-SocketIO backend with Google Gemini AI integration for real-time conversation and screen sharing analysis.

2. **Dartopia-beta**: The main dartboard tracking and scoring system with:
   - Computer vision for dart detection
   - Player profiles and analytics
   - Game modes (X01, training, tournament)
   - Voice-based AI coaching

## Getting Started

### Backend (Dartopia-API)

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the backend server:
   ```bash
   python codeflow_backend.py
   ```

3. The server will be available at `http://localhost:5000`

### Frontend

1. Install Node.js dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   bun run dev
   ```

3. Open `http://localhost:8080` in your browser

## Features

- Real-time dart detection and scoring
- AI-powered coaching and analysis
- Multiple game modes
- Player profiles and statistics
- Social features and tournaments
- Google Gemini AI integration for advanced analysis

## Technology Stack

- **Backend**: Python, Flask, Flask-SocketIO, Google Gemini AI
- **Frontend**: TypeScript, React, Vite, TailwindCSS
- **AI/ML**: Computer Vision for dart detection, Pose estimation

## License

MIT License
