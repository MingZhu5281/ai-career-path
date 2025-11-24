"""
Authentication routes and utilities
"""

import re
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import get_user_by_email, create_user, verify_password, update_user

auth_bp = Blueprint('auth', __name__)


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    return True, ""


@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        # Validate input
        if not email:
            return jsonify({'success': False, 'error': 'Email is required'}), 400
        
        if not validate_email(email):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        if not password:
            return jsonify({'success': False, 'error': 'Password is required'}), 400
        
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'success': False, 'error': error_msg}), 400
        
        # Check if user already exists
        existing_user = get_user_by_email(email)
        if existing_user:
            return jsonify({'success': False, 'error': 'Email already registered'}), 400
        
        # Create user
        user = create_user(email, password, first_name, last_name)
        if not user:
            return jsonify({'success': False, 'error': 'Failed to create user'}), 500
        
        # Log in the user
        login_user(user, remember=True)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        remember = data.get('remember', True)
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        # Get user by email
        user = get_user_by_email(email)
        if not user:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not verify_password(user, password):
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        # Log in the user
        login_user(user, remember=remember)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """Logout user"""
    try:
        logout_user()
        return jsonify({'success': True, 'message': 'Logout successful'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@auth_bp.route('/api/user/status', methods=['GET'])
def user_status():
    """Get current user status (works for both authenticated and guest)"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    else:
        return jsonify({
            'authenticated': False,
            'user': None
        })

