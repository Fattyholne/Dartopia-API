import eventlet
# Ensure monkey_patch is called before any other imports
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import os
import logging
import google.generativeai as genai
import json
import base64

# Import Google Cloud Text-to-Speech
try:
    from google.cloud import texttospeech
    TEXTTOSPEECH_AVAILABLE = True
except ImportError:
    TEXTTOSPEECH_AVAILABLE = False
    logger.warning("Google Cloud Text-to-Speech not available. Install with: pip install google-cloud-texttospeech")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask and configure CORS
app = Flask(__name__)
CORS_ORIGINS = [
    "http://localhost:8080", 
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.5.0.2:8080",
    "http://192.168.0.150:8080",
    "http://192.168.56.1:8080",
    "http://192.168.117.1:8080",
    "http://192.168.213.1:8080",
    "http://172.31.240.1:8080"
]
CORS(app, resources={r"/*": {"origins": CORS_ORIGINS}})

# Configure SocketIO with improved settings
socketio = SocketIO(
    app, 
    cors_allowed_origins=CORS_ORIGINS,
    async_mode='eventlet',
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True
)

# Directly set API key (hardcoded for development purposes only)
# In production, use environment variables or secure storage
GEMINI_API_KEY = "AIzaSyBhZ7Dst3Xd2xRoPzZnY8dkqoXTSpx-5R8"

# Set Google Cloud credentials path for text-to-speech API
# You should replace this with the path to your actual credentials file
# or set it as an environment variable
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "path/to/your/credentials.json"

# Initialize Google Generative AI with API key 
genai.configure(api_key=GEMINI_API_KEY)
logger.info("Google Generative AI configured with hardcoded API key")

# Function to convert text to speech
def text_to_speech(text: str) -> bytes:
    try:
        if not TEXTTOSPEECH_AVAILABLE:
            logger.error("Text-to-speech functionality not available")
            raise ImportError("Google Cloud Text-to-Speech library not installed")
        
        # Initialize the text-to-speech client
        client = texttospeech.TextToSpeechClient()
        
        # Set the text input to be synthesized
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Build the voice request
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Neural2-J",  # Male voice for Dartopia
            ssml_gender=texttospeech.SsmlVoiceGender.MALE
        )
        
        # Select the type of audio file
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.0,
            pitch=0.0
        )
        
        # Perform the text-to-speech request
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content
    except Exception as e:
        logger.error(f"Error in text_to_speech: {str(e)}")
        raise

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected with SID: {request.sid}")
    socketio.emit('connection_status', {
        'status': 'connected',
        'sid': request.sid
    })

@socketio.on('disconnect')
def handle_disconnect():
    logger.info(f"Client disconnected with SID: {request.sid}")

@socketio.on('send_message')
def handle_send_message(data):
    try:
        message = data.get('message', '')
        model_name = data.get('model', 'gemini-pro')
        history = data.get('history', [])
        system_instructions = data.get('systemInstructions', '')
        temperature = data.get('temperature', 0.7)
        enable_voice = data.get('enable_voice', False)  # New parameter for voice support
        
        logger.info(f"Received message data from client {request.sid}: {json.dumps(data, default=str)}")
        logger.info(f"Processing message with {model_name} model")
        
        # Initialize a GenerativeModel with the specified model
        model = genai.GenerativeModel(model_name)
        
        # Format the full prompt with system instructions if provided
        full_prompt = message
        if system_instructions:
            full_prompt = f"{system_instructions}\n\nUser: {message}"
            logger.info(f"Using system instructions: {system_instructions[:50]}...")
        
        logger.info(f"Sending prompt to Gemini: {full_prompt[:50]}...")
            
        # Send the message and get a response
        logger.info("Generating content with Gemini...")
        response = model.generate_content(full_prompt, generation_config={
            "temperature": temperature,
            "top_p": 0.95,
            "top_k": 40,
        })
        
        response_text = response.text
        logger.info(f"Generated response: {response_text[:50]}...")
        
        # Prepare the response data
        response_data = {
            'response': response_text,
            'status': 'success'
        }
        
        # If voice is enabled, generate audio
        if enable_voice and TEXTTOSPEECH_AVAILABLE:
            try:
                logger.info("Voice response requested. Converting text to speech...")
                audio_content = text_to_speech(response_text)
                # Convert audio to base64 for transmission
                audio_b64 = base64.b64encode(audio_content).decode('utf-8')
                response_data['audio'] = audio_b64
                logger.info("Audio generated and encoded successfully")
            except Exception as e:
                logger.error(f"Voice generation failed: {str(e)}")
                response_data['voice_error'] = str(e)
        
        # Important: Emit to the specific client who sent the message
        logger.info(f"Emitting response directly to client {request.sid}")
        socketio.emit('receive_message', response_data, room=request.sid)
        
        logger.info(f"Message sent to {model_name}, response successfully emitted to client {request.sid}")

    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}", exc_info=True)
        socketio.emit('error', {
            'error': str(e),
            'status': 'error'
        }, room=request.sid)
        logger.info(f"Error response emitted to client {request.sid}")

@socketio.on('start_screen_sharing')
def handle_screen_sharing(data):
    try:
        screen_data = data.get('screen_data')
        model_name = data.get('model', 'gemini-pro-vision')
        
        if screen_data:
            logger.info(f"Received screen data from client {request.sid}, processing with {model_name}")
            
            # Initialize model
            model = genai.GenerativeModel(model_name)
            
            # Create a message with the screen data
            logger.info("Sending screen data to Gemini...")
            response = model.generate_content([
                {"text": "Analyze this screenshot and provide helpful insights or answer any questions visible in the content:"},
                {"image": screen_data}
            ])
            
            logger.info(f"Generated screen analysis response: {response.text[:50]}...")
            
            # Send response back to client
            logger.info(f"Emitting screen analysis to client {request.sid}")
            socketio.emit('screen_sharing_response', {'response': response.text})
            logger.info(f"Screen data processed by {model_name}")
        else:
            logger.warning(f"Received screen_sharing event from client {request.sid} but no screen data was provided")
            socketio.emit('screen_sharing_status', {'status': 'Screen sharing started, waiting for data'})
            
    except Exception as e:
        logger.error(f"Error in screen_sharing: {str(e)}", exc_info=True)
        socketio.emit('error', {'error': str(e)})
        logger.info(f"Error response emitted to client {request.sid}")

@app.route('/api/models', methods=['GET'])
def get_available_models():
    try:
        logger.info("Fetching available models from Google API")
        # Get list of available models
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
        
        logger.info(f"Found {len(model_list)} available models")
        return jsonify({
            'status': 'success',
            'models': model_list
        })
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/switch_model', methods=['POST'])
def switch_model():
    try:
        data = request.json
        new_model = data.get('model', 'gemini-pro')
        
        logger.info(f"Request to switch to model: {new_model}")
        
        # Get list of available models
        models = genai.list_models()
        model_names = [model.name for model in models]
        
        # Find matching model
        matched_model = None
        for model_name in model_names:
            if new_model in model_name:
                matched_model = model_name
                break
        
        if not matched_model:
            logger.warning(f"Model {new_model} not found in available models")
            return jsonify({
                'status': 'error',
                'error': f'Model {new_model} not found. Available models: {", ".join(model_names[:5])}...'
            }), 400
        
        logger.info(f"Successfully switched to model: {matched_model}")    
        return jsonify({'status': 'success', 'model': matched_model})
    except Exception as e:
        logger.error(f"Error in switch_model: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    logger.info("Health check requested")
    return jsonify({
        'status': 'healthy',
        'gemini_configured': bool(GEMINI_API_KEY),
        'socketio_running': True
    })

@app.route('/api/test-gemini', methods=['GET'])
def test_gemini():
    try:
        logger.info("Testing Gemini API connection")
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Hello, this is a test message.")
        logger.info(f"Gemini test successful: {response.text[:50]}...")
        return jsonify({
            'status': 'success',
            'response': response.text
        })
    except Exception as e:
        logger.error(f"Gemini test failed: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == "__main__":
    logger.info("Starting Codeflow Buddy backend server...")
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Server failed to start: {str(e)}", exc_info=True)