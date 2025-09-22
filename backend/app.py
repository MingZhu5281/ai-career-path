from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
from assessment_engine import AssessmentEngine
from chatbot import CareerChatbot

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)  # Enable CORS for frontend communication

# Initialize components
assessment_engine = AssessmentEngine()
chatbot = CareerChatbot()

# Database initialization
def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Create assessments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            answers TEXT NOT NULL,
            personality_type TEXT,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create chat_sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            personality_type TEXT,
            resume_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    """Serve the main page"""
    return app.send_static_file('index.html')

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get assessment questions"""
    questions = assessment_engine.get_questions()
    return jsonify(questions)

@app.route('/api/submit-assessment', methods=['POST'])
def submit_assessment():
    """Submit assessment answers and get results"""
    try:
        data = request.json
        session_id = data.get('session_id', 'guest')
        answers = data.get('answers', [])
        
        # Calculate personality type
        personality_type = assessment_engine.calculate_personality(answers)
        
        # Store in database
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO assessments (session_id, answers, personality_type)
            VALUES (?, ?, ?)
        ''', (session_id, json.dumps(answers), personality_type))
        conn.commit()
        conn.close()
        
        # Get personalized results
        results = assessment_engine.get_personality_results(personality_type)
        
        return jsonify({
            'success': True,
            'personality_type': personality_type,
            'results': results
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chatbot conversations"""
    try:
        data = request.json
        session_id = data.get('session_id', 'guest')
        message = data.get('message', '')
        personality_type = data.get('personality_type', '')
        resume_data = data.get('resume_data', '')
        
        # Get response from chatbot
        response = chatbot.get_career_advice(
            message=message,
            personality_type=personality_type,
            resume_data=resume_data
        )
        
        # Store conversation
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO chat_sessions (session_id, message, response, personality_type, resume_data)
            VALUES (?, ?, ?, ?, ?)
        ''', (session_id, message, response, personality_type, resume_data))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'response': response
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    """Handle resume upload and parsing"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # For MVP, just store the file and return basic info
        # In production, you'd parse the resume content here
        filename = f"resume_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        file.save(os.path.join('uploads', filename))
        
        # Simple text extraction (basic implementation)
        resume_text = "Resume uploaded successfully. Content parsing will be implemented in next iteration."
        
        return jsonify({
            'success': True,
            'filename': filename,
            'resume_text': resume_text
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    os.makedirs('uploads', exist_ok=True)
    
    # Initialize database
    init_db()
    
    # Run the app
    app.run(debug=True, host='0.0.0.0', port=5000)
