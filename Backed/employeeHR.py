from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime, date

employee_bp = Blueprint('employee', __name__)

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

@employee_bp.route('/api/employees')
def get_employees():
    """Get employees with pagination and filtering"""
    try:
        print("=== DEBUG: Starting get_employees ===")
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 8))
        status_filter = request.args.get('status', 'all')
        department_filter = request.args.get('department', 'all')
        search = request.args.get('search', '')
        
        print(f"DEBUG: Page: {page}, Per Page: {per_page}, Status: {status_filter}, Department: {department_filter}, Search: {search}")
        
        conn = get_db_connection()
        if not conn:
            print("DEBUG: Database connection failed")
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Build base query
        base_query = """
            SELECT 
                u.user_id as id,
                u.user_name as name,
                u.email,
                u.contact_number as contact,
                u.designation as position,
                d.department_name as department,
                u.date_of_birth,
                u.gender,
                u.is_active
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE 1=1
        """
        
        params = []
        
        # Apply department filter
        if department_filter != 'all':
            base_query += " AND d.department_name = %s"
            params.append(department_filter)
        
        # Apply search filter
        if search:
            base_query += " AND (u.user_name LIKE %s OR u.email LIKE %s OR u.designation LIKE %s OR d.department_name LIKE %s)"
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
        
        # Add ORDER BY
        base_query += " ORDER BY u.user_name"
        
        print(f"DEBUG: Final query: {base_query}")
        print(f"DEBUG: Query params: {params}")
        
        # Count total records for pagination
        count_query = "SELECT COUNT(*) as total FROM users_master u LEFT JOIN department d ON u.department_id = d.department_id WHERE 1=1"
        count_params = []
        
        if department_filter != 'all':
            count_query += " AND d.department_name = %s"
            count_params.append(department_filter)
        
        if search:
            count_query += " AND (u.user_name LIKE %s OR u.email LIKE %s OR u.designation LIKE %s OR d.department_name LIKE %s)"
            count_params.extend([f'%{search}%', f'%{search}%', f'%{search}%', f'%{search}%'])
        
        cursor.execute(count_query, count_params)
        total_count_result = cursor.fetchone()
        total_count = total_count_result['total'] if total_count_result else 0
        
        # Add pagination to main query
        offset = (page - 1) * per_page
        base_query += " LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        # Execute main query
        cursor.execute(base_query, params)
        employees = cursor.fetchall()
        
        print(f"DEBUG: Found {len(employees)} employees")
        
        # For each employee, get additional stats and determine status
        filtered_employees = []
        today = date.today()
        
        for employee in employees:
            # Get total approved leaves count
            cursor.execute("""
                SELECT COUNT(*) as total_leaves 
                FROM leave_application 
                WHERE user_id = %s AND leave_status = 'approved'
            """, (employee['id'],))
            leave_count = cursor.fetchone()
            employee['leaves_taken'] = leave_count['total_leaves'] if leave_count else 0
            
            # Get remaining leaves from leave_balance table
            cursor.execute("""
                SELECT SUM(remaining_leaves) as total_remaining
                FROM leave_balance 
                WHERE user_id = %s
            """, (employee['id'],))
            remaining_result = cursor.fetchone()
            employee['remaining_leaves'] = remaining_result['total_remaining'] if remaining_result and remaining_result['total_remaining'] else 20 - employee['leaves_taken']
            
            # Check if on leave today
            cursor.execute("""
                SELECT COUNT(*) as on_leave 
                FROM leave_application 
                WHERE user_id = %s 
                AND %s BETWEEN start_date AND end_date 
                AND leave_status = 'approved'
            """, (employee['id'], today))
            on_leave = cursor.fetchone()
            
            # Determine status
            if on_leave and on_leave['on_leave'] > 0:
                employee['status'] = 'On-Leave'
            elif employee['is_active']:
                employee['status'] = 'Active'
            else:
                employee['status'] = 'Inactive'
            
            # Apply status filter
            if status_filter == 'all':
                filtered_employees.append(employee)
            elif status_filter.lower() == 'active' and employee['status'] == 'Active':
                filtered_employees.append(employee)
            elif status_filter.lower() == 'on-leave' and employee['status'] == 'On-Leave':
                filtered_employees.append(employee)
            elif status_filter.lower() == 'inactive' and employee['status'] == 'Inactive':
                filtered_employees.append(employee)
        
        # Recalculate pagination based on filtered results
        total_filtered = len(filtered_employees)
        total_pages = (total_filtered + per_page - 1) // per_page if total_filtered > 0 else 1
        
        cursor.close()
        conn.close()
        
        print(f"DEBUG: After filtering: {len(filtered_employees)} employees")
        print("DEBUG: Successfully returning employee data")
        
        return jsonify({
            'employees': filtered_employees,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'total_count': total_filtered,
                'has_prev': page > 1,
                'has_next': page < total_pages
            }
        })
        
    except Exception as e:
        print(f"ERROR in get_employees: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch employees: {str(e)}'}), 500

@employee_bp.route('/api/employees/stats')
def get_employee_stats():
    """Get employee statistics"""
    try:
        print("=== DEBUG: Starting get_employee_stats ===")
        
        conn = get_db_connection()
        if not conn:
            print("DEBUG: Database connection failed")
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        today = date.today()
        
        # Total employees
        print("DEBUG: Getting total employees...")
        cursor.execute("SELECT COUNT(*) as total FROM users_master")
        total_employees_result = cursor.fetchone()
        total_employees = total_employees_result['total'] if total_employees_result else 0
        
        # Employees on leave today
        print("DEBUG: Getting employees on leave...")
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) as on_leave_count 
            FROM leave_application 
            WHERE %s BETWEEN start_date AND end_date 
            AND leave_status = 'approved'
        """, (today,))
        on_leave_result = cursor.fetchone()
        on_leave = on_leave_result['on_leave_count'] if on_leave_result else 0
        
        # Active employees (not on leave today)
        cursor.execute("SELECT COUNT(*) as active FROM users_master WHERE is_active = 1")
        active_result = cursor.fetchone()
        total_active = active_result['active'] if active_result else total_employees
        active_employees = total_active - on_leave
        
        # Average leaves per employee
        print("DEBUG: Getting average leaves...")
        cursor.execute("""
            SELECT AVG(leave_count) as avg_leaves 
            FROM (
                SELECT user_id, COUNT(*) as leave_count 
                FROM leave_application 
                WHERE leave_status = 'approved' 
                GROUP BY user_id
            ) as user_leaves
        """)
        avg_leaves_result = cursor.fetchone()
        avg_leaves = round(avg_leaves_result['avg_leaves'] or 0, 1)
        
        # Department distribution for chart
        print("DEBUG: Getting department distribution...")
        cursor.execute("""
            SELECT d.department_name as department, COUNT(*) as count
            FROM users_master u
            JOIN department d ON u.department_id = d.department_id
            GROUP BY d.department_name
            ORDER BY count DESC
        """)
        department_distribution = cursor.fetchall()
        
        # Leave type distribution
        print("DEBUG: Getting leave type distribution...")
        cursor.execute("""
            SELECT leave_type, COUNT(*) as count
            FROM leave_application
            WHERE leave_status = 'approved'
            GROUP BY leave_type
            ORDER BY count DESC
        """)
        leave_type_distribution = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        print(f"DEBUG: Stats - Total: {total_employees}, Active: {active_employees}, On Leave: {on_leave}, Avg Leaves: {avg_leaves}")
        print(f"DEBUG: Department dist: {department_distribution}")
        print(f"DEBUG: Leave type dist: {leave_type_distribution}")
        
        return jsonify({
            'total_employees': total_employees,
            'active_employees': active_employees,
            'on_leave': on_leave,
            'avg_leaves': avg_leaves,
            'department_distribution': department_distribution,
            'leave_type_distribution': leave_type_distribution
        })
        
    except Exception as e:
        print(f"ERROR in get_employee_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch employee statistics: {str(e)}'}), 500
@employee_bp.route('/api/departments')
def get_departments():
    """Get all departments"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT department_id as id, department_name as name FROM department ORDER BY department_name")
        departments = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Return both names and IDs for flexibility
        return jsonify({
            'departments': [dept['name'] for dept in departments],
            'department_details': departments
        })
        
    except Exception as e:
        print(f"Error fetching departments: {e}")
        # Return default departments if database fails
        return jsonify({
            'departments': ['Human Resources', 'Finance', 'IT', 'Sales', 'Marketing', 'Research & Development'],
            'department_details': []
        })

@employee_bp.route('/api/roles')
def get_roles():
    """Get all roles"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT role_id as id, role_name as name FROM role ORDER BY role_name")
        roles = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify([role['name'] for role in roles])
        
    except Exception as e:
        print(f"Error fetching roles: {e}")
        return jsonify(['Manager', 'HR', 'Senior', 'Junior', 'Intern'])

@employee_bp.route('/api/employees/<int:employee_id>')
def get_employee_details(employee_id):
    """Get detailed employee information"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        today = date.today()
        
        # Get basic employee info
        cursor.execute("""
            SELECT 
                u.user_id as id,
                u.user_name as name,
                u.email,
                u.contact_number as contact,
                u.designation as position,
                d.department_name as department,
                u.date_of_birth,
                u.gender,
                u.is_active
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE u.user_id = %s
        """, (employee_id,))
        
        employee = cursor.fetchone()
        
        if not employee:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Employee not found'}), 404
        
        # Determine status
        cursor.execute("""
            SELECT COUNT(*) as on_leave 
            FROM leave_application 
            WHERE user_id = %s 
            AND %s BETWEEN start_date AND end_date 
            AND leave_status = 'approved'
        """, (employee_id, today))
        
        on_leave = cursor.fetchone()
        if on_leave and on_leave['on_leave'] > 0:
            employee['status'] = 'On-Leave'
        elif employee['is_active']:
            employee['status'] = 'Active'
        else:
            employee['status'] = 'Inactive'
        
        # Get total approved leaves
        cursor.execute("""
            SELECT COUNT(*) as total_leaves 
            FROM leave_application 
            WHERE user_id = %s AND leave_status = 'approved'
        """, (employee_id,))
        
        total_leaves = cursor.fetchone()
        employee['leaves_taken'] = total_leaves['total_leaves'] if total_leaves else 0
        
        # Get remaining leaves
        cursor.execute("""
            SELECT SUM(remaining_leaves) as total_remaining
            FROM leave_balance 
            WHERE user_id = %s
        """, (employee_id,))
        remaining_result = cursor.fetchone()
        employee['remaining_leaves'] = remaining_result['total_remaining'] if remaining_result and remaining_result['total_remaining'] else 20 - employee['leaves_taken']
        
        employee['total_leaves'] = employee['leaves_taken'] + employee['remaining_leaves']
        
        # Get leave history
        cursor.execute("""
            SELECT 
                leave_type,
                start_date,
                end_date,
                leave_status as status,
                reason
            FROM leave_application
            WHERE user_id = %s
            ORDER BY start_date DESC
            LIMIT 10
        """, (employee_id,))
        
        leave_history = cursor.fetchall()
        
        # Convert dates to strings
        for leave in leave_history:
            leave['start_date'] = leave['start_date'].strftime('%Y-%m-%d')
            leave['end_date'] = leave['end_date'].strftime('%Y-%m-%d')
        
        employee['leave_history'] = leave_history
        
        cursor.close()
        conn.close()
        
        return jsonify(employee)
        
    except Exception as e:
        print(f"Error fetching employee details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch employee details'}), 500
@employee_bp.route('/api/employees', methods=['POST'])
def add_employee():
    """Add new employee"""
    try:
        data = request.get_json()
        print(f"DEBUG: Received data: {data}")
        
        # Required fields
        required_fields = ['user_name', 'email', 'contact_number', 'department', 'designation', 'status']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        
        # Generate new user ID
        cursor.execute("SELECT MAX(user_id) as max_id FROM users_master")
        result = cursor.fetchone()
        max_id = result[0] if result[0] else 30000
        new_user_id = max_id + 1
        
        # Get or create department ID
        cursor.execute("SELECT department_id FROM department WHERE department_name = %s", (data['department'],))
        dept_result = cursor.fetchone()
        
        if dept_result:
            # Department exists, use existing ID
            department_id = dept_result[0]
        else:
            # Department doesn't exist, create new department
            print(f"DEBUG: Department '{data['department']}' not found, creating new department")
            
            # Generate new department ID
            cursor.execute("SELECT MAX(department_id) as max_dept_id FROM department")
            dept_id_result = cursor.fetchone()
            max_dept_id = dept_id_result[0] if dept_id_result[0] else 100
            new_department_id = max_dept_id + 1
            
            # Insert new department
            cursor.execute("""
                INSERT INTO department (department_id, department_name, description)
                VALUES (%s, %s, %s)
            """, (new_department_id, data['department'], f"Department for {data['department']}"))
            
            department_id = new_department_id
            print(f"DEBUG: Created new department '{data['department']}' with ID {department_id}")
        
        # Set default role to Junior if not provided
        role_id = 4  # Junior role
        
        # Generate default password (first 4 chars of name + user_id)
        default_password = f"{data['user_name'][:4].lower()}{new_user_id}"
        
        # Set is_active based on status
        is_active = 1 if data['status'] == 'Active' else 0
        
        # Insert new employee
        cursor.execute("""
            INSERT INTO users_master (
                user_id, user_name, email, password, department_id, role_id, 
                designation, contact_number, is_active, approver_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            new_user_id,
            data['user_name'],
            data['email'],
            default_password,
            department_id,
            role_id,
            data['designation'],
            data['contact_number'],
            is_active,
            30001  # Default approver (Brian)
        ))
        
        # Initialize leave balance for different leave types
        leave_types = ['Sick Leave', 'Vacation', 'Casual Leave']
        for leave_type in leave_types:
            if leave_type == 'Sick Leave':
                total = 10
            elif leave_type == 'Vacation':
                total = 15
            else:  # Casual Leave
                total = 12
                
            cursor.execute("""
                INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves)
                VALUES (%s, %s, %s, %s, %s)
            """, (new_user_id, leave_type, total, 0, total))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Employee added successfully',
            'employee_id': new_user_id,
            'default_password': default_password
        })
        
    except mysql.connector.Error as e:
        print(f"Database error adding employee: {e}")
        if conn:
            conn.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        print(f"Error adding employee: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to add employee: {str(e)}'}), 500