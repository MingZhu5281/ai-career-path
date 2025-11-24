from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
import sqlite3
import json
import os
from datetime import datetime
from assessment_engine import AssessmentEngine
from chatbot import CareerChatbot
from models import get_user_by_id, get_user_assessments, get_user_resumes, get_current_resume, update_user
from auth import auth_bp

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, supports_credentials=True)  # Enable CORS with credentials support

# Set secret key for sessions
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index'
login_manager.session_protection = "strong"

@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login"""
    return get_user_by_id(int(user_id))

# Register auth blueprint
app.register_blueprint(auth_bp)

# Initialize components
assessment_engine = AssessmentEngine()
chatbot = CareerChatbot()

# Database initialization
def init_db():
    """Initialize SQLite database with required tables"""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            preferences TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create user_resumes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            resume_text TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_current INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Create assessments table (with migration)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_id INTEGER,
            answers TEXT NOT NULL,
            personality_type TEXT,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Add user_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE assessments ADD COLUMN user_id INTEGER')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id)')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create chat_sessions table (with migration)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_id INTEGER,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            personality_type TEXT,
            resume_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Add user_id column if it doesn't exist (migration)
    try:
        cursor.execute('ALTER TABLE chat_sessions ADD COLUMN user_id INTEGER')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)')
    except sqlite3.OperationalError:
        pass  # Column already exists
    
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
        
        # Get user_id if authenticated
        user_id = current_user.id if current_user.is_authenticated else None
        
        # Store in database
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO assessments (session_id, user_id, answers, personality_type)
            VALUES (?, ?, ?, ?)
        ''', (session_id, user_id, json.dumps(answers), personality_type))
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
        
        # Get user_id if authenticated
        user_id = current_user.id if current_user.is_authenticated else None
        
        # If user is authenticated, try to get resume data from their profile
        if user_id and not resume_data:
            current_resume = get_current_resume(user_id)
            if current_resume and current_resume.get('resume_text'):
                resume_data = current_resume['resume_text']
        
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
            INSERT INTO chat_sessions (session_id, user_id, message, response, personality_type, resume_data)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, user_id, message, response, personality_type, resume_data))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'response': response
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload-resume', methods=['POST'])
@login_required
def upload_resume():
    """Handle resume upload and parsing (requires authentication)"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        user_id = current_user.id
        
        # Validate file type
        allowed_extensions = {'.pdf', '.doc', '.docx'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            return jsonify({'success': False, 'error': 'Invalid file type. Please upload PDF, DOC, or DOCX'}), 400
        
        # Validate file size (5MB limit)
        if len(file.read()) > 5 * 1024 * 1024:
            return jsonify({'success': False, 'error': 'File size must be less than 5MB'}), 400
        
        file.seek(0)  # Reset file pointer
        
        # Save file
        filename = f"resume_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        file_path = os.path.join('uploads', filename)
        file.save(file_path)
        
        # For MVP, just store the file and return basic info
        # In production, you'd parse the resume content here
        resume_text = "Resume uploaded successfully. Content parsing will be implemented in next iteration."
        
        # Mark previous resumes as not current
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE user_resumes SET is_current = 0 WHERE user_id = ?
        ''', (user_id,))
        
        # Store resume in database
        cursor.execute('''
            INSERT INTO user_resumes (user_id, filename, file_path, resume_text, is_current)
            VALUES (?, ?, ?, ?, 1)
        ''', (user_id, file.filename, file_path, resume_text))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'filename': file.filename,
            'resume_text': resume_text
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/profile', methods=['GET'])
@login_required
def get_profile():
    """Get user profile"""
    try:
        user = current_user.to_dict()
        
        # Get latest assessment
        assessments = get_user_assessments(current_user.id)
        latest_assessment = assessments[0] if assessments else None
        
        # Get current resume
        current_resume = get_current_resume(current_user.id)
        
        # Get personality type from latest assessment
        personality_type = latest_assessment['personality_type'] if latest_assessment else None
        personality_results = None
        if personality_type:
            personality_results = assessment_engine.get_personality_results(personality_type)
        
        return jsonify({
            'success': True,
            'user': user,
            'latest_assessment': latest_assessment,
            'personality_results': personality_results,
            'current_resume': current_resume
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update user profile"""
    try:
        data = request.json
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        preferences = data.get('preferences')
        
        updated_user = update_user(
            current_user.id,
            first_name=first_name,
            last_name=last_name,
            preferences=preferences
        )
        
        if updated_user:
            return jsonify({
                'success': True,
                'user': updated_user.to_dict()
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to update profile'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/assessment-history', methods=['GET'])
@login_required
def get_assessment_history():
    """Get user's assessment history"""
    try:
        assessments = get_user_assessments(current_user.id)
        
        # Enrich with personality results
        enriched_assessments = []
        for assessment in assessments:
            personality_type = assessment['personality_type']
            if personality_type:
                results = assessment_engine.get_personality_results(personality_type)
                assessment['results'] = results
            enriched_assessments.append(assessment)
        
        return jsonify({
            'success': True,
            'assessments': enriched_assessments
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/resumes', methods=['GET'])
@login_required
def get_resumes():
    """Get user's uploaded resumes"""
    try:
        resumes = get_user_resumes(current_user.id)
        return jsonify({
            'success': True,
            'resumes': resumes
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
