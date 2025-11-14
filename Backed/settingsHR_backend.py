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
    """Get all users with their details including employee type"""
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
                u.employee_type,
                u.date_of_joining,
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
                'approver_name': user['approver_name'],
                'employee_type': user['employee_type'] or 'Full-time',
                'date_of_joining': user['date_of_joining'] or datetime.now().strftime('%Y-%m-%d')
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
    """Add a new user with employee type"""
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
        employee_type = data.get('employee_type', 'Full-time')
        date_of_joining = data.get('date_of_joining', datetime.now().strftime('%Y-%m-%d'))
        
        if not all([username, email, password, role, department, employee_type]):
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
        
        # Insert new user with date_of_joining
        cursor.execute("""
            INSERT INTO users_master 
            (user_id, user_name, email, password, department_id, role_id, designation, 
             contact_number, is_active, approver_id, user_role, employee_type, date_of_joining)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (new_user_id, username, email, password, department_id, role_id, designation, 
              '', 1, approver_id, role, employee_type, date_of_joining))
        
        conn.commit()
        
        # ⚠️ REMOVED: Manual leave balance creation - database trigger handles this
        # create_employee_leave_balance(cursor, new_user_id, employee_type, date_of_joining)
        
        # ⚠️ REMOVED: Second commit - not needed
        # conn.commit()
        
        return jsonify({
            'message': 'User added successfully',
            'user_id': new_user_id,
            'username': username,
            'email': email,
            'password': password,  # Return password for HR to share
            'employee_type': employee_type,
            'date_of_joining': date_of_joining,
            'leave_policy': get_leave_policy_description(employee_type)
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error adding user: {e}")
        return jsonify({'error': 'Failed to add user'}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

# ⚠️ KEEP this function but don't call it - or remove it entirely
def create_employee_leave_balance(cursor, user_id, employee_type, date_of_joining):
    """Create leave balance records based on employee type with prorated calculations"""
    
    # Calculate months worked for prorated accruals
    if date_of_joining:
        join_date = datetime.strptime(str(date_of_joining), '%Y-%m-%d')
        current_date = datetime.now()
        months_worked = (current_date.year - join_date.year) * 12 + (current_date.month - join_date.month)
        months_worked = max(months_worked, 1)
    else:
        months_worked = 1
    
    if employee_type == 'Intern':
        # Interns get 8 paid leaves only (prorated)
        accrued_paid = min(8, round(0.67 * months_worked, 1))  # 8 annually = 0.67 monthly
        cursor.execute("""
            INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves, is_paid)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, 'Paid Leave', 8, 0, accrued_paid, 1))
    else:
        # Define leave types based on employee type
        if employee_type == 'Full-time':
            leave_types = [
                ('Sick Leave', 10, 1),    # 10 paid sick leaves
                ('Vacation', 15, 1),      # 15 paid vacation leaves  
                ('Casual Leave', 12, 0)   # 12 casual leaves (unpaid)
            ]
        elif employee_type == 'Contract':
            leave_types = [
                ('Sick Leave', 6, 1),     # 6 paid sick leaves
                ('Vacation', 9, 1),       # 9 paid vacation leaves
                ('Casual Leave', 8, 0)    # 8 casual leaves
            ]
        elif employee_type == 'Part-time':
            leave_types = [
                ('Sick Leave', 4, 1),     # 4 paid sick leaves
                ('Vacation', 8, 1),       # 8 paid vacation leaves
                ('Casual Leave', 6, 0)    # 6 casual leaves
            ]
        else:  # Trainee and others
            leave_types = [
                ('Sick Leave', 5, 1),     # 5 paid sick leaves
                ('Vacation', 5, 1),       # 5 paid vacation leaves
                ('Casual Leave', 5, 0)    # 5 casual leaves
            ]
        
        for leave_type, total, is_paid in leave_types:
            # Calculate prorated leaves based on months worked
            monthly_accrual = total / 12.0
            accrued_leaves = min(total, round(monthly_accrual * months_worked, 1))
            
            cursor.execute("""
                INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves, is_paid)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, leave_type, total, 0, accrued_leaves, is_paid))

def get_leave_policy_description(employee_type):
    """Get description of leave policy for employee type"""
    policies = {
        'Intern': 'Intern: 8 Paid Leaves (prorated based on joining date)',
        'Full-time': 'Full-time: 10 Sick + 15 Vacation + 12 Casual Leaves (prorated)',
        'Contract': 'Contract: 6 Sick + 9 Vacation + 8 Casual Leaves (prorated)',
        'Part-time': 'Part-time: 4 Sick + 8 Vacation + 6 Casual Leaves (prorated)',
        'Trainee': 'Trainee: 5 Sick + 5 Vacation + 5 Casual Leaves (prorated)'
    }
    return policies.get(employee_type, 'Standard Leave Package')

@settingsHR_bp.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user details including employee type"""
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
        
        if 'employee_type' in data:
            update_fields.append("employee_type = %s")
            update_values.append(data['employee_type'])
        
        if 'date_of_joining' in data:
            update_fields.append("date_of_joining = %s")
            update_values.append(data['date_of_joining'])
        
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

@settingsHR_bp.route('/api/employee-types')
def get_employee_types():
    """Get all employee types"""
    return jsonify(['Intern', 'Full-time', 'Contract', 'Part-time', 'Trainee'])

@settingsHR_bp.route('/api/leave-policies')
def get_leave_policies():
    """Get leave policies for different employee types with time-period details"""
    policies = [
        {
            'employee_type': 'Intern',
            'paid_leaves': 8,
            'casual_leaves': 0,
            'sick_leaves': 0,
            'monthly_accrual_paid': 0.67,
            'monthly_accrual_casual': 0,
            'description': 'Interns get 8 paid leaves per year (prorated). Direct HR approval required. No casual leaves.',
            'time_period': 'Annual (prorated monthly)',
            'direct_hr_approval': True
        },
        {
            'employee_type': 'Full-time',
            'paid_leaves': 25,
            'casual_leaves': 12,
            'sick_leaves': 10,
            'monthly_accrual_paid': 2.08,
            'monthly_accrual_casual': 1.0,
            'description': 'Full-time employees get 25 paid leaves, 12 casual leaves, and 10 sick leaves per year (prorated monthly).',
            'time_period': 'Annual (prorated monthly)',
            'direct_hr_approval': False
        },
        {
            'employee_type': 'Contract',
            'paid_leaves': 15,
            'casual_leaves': 8,
            'sick_leaves': 6,
            'monthly_accrual_paid': 1.25,
            'monthly_accrual_casual': 0.67,
            'description': 'Contract employees get 15 paid leaves, 8 casual leaves, and 6 sick leaves per year (prorated monthly).',
            'time_period': 'Annual (prorated monthly)',
            'direct_hr_approval': False
        },
        {
            'employee_type': 'Part-time',
            'paid_leaves': 12,
            'casual_leaves': 6,
            'sick_leaves': 4,
            'monthly_accrual_paid': 1.0,
            'monthly_accrual_casual': 0.5,
            'description': 'Part-time employees get 12 paid leaves, 6 casual leaves, and 4 sick leaves per year (prorated monthly).',
            'time_period': 'Annual (prorated monthly)',
            'direct_hr_approval': False
        },
        {
            'employee_type': 'Trainee',
            'paid_leaves': 10,
            'casual_leaves': 5,
            'sick_leaves': 5,
            'monthly_accrual_paid': 0.83,
            'monthly_accrual_casual': 0.42,
            'description': 'Trainees get 10 paid leaves, 5 casual leaves, and 5 sick leaves per year (prorated monthly).',
            'time_period': 'Annual (prorated monthly)',
            'direct_hr_approval': False
        }
    ]
    return jsonify(policies)

@settingsHR_bp.route('/api/document-requirements')
def get_document_requirements():
    """Get document requirements for different leave types"""
    requirements = [
        {
            'leave_type': 'Sick Leave',
            'requires_document': True,
            'document_type': 'Medical Certificate',
            'description': 'Medical certificate from registered practitioner required for sick leaves exceeding 2 days.'
        },
        {
            'leave_type': 'Medical Leave',
            'requires_document': True,
            'document_type': 'Medical Certificate/Hospital Documents',
            'description': 'Medical documents required for all medical leaves.'
        },
        {
            'leave_type': 'Injury Leave',
            'requires_document': True,
            'document_type': 'Medical Report/Accident Report',
            'description': 'Medical report and accident documentation required for injury leaves.'
        },
        {
            'leave_type': 'Maternity Leave',
            'requires_document': True,
            'document_type': 'Medical Certificate',
            'description': 'Medical certificate confirming pregnancy required for maternity leave.'
        },
        {
            'leave_type': 'Paternity Leave',
            'requires_document': True,
            'document_type': 'Birth Certificate',
            'description': 'Birth certificate of child required for paternity leave.'
        },
        {
            'leave_type': 'Casual Leave',
            'requires_document': False,
            'document_type': 'None',
            'description': 'No documents required for casual leaves.'
        },
        {
            'leave_type': 'Vacation',
            'requires_document': False,
            'document_type': 'None',
            'description': 'No documents required for vacation leaves.'
        }
    ]
    return jsonify(requirements)