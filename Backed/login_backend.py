# login_backend.py
from flask import Blueprint, request, jsonify, session
import mysql.connector
import hashlib
import os
import jwt
import datetime
from functools import wraps

# Create Blueprint for login routes
login_bp = Blueprint('login', __name__)

# JWT Secret Key - use a strong secret in production
JWT_SECRET_KEY = 'your-jwt-secret-key-change-in-production'
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24

# Database configuration (same as app.py)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',  # Using your database name
    'port': 3306
}

def get_db_connection():
    """Create database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("✓ Database connected successfully for login")
        return conn
    except mysql.connector.Error as e:
        print(f"✗ Database connection failed: {e}")
        return None

def hash_password(password):
    """Simple password hashing function"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_jwt_token(user_data):
    """Generate JWT token with user data"""
    payload = {
        'user_id': user_data['user_id'],
        'user_name': user_data['user_name'],
        'role_name': user_data['role_name'],
        'department_id': user_data['department_id'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS)
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({"success": False, "message": "Token is missing"}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 401
        
        # Add user info to request context
        request.user = payload
        return f(*args, **kwargs)
    
    return decorated

def verify_user_credentials(user_id, password):
    """
    Verify user credentials against database
    Returns: dict with success status and user data
    """
    conn = get_db_connection()
    if not conn:
        return {"success": False, "message": "Database connection failed", "field": "system"}
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Query to check user credentials
        query = """
        SELECT 
            u.user_id, 
            u.user_name, 
            u.email, 
            u.password,
            u.designation,
            u.role_id,
            r.role_name,
            d.department_name,
            u.department_id
        FROM users_master u
        LEFT JOIN role r ON u.role_id = r.role_id
        LEFT JOIN department d ON u.department_id = d.department_id
        WHERE u.user_id = %s AND u.is_active = 1
        """
        
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return {"success": False, "message": "User ID not found", "field": "userId"}
        
        # Verify password (plain text comparison for now - you might want to implement hashing)
        if user['password'] != password:
            return {"success": False, "message": "Invalid password", "field": "password"}
        
        # Prepare user data for response
        user_data = {
            "user_id": user['user_id'],
            "user_name": user['user_name'],
            "email": user['email'],
            "designation": user['designation'],
            "role_name": user['role_name'],
            "department_name": user['department_name'],
            "department_id": user['department_id'],
            "role_id": user['role_id']
        }
        
        # Generate JWT token
        token = generate_jwt_token(user_data)
        
        # Determine redirect URL based on role
        if user['role_name'] and user['role_name'].lower() == 'hr':
            redirect_url = "/hr-dashboard"
        else:
            redirect_url = "/employee-dashboard"
        
        return {
            "success": True, 
            "message": "Login successful", 
            "user": user_data,
            "token": token,
            "redirectUrl": redirect_url
        }
        
    except mysql.connector.Error as e:
        print(f"Database error during login: {e}")
        return {"success": False, "message": "Database error occurred", "field": "system"}
    except Exception as e:
        print(f"Unexpected error during login: {e}")
        return {"success": False, "message": "An unexpected error occurred", "field": "system"}
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

@login_bp.route('/login', methods=['POST'])
def login():
    """Handle login requests"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False, 
                "message": "No data provided", 
                "field": "system"
            }), 400
        
        user_id = data.get('userId')
        password = data.get('password')
        
        # Validate input
        if not user_id:
            return jsonify({
                "success": False, 
                "message": "User ID is required", 
                "field": "userId"
            }), 400
        
        if not password:
            return jsonify({
                "success": False, 
                "message": "Password is required", 
                "field": "password"
            }), 400
        
        # Convert user_id to integer if possible
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({
                "success": False, 
                "message": "Invalid User ID format", 
                "field": "userId"
            }), 400
        
        # Verify credentials
        result = verify_user_credentials(user_id, password)
        
        if result['success']:
            # Store user info in session (optional - for server-side sessions)
            session['user'] = result['user']
            session['logged_in'] = True
            print(f"✓ User {user_id} logged in successfully as {result['user']['role_name']}")
        else:
            print(f"✗ Login failed for user {user_id}: {result['message']}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"✗ Error in login endpoint: {e}")
        return jsonify({
            "success": False, 
            "message": "Internal server error", 
            "field": "system"
        }), 500

@login_bp.route('/logout', methods=['POST'])
def logout():
    """Handle logout requests"""
    session.clear()
    return jsonify({
        "success": True, 
        "message": "Logged out successfully"
    })

@login_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """Check if user is authenticated using JWT token"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"authenticated": False})
    
    token = auth_header[7:]  # Remove 'Bearer ' prefix
    payload = verify_jwt_token(token)
    
    if payload:
        return jsonify({
            "authenticated": True,
            "user": {
                "user_id": payload['user_id'],
                "user_name": payload['user_name'],
                "role_name": payload['role_name'],
                "department_id": payload['department_id']
            }
        })
    
    return jsonify({"authenticated": False})

@login_bp.route('/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token and return user info"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({"success": False, "message": "Token is required"}), 400
        
        payload = verify_jwt_token(token)
        
        if payload:
            return jsonify({
                "success": True,
                "user": {
                    "user_id": payload['user_id'],
                    "user_name": payload['user_name'],
                    "role_name": payload['role_name'],
                    "department_id": payload['department_id']
                }
            })
        else:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 401
            
    except Exception as e:
        print(f"Error verifying token: {e}")
        return jsonify({"success": False, "message": "Token verification failed"}), 500

# Test data insertion function (for development)
def insert_test_user():
    """Insert test users for development"""
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Check if test HR user already exists
        cursor.execute("SELECT user_id FROM users_master WHERE user_id = 30001")
        if not cursor.fetchone():
            # Insert test HR user
            hr_user_query = """
            INSERT INTO users_master 
            (user_id, user_name, email, password, designation, role_id, department_id, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            hr_user = (
                30001, 
                'HR Manager', 
                'hr@company.com', 
                'password123',
                'HR Manager', 
                1,  # Assuming 1 is HR role ID
                1,  # Assuming 1 is HR department ID
                1
            )
            
            cursor.execute(hr_user_query, hr_user)
            print("✓ Test HR user inserted successfully")
        
        # Check if test employee user already exists
        cursor.execute("SELECT user_id FROM users_master WHERE user_id = 30002")
        if not cursor.fetchone():
            # Insert test employee user
            emp_user_query = """
            INSERT INTO users_master 
            (user_id, user_name, email, password, designation, role_id, department_id, is_active, approver_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            emp_user = (
                30002, 
                'Jane Austen', 
                'jane.austen@company.com', 
                'password123',
                'Web Developer', 
                2,  # Assuming 2 is Employee role ID
                2,  # Assuming 2 is IT department ID
                1,
                30001  # HR as approver
            )
            
            cursor.execute(emp_user_query, emp_user)
            print("✓ Test employee user inserted successfully")
        
        conn.commit()
        
    except mysql.connector.Error as e:
        print(f"✗ Error inserting test users: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()