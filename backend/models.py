"""
User model and database helper functions
"""

import sqlite3
import json
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class User(UserMixin):
    """User model for Flask-Login"""
    
    def __init__(self, id, email, password_hash=None, first_name=None, last_name=None, 
                 preferences=None, created_at=None, updated_at=None):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.first_name = first_name
        self.last_name = last_name
        self.preferences = json.loads(preferences) if preferences else {}
        self.created_at = created_at
        self.updated_at = updated_at
    
    def to_dict(self):
        """Convert user to dictionary for JSON responses"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'preferences': self.preferences,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }


def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


def get_user_by_id(user_id):
    """Get user by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return User(
            id=row['id'],
            email=row['email'],
            password_hash=row['password_hash'],
            first_name=row['first_name'],
            last_name=row['last_name'],
            preferences=row['preferences'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    return None


def get_user_by_email(email):
    """Get user by email"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return User(
            id=row['id'],
            email=row['email'],
            password_hash=row['password_hash'],
            first_name=row['first_name'],
            last_name=row['last_name'],
            preferences=row['preferences'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    return None


def create_user(email, password, first_name=None, last_name=None):
    """Create a new user"""
    password_hash = generate_password_hash(password)
    preferences = json.dumps({})
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (email, password_hash, first_name, last_name, preferences)
            VALUES (?, ?, ?, ?, ?)
        ''', (email, password_hash, first_name, last_name, preferences))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        return get_user_by_id(user_id)
    except sqlite3.IntegrityError:
        conn.close()
        return None  # Email already exists


def update_user(user_id, first_name=None, last_name=None, preferences=None):
    """Update user profile"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    if first_name is not None:
        updates.append('first_name = ?')
        values.append(first_name)
    if last_name is not None:
        updates.append('last_name = ?')
        values.append(last_name)
    if preferences is not None:
        updates.append('preferences = ?')
        values.append(json.dumps(preferences) if isinstance(preferences, dict) else preferences)
    
    if updates:
        updates.append('updated_at = CURRENT_TIMESTAMP')
        values.append(user_id)
        
        query = f'UPDATE users SET {", ".join(updates)} WHERE id = ?'
        cursor.execute(query, values)
        conn.commit()
    
    conn.close()
    return get_user_by_id(user_id)


def verify_password(user, password):
    """Verify user password"""
    if user and user.password_hash:
        return check_password_hash(user.password_hash, password)
    return False


def get_user_assessments(user_id):
    """Get all assessments for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM assessments 
        WHERE user_id = ? 
        ORDER BY completed_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    assessments = []
    for row in rows:
        assessments.append({
            'id': row['id'],
            'answers': json.loads(row['answers']),
            'personality_type': row['personality_type'],
            'completed_at': row['completed_at']
        })
    return assessments


def get_user_resumes(user_id):
    """Get all resumes for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM user_resumes 
        WHERE user_id = ? 
        ORDER BY uploaded_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    
    resumes = []
    for row in rows:
        resumes.append({
            'id': row['id'],
            'filename': row['filename'],
            'file_path': row['file_path'],
            'resume_text': row['resume_text'],
            'uploaded_at': row['uploaded_at'],
            'is_current': bool(row['is_current'])
        })
    return resumes


def get_current_resume(user_id):
    """Get the current resume for a user"""
    resumes = get_user_resumes(user_id)
    for resume in resumes:
        if resume['is_current']:
            return resume
    return None if not resumes else resumes[0]  # Return latest if no current marked

