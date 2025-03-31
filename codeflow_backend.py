import eventlet
# Ensure eventlet monkey patching happens first
eventlet.monkey_patch()

import logging
import os
import time  # Import standard time module
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS - Allow connections from various development environments
CORS_ORIGINS = [
    "http://localhost:8080", 
    "http://127.0.0.1:8080",
    "http://10.5.0.2:8080",
    "http://192.168.0.150:8080",
    "http://192.168.56.1:8080",
    "http://192.168.117.1:8080",
    "http://192.168.213.1:8080",
    "http://172.31.240.1:8080"
]
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure SocketIO with improved settings
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='eventlet',
    ping_timeout=60,
    ping_interval=25,
    logger=True,  # Enable SocketIO logging
    engineio_logger=True  # Enable Engine.IO logging for deeper debugging
)

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBhZ7Dst3Xd2xRoPzZnY8dkqoXTSpx-5R8")
LOCATION = "us-central1"
MODEL_NAME = "gemini-2.5-pro-exp-03-25"

# Initialize Google Generative AI
genai.configure(api_key=GEMINI_API_KEY)
logger.info("Google Generative AI configured with API key")

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect(auth=None):  # Fixed: added auth parameter to handle Flask-SocketIO passing an auth parameter
    logger.info(f"Client connected: {request.sid}")
    # Immediately emit both events to confirm connection
    socketio.emit('connection_status', {'status': 'connected', 'sid': request.sid}, room=request.sid)
    socketio.emit('server_ready', {'status': 'ready', 'time': time.time()}, room=request.sid)  # Fixed: using standard time.time()

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected: {request.sid}")

# Add a ping handler to keep connections alive
@socketio.on('ping_server')
def handle_ping(data):
    logger.debug(f"Received ping from client {request.sid}")
    return {'status': 'pong', 'timestamp': time.time()}  # Fixed: using standard time.time()

@socketio.on('send_message')
def handle_send_message(data):
    try:
        message = data.get('message', '')
        model_name = data.get('model', MODEL_NAME)
        temperature = data.get('temperature', 0.7)
        system_instructions = data.get('systemInstructions', '')
        
        logger.info(f"Received message for {model_name}")
        
        # Configure model generation parameters
        generation_config = {
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 4096,
        }
        
        # Initialize the generative model
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=generation_config,
            system_instruction=system_instructions
        )
        
        # Generate response
        response = model.generate_content(message)
        
        # Send response back to client
        socketio.emit('receive_message', {'response': response.text}, room=request.sid)
        logger.info(f"Message sent to {model_name}, response received and sent to client {request.sid}")

    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}")
        socketio.emit('error', {'error': str(e)}, room=request.sid)

@socketio.on('start_screen_sharing')
def handle_screen_sharing(data):
    try:
        screen_data = data.get('screen_data')
        model_name = data.get('model', MODEL_NAME)
        
        if screen_data:
            logger.info(f"Received screen data, processing with {model_name}")
            
            # Initialize model for image processing
            model = genai.GenerativeModel(model_name)
            
            # Create a message with the screen data
            response = model.generate_content([
                {"text": "Analyze this screenshot and provide helpful insights or answer any questions visible in the content:"},
                {"image": screen_data}
            ])
            
            # Send response back to client
            socketio.emit('screen_sharing_response', {'response': response.text}, room=request.sid)
            logger.info(f"Screen data processed by {model_name} for client {request.sid}")
        else:
            socketio.emit('screen_sharing_status', {'status': 'Screen sharing started, waiting for data'}, room=request.sid)
            
    except Exception as e:
        logger.error(f"Error in screen_sharing: {str(e)}")
        socketio.emit('error', {'error': str(e)}, room=request.sid)

# REST API routes
@app.route('/api/models', methods=['GET'])
def get_available_models():
    try:
        # Get list of available models from Google AI
        models = genai.list_models()
        model_list = [
            {
                'name': model.name,
                'display_name': model.display_name,
                'description': model.description,
                'input_token_limit': model.input_token_limit,
                'output_token_limit': model.output_token_limit,
                'supported_generation_methods': model.supported_generation_methods,
            }
            for model in models
            if 'generateContent' in model.supported_generation_methods
        ]
        
        # Add our preferred model at the top of the list
        preferred_model = {
            'name': MODEL_NAME,
            'display_name': 'Gemini 2.5 Pro (Experimental)',
            'description': 'Google\'s most powerful and capable generative AI model',
            'input_token_limit': 128000,
            'output_token_limit': 8192,
            'supported_generation_methods': ['generateContent'],
            'preferred': True
        }
        
        model_list.insert(0, preferred_model)
        
        return jsonify({
            'status': 'success',
            'models': model_list
        })
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/switch_model', methods=['POST'])
def switch_model():
    try:
        data = request.json
        new_model = data.get('model', MODEL_NAME)
        
        # Get list of available models
        models = genai.list_models()
        model_names = [model.name for model in models]
        
        # Find matching model
        matched_model = None
        for model_name in model_names:
            if new_model in model_name:
                matched_model = model_name
                break
        
        # If our preferred model is requested, allow it even if not in the API's list
        if new_model == MODEL_NAME:
            matched_model = MODEL_NAME
        
        if not matched_model:
            return jsonify({
                'status': 'error',
                'error': f'Model {new_model} not found. Available models: {", ".join(model_names[:5])}...'
            }), 400
            
        return jsonify({'status': 'success', 'model': matched_model})
    except Exception as e:
        logger.error(f"Error in switch_model: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Dartopia AI Backend'})

# Simple page to confirm server is running (good for browser checks)
@app.route('/', methods=['GET'])
def index():
    return """
    <html>
        <head><title>Dartopia AI Backend</title></head>
        <body>
            <h1>Dartopia AI Backend</h1>
            <p>Server is running. API endpoints:</p>
            <ul>
                <li><a href="/health">Health Check</a></li>
                <li><a href="/api/models">Available Models</a></li>
            </ul>
        </body>
    </html>
    """

# Main entrypoint
if __name__ == "__main__":
    logger.info("Starting Dartopia backend server...")
    try:
        # Note: allow_unsafe_werkzeug parameter removed to fix compatibility issue
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())