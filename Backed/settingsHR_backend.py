from flask import Blueprint, jsonify, request
import mysql.connector
from datetime import datetime

settingsHR_bp = Blueprint('settingsHR', __name__)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def get_db_connection():
    """Create database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"Database connection failed: {e}")
        return None
    
@settingsHR_bp.route('/api/users')
def get_all_users():
    """Get all users with their details"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Query to get all users with department and role information
        cursor.execute("""
            SELECT 
                u.user_id,
                u.user_name,
                u.email,
                u.password,
                u.designation,
                u.contact_number,
                u.is_active,
                u.personal_email,
                u.mobile_phone,
                u.work_phone,
                u.home_address,
                u.preferred_name,
                u.date_of_birth,
                u.gender,
                u.nationality,
                u.pronouns,
                d.department_name,
                r.role_name,
                ua.user_name as approver_name
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN role r ON u.role_id = r.role_id
            LEFT JOIN users_master ua ON u.approver_id = ua.user_id
            ORDER BY u.user_id
        """)
        
        users = cursor.fetchall()
        
        # Format the response to match the frontend table structure
        formatted_users = []
        for user in users:
            # Determine status based on is_active
            status = "Active" if user['is_active'] else "Inactive"
            
            # Format created date (using current date as placeholder since it's not in DB)
            created_date = datetime.now().strftime('%Y-%m-%d')
            
            formatted_user = {
                'user_id': user['user_id'],
                'username': user['user_name'],
                'email': user['email'],
                'password': user['password'],  # This will be shown to HR
                'role': user['role_name'] or 'Employee',
                'department': user['department_name'] or 'Not Assigned',
                'created_date': created_date,
                'status': status,
                'designation': user['designation'],
                'contact_number': user['contact_number'],
                'personal_email': user['personal_email'],
                'mobile_phone': user['mobile_phone'],
                'work_phone': user['work_phone'],
                'home_address': user['home_address'],
                'preferred_name': user['preferred_name'],
                'date_of_birth': user['date_of_birth'],
                'gender': user['gender'],
                'nationality': user['nationality'],
                'pronouns': user['pronouns'],
                'approver_name': user['approver_name']
            }
            formatted_users.append(formatted_user)
        
        return jsonify(formatted_users)
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({'error': 'Failed to fetch users'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

@settingsHR_bp.route('/api/users', methods=['POST'])
def add_user():
    """Add a new user"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.get_json()
        
        # Required fields
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')
        department = data.get('department')
        designation = data.get('designation', 'Employee')
        
        if not all([username, email, password, role, department]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        cursor = conn.cursor(dictionary=True)
        
        # Get department_id
        cursor.execute("SELECT department_id FROM department WHERE department_name = %s", (department,))
        department_result = cursor.fetchone()
        if not department_result:
            return jsonify({'error': 'Invalid department'}), 400
        department_id = department_result['department_id']
        
        # Get role_id (mapping frontend roles to database roles)
        role_mapping = {
            'employee': 'Junior',
            'manager': 'Manager',
            'hr': 'HR',
            'admin': 'Senior'
        }
        db_role = role_mapping.get(role, 'Junior')
        
        cursor.execute("SELECT role_id FROM role WHERE role_name = %s", (db_role,))
        role_result = cursor.fetchone()
        if not role_result:
            return jsonify({'error': 'Invalid role'}), 400
        role_id = role_result['role_id']
        
        # Generate new user_id (max + 1)
        cursor.execute("SELECT MAX(user_id) as max_id FROM users_master")
        max_id_result = cursor.fetchone()
        new_user_id = (max_id_result['max_id'] or 30000) + 1
        
        # Default approver (HR manager)
        approver_id = 2  # HR Manager user_id
        
        # Insert new user
        cursor.execute("""
            INSERT INTO users_master 
            (user_id, user_name, email, password, department_id, role_id, designation, contact_number, is_active, approver_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (new_user_id, username, email, password, department_id, role_id, designation, '', 1, approver_id))
        
        conn.commit()
        
        # Create leave balance records
        leave_types = ['Sick Leave', 'Vacation', 'Casual Leave']
        for leave_type in leave_types:
            total_leaves = 10 if leave_type == 'Sick Leave' else (15 if leave_type == 'Vacation' else 12)
            cursor.execute("""
                INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves)
                VALUES (%s, %s, %s, %s, %s)
            """, (new_user_id, leave_type, total_leaves, 0, total_leaves))
        
        conn.commit()
        
        return jsonify({
            'message': 'User added successfully',
            'user_id': new_user_id,
            'username': username,
            'email': email,
            'password': password  # Return password for HR to share
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error adding user: {e}")
        return jsonify({'error': 'Failed to add user'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

@settingsHR_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user details"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.get_json()
        
        cursor = conn.cursor(dictionary=True)
        
        # Check if user exists
        cursor.execute("SELECT * FROM users_master WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update user fields
        update_fields = []
        update_values = []
        
        if 'username' in data:
            update_fields.append("user_name = %s")
            update_values.append(data['username'])
        
        if 'email' in data:
            update_fields.append("email = %s")
            update_values.append(data['email'])
        
        if 'password' in data and data['password']:
            update_fields.append("password = %s")
            update_values.append(data['password'])
        
        if 'department' in data:
            cursor.execute("SELECT department_id FROM department WHERE department_name = %s", (data['department'],))
            dept_result = cursor.fetchone()
            if dept_result:
                update_fields.append("department_id = %s")
                update_values.append(dept_result['department_id'])
        
        if 'role' in data:
            role_mapping = {
                'employee': 'Junior',
                'manager': 'Manager',
                'hr': 'HR',
                'admin': 'Senior'
            }
            db_role = role_mapping.get(data['role'], 'Junior')
            cursor.execute("SELECT role_id FROM role WHERE role_name = %s", (db_role,))
            role_result = cursor.fetchone()
            if role_result:
                update_fields.append("role_id = %s")
                update_values.append(role_result['role_id'])
        
        if 'designation' in data:
            update_fields.append("designation = %s")
            update_values.append(data['designation'])
        
        if 'is_active' in data:
            update_fields.append("is_active = %s")
            update_values.append(1 if data['is_active'] else 0)
        
        if update_fields:
            update_values.append(user_id)
            update_query = f"UPDATE users_master SET {', '.join(update_fields)} WHERE user_id = %s"
            cursor.execute(update_query, update_values)
            conn.commit()
        
        return jsonify({'message': 'User updated successfully'})
        
    except Exception as e:
        conn.rollback()
        print(f"Error updating user: {e}")
        return jsonify({'error': 'Failed to update user'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()
        
@settingsHR_bp.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Soft delete a user by setting is_active to 0"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT user_id FROM users_master WHERE user_id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'User not found'}), 404
        
        # Soft delete by setting is_active to 0
        cursor.execute("UPDATE users_master SET is_active = 0 WHERE user_id = %s", (user_id,))
        conn.commit()
        
        return jsonify({'message': 'User deactivated successfully'})
        
    except Exception as e:
        conn.rollback()
        print(f"Error deactivating user: {e}")
        return jsonify({'error': 'Failed to deactivate user'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()
        
@settingsHR_bp.route('/api/roles')
def get_roles():
    """Get all roles"""
    return jsonify(['employee', 'manager', 'hr', 'admin'])