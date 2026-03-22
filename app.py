from flask import Flask, request, jsonify, render_template
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Start, Stream
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Twilio credentials (set as environment variables on Render)
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')  # Your Twilio number
CALL_SERVER_URL = os.getenv('CALL_SERVER_URL', 'wss://your-app.onrender.com')

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/make-call', methods=['POST'])
def make_call():
    data = request.get_json()
    to_number = data.get('to')
    
    if not to_number:
        return jsonify({'error': 'Phone number required'}), 400
    
    # Create TwiML for incoming call
    response = VoiceResponse()
    start = Start()
    start.stream(url=f'wss://{request.host}/media')
    response.append(start)
    response.say('Please wait while we connect your call.')
    
    # Create call
    call = client.calls.create(
        to=to_number,
        from_=TWILIO_PHONE_NUMBER,
        url=request.host_url + 'voice'
    )
    
    return jsonify({'success': True, 'call_sid': call.sid})

@app.route('/voice', methods=['POST'])
def voice():
    response = VoiceResponse()
    start = Start()
    start.stream(url=f'wss://{request.host}/media')
    response.append(start)
    response.say('You are now connected.')
    return str(response)

@app.route('/media', methods=['POST'])
def media():
    # WebSocket endpoint for media stream
    return '', 204

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)