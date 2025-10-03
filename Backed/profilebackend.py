# profile_backend.py
from flask import Blueprint, request, jsonify, session
import mysql.connector
from datetime import datetime
import re

# Create Blueprint for profile routes
profile_bp = Blueprint('profile', __name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def get_db_connection():
    """Create database connection with error handling"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"Database connection failed: {e}")
        return None

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format"""
    # Basic phone validation - can be enhanced based on requirements
    pattern = r'^[\+]?[(]?[\d\s\-\(\)]{10,}$'
    return re.match(pattern, phone) is not None

def get_user_profile(user_id):
    """
    Get complete user profile data from database
    Returns: dict with user profile data
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get user basic information
        cursor.execute("""
            SELECT 
                u.user_id, u.user_name, u.email, u.designation,
                u.contact_number, u.personal_email, u.mobile_phone,
                u.work_phone, u.home_address, u.preferred_name,
                u.date_of_birth, u.gender, u.nationality, u.pronouns,
                d.department_name, r.role_name,
                u.department_id, u.role_id
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.user_id = %s AND u.is_active = 1
        """, (user_id,))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            return None
        
        # Get emergency contacts
        cursor.execute("""
            SELECT contact_id, contact_name, relationship, phone_number
            FROM emergency_contacts
            WHERE user_id = %s
            ORDER BY contact_id
        """, (user_id,))
        
        emergency_contacts = cursor.fetchall()
        
        # Format the response
        profile_data = {
            "personal_info": {
                "user_id": user_data['user_id'],
                "user_name": user_data['user_name'],
                "email": user_data['email'],
                "designation": user_data['designation'],
                "department": user_data['department_name'],
                "role": user_data['role_name'],
                "contact_number": user_data['contact_number'],
                "personal_email": user_data['personal_email'],
                "mobile_phone": user_data['mobile_phone'],
                "work_phone": user_data['work_phone'],
                "home_address": user_data['home_address'],
                "preferred_name": user_data['preferred_name'],
                "date_of_birth": user_data['date_of_birth'].strftime('%Y-%m-%d') if user_data['date_of_birth'] else None,
                "gender": user_data['gender'],
                "nationality": user_data['nationality'],
                "pronouns": user_data['pronouns']
            },
            "emergency_contacts": emergency_contacts
        }
        
        return profile_data
        
    except mysql.connector.Error as e:
        print(f"Database error fetching profile: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error fetching profile: {e}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

@profile_bp.route('/api/profile', methods=['GET'])
def get_profile():
    """Get user profile data"""
    # Check authentication
    if 'logged_in' not in session or not session['logged_in']:
        return jsonify({
            "success": False,
            "message": "Authentication required"
        }), 401
    
    user_id = session.get('user', {}).get('user_id')
    if not user_id:
        return jsonify({
            "success": False,
            "message": "User not found in session"
        }), 400
    
    profile_data = get_user_profile(user_id)
    
    if profile_data:
        return jsonify({
            "success": True,
            "message": "Profile data retrieved successfully",
            "data": profile_data
        })
    else:
        return jsonify({
            "success": False,
            "message": "Failed to retrieve profile data"
        }), 500

@profile_bp.route('/api/profile/personal-info', methods=['PUT'])
def update_personal_info():
    """Update personal information"""
    # Check authentication
    if 'logged_in' not in session or not session['logged_in']:
        return jsonify({
            "success": False,
            "message": "Authentication required"
        }), 401
    
    user_id = session.get('user', {}).get('user_id')
    if not user_id:
        return jsonify({
            "success": False,
            "message": "User not found in session"
        }), 400
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400
        
        # Validate required fields
        required_fields = ['user_name', 'email']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    "success": False,
                    "message": f"{field.replace('_', ' ').title()} is required"
                }), 400
        
        # Validate email format
        if not validate_email(data['email']):
            return jsonify({
                "success": False,
                "message": "Invalid email format"
            }), 400
        
        # Validate personal email if provided
        if data.get('personal_email') and not validate_email(data['personal_email']):
            return jsonify({
                "success": False,
                "message": "Invalid personal email format"
            }), 400
        
        # Validate phone numbers if provided
        if data.get('mobile_phone') and not validate_phone(data['mobile_phone']):
            return jsonify({
                "success": False,
                "message": "Invalid mobile phone format"
            }), 400
        
        if data.get('contact_number') and not validate_phone(data['contact_number']):
            return jsonify({
                "success": False,
                "message": "Invalid contact number format"
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        cursor = conn.cursor()
        
        # Update user personal information
        update_query = """
            UPDATE users_master 
            SET user_name = %s, email = %s, personal_email = %s,
                mobile_phone = %s, work_phone = %s, home_address = %s,
                preferred_name = %s, date_of_birth = %s, gender = %s,
                nationality = %s, pronouns = %s, contact_number = %s
            WHERE user_id = %s
        """
        
        # Handle date conversion
        date_of_birth = None
        if data.get('date_of_birth'):
            try:
                date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({
                    "success": False,
                    "message": "Invalid date format. Use YYYY-MM-DD"
                }), 400
        
        update_values = (
            data['user_name'],
            data['email'],
            data.get('personal_email'),
            data.get('mobile_phone'),
            data.get('work_phone'),
            data.get('home_address'),
            data.get('preferred_name'),
            date_of_birth,
            data.get('gender'),
            data.get('nationality'),
            data.get('pronouns'),
            data.get('contact_number'),
            user_id
        )
        
        cursor.execute(update_query, update_values)
        conn.commit()
        
        # Check if update was successful
        if cursor.rowcount > 0:
            # Update session data if username changed
            if 'user' in session and session['user'].get('user_name') != data['user_name']:
                session['user']['user_name'] = data['user_name']
                session.modified = True
            
            return jsonify({
                "success": True,
                "message": "Personal information updated successfully"
            })
        else:
            return jsonify({
                "success": False,
                "message": "No changes made or user not found"
            }), 400
            
    except mysql.connector.Error as e:
        print(f"Database error updating personal info: {e}")
        return jsonify({
            "success": False,
            "message": "Database error occurred"
        }), 500
    except Exception as e:
        print(f"Unexpected error updating personal info: {e}")
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred"
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@profile_bp.route('/api/profile/emergency-contacts', methods=['GET'])
def get_emergency_contacts():
    """Get emergency contacts for user"""
    if 'logged_in' not in session or not session['logged_in']:
        return jsonify({
            "success": False,
            "message": "Authentication required"
        }), 401
    
    user_id = session.get('user', {}).get('user_id')
    if not user_id:
        return jsonify({
            "success": False,
            "message": "User not found in session"
        }), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT contact_id, contact_name, relationship, phone_number
            FROM emergency_contacts
            WHERE user_id = %s
            ORDER BY contact_id
        """, (user_id,))
        
        contacts = cursor.fetchall()
        
        return jsonify({
            "success": True,
            "message": "Emergency contacts retrieved successfully",
            "data": contacts
        })
        
    except mysql.connector.Error as e:
        print(f"Database error fetching emergency contacts: {e}")
        return jsonify({
            "success": False,
            "message": "Database error occurred"
        }), 500
    except Exception as e:
        print(f"Unexpected error fetching emergency contacts: {e}")
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred"
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

@profile_bp.route('/api/profile/emergency-contacts', methods=['PUT'])
def update_emergency_contacts():
    """Update emergency contacts"""
    if 'logged_in' not in session or not session['logged_in']:
        return jsonify({
            "success": False,
            "message": "Authentication required"
        }), 401
    
    user_id = session.get('user', {}).get('user_id')
    if not user_id:
        return jsonify({
            "success": False,
            "message": "User not found in session"
        }), 400
    
    try:
        data = request.get_json()
        if not data or 'contacts' not in data:
            return jsonify({
                "success": False,
                "message": "No contacts data provided"
            }), 400
        
        contacts = data['contacts']
        
        # Validate contacts data
        for contact in contacts:
            if not contact.get('contact_name') or not contact.get('relationship') or not contact.get('phone_number'):
                return jsonify({
                    "success": False,
                    "message": "All fields (name, relationship, phone) are required for each contact"
                }), 400
            
            if not validate_phone(contact['phone_number']):
                return jsonify({
                    "success": False,
                    "message": f"Invalid phone number for {contact['contact_name']}"
                }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        cursor = conn.cursor()
        
        # Delete existing contacts
        cursor.execute("DELETE FROM emergency_contacts WHERE user_id = %s", (user_id,))
        
        # Insert new contacts
        insert_query = """
            INSERT INTO emergency_contacts (user_id, contact_name, relationship, phone_number)
            VALUES (%s, %s, %s, %s)
        """
        
        for contact in contacts:
            cursor.execute(insert_query, (
                user_id,
                contact['contact_name'],
                contact['relationship'],
                contact['phone_number']
            ))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Emergency contacts updated successfully"
        })
        
    except mysql.connector.Error as e:
        print(f"Database error updating emergency contacts: {e}")
        if 'conn' in locals():
            conn.rollback()
        return jsonify({
            "success": False,
            "message": "Database error occurred"
        }), 500
    except Exception as e:
        print(f"Unexpected error updating emergency contacts: {e}")
        if 'conn' in locals():
            conn.rollback()
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred"
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@profile_bp.route('/api/profile/contact-details', methods=['PUT'])
def update_contact_details():
    """Update contact details (email, phone, address)"""
    if 'logged_in' not in session or not session['logged_in']:
        return jsonify({
            "success": False,
            "message": "Authentication required"
        }), 401
    
    user_id = session.get('user', {}).get('user_id')
    if not user_id:
        return jsonify({
            "success": False,
            "message": "User not found in session"
        }), 400
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400
        
        # Validate email if provided
        if data.get('personal_email') and not validate_email(data['personal_email']):
            return jsonify({
                "success": False,
                "message": "Invalid personal email format"
            }), 400
        
        # Validate phone numbers if provided
        if data.get('mobile_phone') and not validate_phone(data['mobile_phone']):
            return jsonify({
                "success": False,
                "message": "Invalid mobile phone format"
            }), 400
        
        if data.get('work_phone') and not validate_phone(data['work_phone']):
            return jsonify({
                "success": False,
                "message": "Invalid work phone format"
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500
        
        cursor = conn.cursor()
        
        # Update contact details
        update_query = """
            UPDATE users_master 
            SET personal_email = %s, mobile_phone = %s, 
                work_phone = %s, home_address = %s
            WHERE user_id = %s
        """
        
        update_values = (
            data.get('personal_email'),
            data.get('mobile_phone'),
            data.get('work_phone'),
            data.get('home_address'),
            user_id
        )
        
        cursor.execute(update_query, update_values)
        conn.commit()
        
        if cursor.rowcount > 0:
            return jsonify({
                "success": True,
                "message": "Contact details updated successfully"
            })
        else:
            return jsonify({
                "success": False,
                "message": "No changes made or user not found"
            }), 400
            
    except mysql.connector.Error as e:
        print(f"Database error updating contact details: {e}")
        return jsonify({
            "success": False,
            "message": "Database error occurred"
        }), 500
    except Exception as e:
        print(f"Unexpected error updating contact details: {e}")
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred"
        }), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# Health check endpoint
@profile_bp.route('/api/profile/health', methods=['GET'])
def health_check():
    """Health check for profile service"""
    return jsonify({
        "status": "healthy",
        "service": "profile_backend",
        "timestamp": datetime.now().isoformat()
    })