from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import mysql.connector
import os
from datetime import datetime, date, timedelta
import json
import jwt
from flask_cors import CORS

# all the Imports for blueprints

from login_backend import login_bp
from profilebackend import profile_bp 
from hr_backend import hr_bp
from leave_requests_backend import leave_requests_bp
from analytics_backend import analytics_bp 
from employeeHR import employee_bp
from settingsHR_backend import settingsHR_bp
from reports_analytics_backendEmployee import reports_analytics_bp


print("=== DayOffly Flask Application Starting ===")
print("Current directory:", os.getcwd())

app = Flask(__name__, template_folder='..', static_folder='..')
app.secret_key = 'your-secret-key-here'

# In app.py - update CORS configuration
CORS(app, 
     supports_credentials=True, 
     origins=["http://localhost:5000", "http://127.0.0.1:5000", 
              "http://127.0.0.1:5500", "http://localhost:5500",
              "http://127.0.0.1:3000", "http://localhost:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     expose_headers=["Set-Cookie"])


# Register blueprints

app.register_blueprint(login_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(hr_bp)
app.register_blueprint(leave_requests_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(employee_bp)
app.register_blueprint(settingsHR_bp)
app.register_blueprint(reports_analytics_bp)

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
        print("✓ Database connected successfully")
        return conn
    except mysql.connector.Error as e:
        print(f"✗ Database connection failed: {e}")
        return None

def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        # Use the same secret key as login_backend.py
        JWT_SECRET_KEY = 'your-jwt-secret-key-change-in-production'
        JWT_ALGORITHM = 'HS256'
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Add these API routes to app.py to handle the missing endpoints
@app.route('/api/employees')
def api_employees():
    """API endpoint to get all employees - redirect to blueprint"""
    return employee_bp.get_employees()

@app.route('/api/employees/stats')
def api_employee_stats():
    """API endpoint to get employee statistics - redirect to blueprint"""
    return employee_bp.get_employee_stats()

@app.route('/api/departments')
def api_departments():
    """API endpoint to get all departments - redirect to blueprint"""
    return employee_bp.get_departments()

@app.route('/api/roles')
def api_roles():
    """API endpoint to get all roles - redirect to blueprint"""
    return employee_bp.get_roles()

@app.route('/api/employees/<int:employee_id>')
def api_employee_details(employee_id):
    """API endpoint to get employee details - redirect to blueprint"""
    return employee_bp.get_employee_details(employee_id)

@app.route('/api/employees', methods=['POST'])
def api_add_employee():
    """API endpoint to add employee - redirect to blueprint"""
    return employee_bp.add_employee()

def get_dashboard_data(user_id=None):
    """Get dashboard data from database"""
    # Get user_id from session if not provided
    if user_id is None:
        if 'user' in session and session['user']:
            user_id = session['user']['user_id']
        else:
            # Fallback to mock data if no session
            return get_mock_data()

    conn = get_db_connection()
    if not conn:
        return get_mock_data()

    try:
        cursor = conn.cursor(dictionary=True)

        # Get user info
        cursor.execute("""
            SELECT u.user_id, u.user_name, u.email, u.designation,
                   d.department_name, r.role_name
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.user_id = %s
        """, (user_id,))
        user_info = cursor.fetchone()

        if not user_info:
            user_info = {'user_name': 'Employee User', 'designation': 'Web Developer'}
        
        # Get leave balance - SUM all leave types for the user
        cursor.execute("""
            SELECT
                SUM(total_leaves) as total_leaves,
                SUM(used_leaves) as used_leaves,
                SUM(remaining_leaves) as remaining_leaves
            FROM leave_balance
            WHERE user_id = %s
        """, (user_id,))
        leave_data = cursor.fetchone()

        if leave_data and leave_data['total_leaves'] is not None:
            total_allowed = leave_data['total_leaves']
            total_used = leave_data['used_leaves']
            total_remaining = leave_data['remaining_leaves']
        else:
            # Fallback to default values if no leave balance found
            total_allowed = 20
            total_used = 0
            total_remaining = 20
        
        # Holidays data - Updated with current/future dates
        holidays = [
            {"name": "Republic Day", "date": "2025-01-26"},
            {"name": "Holi", "date": "2025-03-14"},
            {"name": "Good Friday", "date": "2025-04-18"},
            {"name": "Independence Day", "date": "2025-08-15"},
            {"name": "Gandhi Jayanti", "date": "2025-10-02"},
            {"name": "Diwali", "date": "2025-10-20"},
            {"name": "Christmas", "date": "2025-12-25"}
        ]
        
        today = date.today()
        upcoming_holidays_count = sum(1 for h in holidays if datetime.strptime(h['date'], '%Y-%m-%d').date() >= today)
        
        # Chart data - Simple dynamic approach
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        leaves_taken = [0] * 12
        days_present = [0] * 12
        
        # Try to get dynamic data from leave_applications table
        try:
            cursor.execute("""
                SELECT MONTH(start_date) as month, COUNT(*) as leaves_count
                FROM leave_application 
                WHERE user_id = %s 
                    AND YEAR(start_date) = YEAR(CURDATE())
                    AND leave_status = 'approved'
                GROUP BY MONTH(start_date)
                ORDER BY month
            """, (user_id,))
            
            leave_records = cursor.fetchall()
            
            # Populate leaves taken
            for record in leave_records:
                month_index = record['month'] - 1
                if month_index < 12:
                    leaves_taken[month_index] = record['leaves_count']
            
            # Calculate days present (simplified)
            working_days_per_month = 22
            for i in range(12):
                days_present[i] = working_days_per_month - leaves_taken[i]
                
            print("✓ Dynamic chart data loaded successfully")
            
        except Exception as e:
            print(f"⚠ Using static chart data due to: {e}")
            # Fallback to static data
            leaves_taken = [2, 3, 1, 4, 2, 3, 1, 2, 3, 2, 1, 0]
            days_present = [20, 19, 21, 18, 20, 19, 21, 20, 19, 20, 21, 22]
        
        dashboard_data = {
            "user_info": user_info,
            "stats": {
                "totalAllowed": total_allowed,
                "totalUsed": total_used,
                "totalRemaining": total_remaining,
                "upcomingHolidays": upcoming_holidays_count
            },
            "chartData": {
                "months": months,
                "leavesTaken": leaves_taken,
                "daysPresent": days_present
            },
            "holidays": holidays
        }
        
        print("✓ Dashboard data loaded successfully")
        return dashboard_data
        
    except Exception as e:
        print(f"✗ Error loading dashboard data: {e}")
        return get_mock_data()
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

def get_mock_data():
    """Return mock data if database fails"""
    return {
        "user_info": {"user_name": "Jane Austen", "designation": "Web Developer"},
        "stats": {"totalAllowed": 20, "totalUsed": 15, "totalRemaining": 5, "upcomingHolidays": 4},
        "chartData": {
            "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            "leavesTaken": [2, 3, 1, 4, 2, 3, 1, 2, 3, 2, 1, 0],
            "daysPresent": [20, 19, 21, 18, 20, 19, 21, 20, 19, 20, 21, 22]
        },
        "holidays": [
            {"name": "Republic Day", "date": "2024-01-26"},
            {"name": "Holi", "date": "2024-03-25"},
            {"name": "Independence Day", "date": "2024-08-15"},
            {"name": "Diwali", "date": "2024-11-12"}
        ]
    }

def get_leave_status_data(user_id=None):
    """Get leave status data for the employee"""
    # Get user_id from session if not provided
    if user_id is None:
        if 'user' in session and session['user']:
            user_id = session['user']['user_id']
        else:
            # Return error if no session
            return {"error": "Authentication required", "employeeData": {}, "leaveRequests": []}

    conn = get_db_connection()
    if not conn:
        return {"error": "Database connection failed", "employeeData": {}, "leaveRequests": []}

    try:
        cursor = conn.cursor(dictionary=True)

        # Get employee basic info - FIXED QUERY
        cursor.execute("""
            SELECT u.user_id, u.user_name, u.designation,
                   d.department_name, u.email, u.contact_number
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE u.user_id = %s
        """, (user_id,))
        employee_info = cursor.fetchone()

        if not employee_info:
            employee_info = {
                'user_name': 'Employee User',
                'designation': 'Web Developer',
                'department_name': 'IT',
                'user_id': user_id
            }
        
        # Get leave balance - SUM all leave types for the user
        cursor.execute("""
            SELECT
                SUM(total_leaves) as total_leaves,
                SUM(used_leaves) as used_leaves,
                SUM(remaining_leaves) as remaining_leaves
            FROM leave_balance
            WHERE user_id = %s
        """, (user_id,))
        leave_balance_data = cursor.fetchone()

        print(f"✓ Leave balance query result: {leave_balance_data}")  # Debug print

        if leave_balance_data and leave_balance_data['remaining_leaves'] is not None:
            total_leave_balance = leave_balance_data['remaining_leaves']
        else:
            # If no record found, calculate based on default values
            total_leave_balance = 20  # Default value
        
        # Get leave applications for this employee - ENHANCED QUERY with existing columns
        cursor.execute("""
            SELECT
                la.leave_id,
                la.leave_type,
                la.start_date,
                la.end_date,
                DATEDIFF(la.end_date, la.start_date) + 1 as total_days,
                la.applied_on,
                la.leave_status,
                la.reason,
                la.attachment,
                u.email as employee_email,
                u.contact_number as employee_contact,
                approver.user_name as approver_name,
                approver.designation as approver_designation,
                approver.email as approver_email,
                approver.contact_number as approver_contact,
                hr.user_name as hr_name,
                hr.designation as hr_designation,
                hr.email as hr_email,
                hr.contact_number as hr_contact
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN users_master approver ON u.approver_id = approver.user_id
            LEFT JOIN users_master hr ON hr.role_id = (SELECT role_id FROM role WHERE role_name = 'HR' LIMIT 1)
            WHERE la.user_id = %s
            ORDER BY la.applied_on DESC
        """, (user_id,))
        
        leave_applications = cursor.fetchall()
        
        print(f"✓ Found {len(leave_applications)} leave applications")  # Debug print
        
        # Convert database results to match JavaScript structure
        formatted_requests = []
        for i, application in enumerate(leave_applications):
            # Calculate balance before and after
            if leave_balance_data:
                balance_before = leave_balance_data['total_leaves']
                # Simple calculation: balance after = total - used (this is simplified)
                balance_after = leave_balance_data['remaining_leaves'] 
            else:
                balance_before = 6
                balance_after = 6 - application['total_days'] if application['leave_status'] == 'approved' else 6
            
            # Format documents
            documents = []
            if application['attachment']:
                documents = [application['attachment']]
            
            # Create basic logs based on status
            logs = [
                {"time": application['applied_on'].strftime('%Y-%m-%d %H:%M'), "entry": "Applied by employee"}
            ]
            
            if application['leave_status'] in ['approved', 'declined']:
                action = "Approved" if application['leave_status'] == 'approved' else "Declined"
                logs.append({
                    "time": application['applied_on'].strftime('%Y-%m-%d %H:%M'),  # Using applied date as decision date for now
                    "entry": f"{action} by {application['approver_name'] or 'Manager'}"
                })
            
            formatted_request = {
                "requestId": f"RID{application['leave_id']}",
                "empName": employee_info['user_name'],
                "empId": f"EMP{employee_info['user_id']}",
                "department": employee_info['department_name'],
                "designation": employee_info['designation'],
                "leaveType": application['leave_type'],
                "startDate": application['start_date'].strftime('%Y-%m-%d'),
                "endDate": application['end_date'].strftime('%Y-%m-%d'),
                "totalDays": application['total_days'],
                "appliedDate": application['applied_on'].strftime('%Y-%m-%d'),
                "status": application['leave_status'],
                "balanceBefore": balance_before,
                "balanceAfter": max(0, balance_after),  # Ensure not negative
                "approverName": application['approver_name'] or 'HR Manager',
                "approverDesignation": application['approver_designation'] or 'Manager',
                "decisionDate": application['applied_on'].strftime('%Y-%m-%d'),  # Using applied date for now
                "remarks": application['reason'] or 'Waiting for approval',
                "documents": documents,
                "logs": logs
            }
            formatted_requests.append(formatted_request)
        
        leave_status_data = {
            "employeeData": {
                "empName": employee_info['user_name'],
                "empId": f"EMP{employee_info['user_id']}",
                "department": employee_info['department_name'],
                "designation": employee_info['designation'],
                "totalLeaveBalance": total_leave_balance
            },
            "leaveRequests": formatted_requests
        }
        
        print(f"✓ Leave status data loaded: {len(formatted_requests)} requests")
        return leave_status_data
        
    except Exception as e:
        print(f"✗ Error loading leave status data: {e}")
        import traceback
        traceback.print_exc()
        return {"error": "Failed to load leave status data", "employeeData": {}, "leaveRequests": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

def get_mock_leave_status_data():
    """Return mock leave status data if database fails"""
    return {
        "employeeData": {
            "empName": "Jane Austen",
            "empId": "EMP30002",
            "department": "IT",
            "designation": "Web Developer",
            "totalLeaveBalance": 6
        },
        "leaveRequests": [
            {
                "requestId": "RID4",
                "empName": "Jane Austen",
                "empId": "EMP30002",
                "department": "IT",
                "designation": "Web Developer",
                "leaveType": "Casual Leave",
                "startDate": "2025-12-25",
                "endDate": "2025-12-26",
                "totalDays": 2,
                "appliedDate": "2025-09-26",
                "status": "pending",
                "balanceBefore": 6,
                "balanceAfter": 4,
                "approverName": "Brian",
                "approverDesignation": "Web Developer",
                "decisionDate": "--",
                "remarks": "Christmas holiday",
                "documents": [],
                "logs": [
                    {"time": "2025-09-26 21:09", "entry": "Applied by employee"}
                ]
            }
        ]
    }

# Static file routes for loginPage
@app.route('/loginPage/<path:filename>')
def login_page_static(filename):
    """Serve static files from loginPage directory"""
    return send_from_directory('../loginPage', filename)

# Static file routes for HRDashboard
@app.route('/HRDashboard/<path:filename>')
def hr_dashboard_static(filename):
    """Serve static files from HRDashboard directory"""
    return send_from_directory('../HRDashboard', filename)

# Static file routes for EmployeeDashboard
@app.route('/EmployeeDashboard/<path:filename>')
def employee_dashboard_static(filename):
    """Serve static files from EmployeeDashboard directory"""
    return send_from_directory('../EmployeeDashboard', filename)

# Static file routes for leaveapplication
@app.route('/leaveapplication/<path:filename>')
def leaveapplication_static(filename):
    """Serve static files from leaveapplication directory"""
    return send_from_directory('../leaveapplication', filename)

# Static file routes for Calendar
@app.route('/Calendar/<path:filename>')
def calendar_static(filename):
    """Serve static files from Calendar directory"""
    return send_from_directory('../Calendar', filename)

# Static file routes for Report&analytics
@app.route('/Report&analytics/<path:filename>')
def report_analytics_static(filename):
    """Serve static files from Report&analytics directory"""
    return send_from_directory('../Report&analytics', filename)

# Static file routes for LeaveStatus
@app.route('/LeaveStatus/<path:filename>')
def leave_status_static(filename):
    """Serve static files from LeaveStatus directory"""
    return send_from_directory('../LeaveStatus', filename)

# Static file routes for profile
@app.route('/profile/<path:filename>')
def profile_static(filename):
    """Serve static files from profile directory"""
    return send_from_directory('../profile', filename)

# Static file routes for images
@app.route('/images/<path:filename>')
def images_static(filename):
    """Serve static files from images directory"""
    return send_from_directory('../images', filename)

# Routes - REMOVED DUPLICATE /profile ROUTE

@app.route('/api/dashboard-data')
def api_dashboard_data():
    """API endpoint for employee dashboard data"""
    # Check for JWT token in Authorization header
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        payload = verify_jwt_token(token)

        if payload:
            # Use user_id from JWT token
            user_id = payload['user_id']
            dashboard_data = get_dashboard_data(user_id)
            return jsonify(dashboard_data)
        else:
            return jsonify({'error': 'Invalid or expired token'}), 401
    else:
        # Fallback to session-based authentication for backward compatibility
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401

        dashboard_data = get_dashboard_data()
        return jsonify(dashboard_data)

@app.route('/api/leave-status-data')
def api_leave_status_data():
    """API endpoint for employee leave status data"""
    # Check for JWT token in Authorization header
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        payload = verify_jwt_token(token)

        if payload:
            # Use user_id from JWT token
            user_id = payload['user_id']
            leave_status_data = get_leave_status_data(user_id)
            return jsonify(leave_status_data)
        else:
            # Return mock data for demo purposes when token is invalid
            return jsonify(get_mock_leave_status_data())
    else:
        # Fallback to session-based authentication for backward compatibility
        if 'logged_in' not in session or not session['logged_in']:
            # Return mock data for demo purposes when not logged in
            return jsonify(get_mock_leave_status_data())

        leave_status_data = get_leave_status_data()
        return jsonify(leave_status_data)

@app.route('/api/leave-types')
def api_leave_types():
    """API endpoint to get available leave types from database"""
    # Check for JWT token in Authorization header
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        payload = verify_jwt_token(token)

        if payload:
            # Use user_id from JWT token
            user_id = payload['user_id']
            leave_types_data = get_leave_types(user_id)
            return jsonify(leave_types_data)
        else:
            return jsonify({'error': 'Invalid or expired token'}), 401
    else:
        # Fallback to session-based authentication for backward compatibility
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401

        leave_types_data = get_leave_types()
        return jsonify(leave_types_data)

@app.route('/api/leave-application', methods=['POST'])
def api_submit_leave_application():
    """API endpoint to submit a leave application"""
    # Check for JWT token in Authorization header
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        payload = verify_jwt_token(token)

        if payload:
            # Use user_id from JWT token
            user_id = payload['user_id']
        else:
            return jsonify({'error': 'Invalid or expired token'}), 401
    else:
        # Fallback to session-based authentication for backward compatibility
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401
        user_id = session['user']['user_id']

    try:
        print("=== Starting leave application submission ===")
        data = request.get_json()
        print(f"Received data: {data}")

        # Extract form data
        leave_type = data.get('leaveType')
        start_date = data.get('startDate')
        end_date = data.get('endDate')
        reason = data.get('reason')
        half_day = data.get('halfDay', False)
        half_day_option = data.get('halfDayOption')
        handover = data.get('handover')
        attachment = data.get('attachment')  # Base64 encoded file
        attachment_name = data.get('attachmentName')
        attachment_type = data.get('attachmentType')

        print(f"Extracted: leave_type={leave_type}, start={start_date}, end={end_date}, reason={reason}")

        # Validate required fields
        if not all([leave_type, start_date, end_date, reason]):
            print("Missing required fields")
            return jsonify({'error': 'Missing required fields'}), 400

        # Calculate total days
        from datetime import datetime
        print("Parsing dates...")
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        total_days = (end - start).days + 1
        print(f"Calculated total_days: {total_days}")

        # Adjust for half day
        if half_day:
            total_days = 0.5
            print("Adjusted for half day")

        print("Connecting to database...")
        conn = get_db_connection()
        if not conn:
            print("Database connection failed")
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        print("Executing insert query...")

        # Insert leave application
        insert_query = """
        INSERT INTO leave_application
        (user_id, leave_type, start_date, end_date, reason, attachment, leave_status, applied_on)
        VALUES (%s, %s, %s, %s, %s, %s, 'pending', NOW())
        """

        values = (user_id, leave_type, start_date, end_date, reason, attachment)
        print(f"Insert values: {values}")

        cursor.execute(insert_query, values)

        print("Committing transaction...")
        conn.commit()

        # Get the inserted leave_id
        leave_id = cursor.lastrowid
        print(f"Inserted leave_id: {leave_id}")

        cursor.close()
        conn.close()

        print("=== Leave application submitted successfully ===")
        return jsonify({
            'success': True,
            'message': 'Leave application submitted successfully',
            'leave_id': leave_id
        })

    except Exception as e:
        print(f"Error submitting leave application: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

def get_leave_types(user_id=None):
    """Get available leave types from database"""
    conn = get_db_connection()
    if not conn:
        return {"leaveTypes": ["Casual Leave", "Sick Leave", "Vacation", "Maternity Leave", "Paternity Leave"]}

    try:
        cursor = conn.cursor(dictionary=True)

        # Get all leave types from leave_types table
        cursor.execute("""
            SELECT leave_type, rules, carry_forward_allowed
            FROM leave_types
            ORDER BY leave_type
        """)

        leave_types = cursor.fetchall()

        # Format the data for frontend
        formatted_types = []
        for leave_type in leave_types:
            formatted_types.append({
                'name': leave_type['leave_type'],
                'rules': leave_type['rules'] or 'Standard leave rules apply',
                'carryForwardAllowed': bool(leave_type['carry_forward_allowed'])
            })

        return {"leaveTypes": formatted_types}

    except Exception as e:
        print(f"✗ Error loading leave types: {e}")
        return {"leaveTypes": ["Casual Leave", "Sick Leave", "Vacation", "Maternity Leave", "Paternity Leave"]}
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

@app.route('/')
def dashboard():
    """Employee Dashboard - with basic auth check"""
    # Simple authentication check
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    dashboard_data = get_dashboard_data()
    return render_template('EmployeeDashboard.html',
                         dashboard_data=dashboard_data,
                         user_info=dashboard_data['user_info'])

@app.route('/login-page')
def login_page():
    """Serve the login page"""
    return render_template('loginPage/loginPage.html')

@app.route('/employee-dashboard')
def employee_dashboard():
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')
    
    dashboard_data = get_dashboard_data()
    return render_template('EmployeeDashboard/EmployeeDashboard.html', 
                           dashboard_data=dashboard_data,
                           user_info=dashboard_data['user_info'])

@app.route('/leave-application')
def leave_application():
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    dashboard_data = get_dashboard_data()
    return render_template('leaveapplication/leaveapplication.html',
                         user_info=dashboard_data['user_info'])

@app.route('/calendar')
def calendar():
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    dashboard_data = get_dashboard_data()
    return render_template('Calendar/calendar.html',
                         user_info=dashboard_data['user_info'])

@app.route('/reports-analytics')
def reports_analytics():
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    dashboard_data = get_dashboard_data()
    return render_template('Report&analytics/report&analytics.html',
                         user_info=dashboard_data['user_info'])

@app.route('/hr/employees')
def hr_employees():
    """Serve HR Employee Management page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    # Check if user is HR
    user = session.get('user', {})
    if user.get('role_name') != 'HR':
        return redirect('/employee-dashboard')

    return render_template('EmployeesHR/employeeHR.html', user_info=user)


@app.route('/leave-status')
def leave_status():
    """Leave Status Page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    dashboard_data = get_dashboard_data()
    leave_status_data = get_leave_status_data()

    # Convert data to JSON for JavaScript
    leave_status_json = json.dumps(leave_status_data)

    return render_template('LeaveStatus/leaveStatus.html',
                         user_info=dashboard_data['user_info'],
                         leave_status_data=leave_status_data,
                         leave_status_json=leave_status_json)
    
@app.route('/hr/leave-requests-page')
def hr_leave_requests_page():
    """Serve HR Leave Requests page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    # Check if user is HR
    user = session.get('user', {})
    if user.get('role_name') != 'HR':
        return redirect('/employee-dashboard')

    return render_template('HR/leaveRequestHR.html', user_info=user)
    
@app.route('/debug/all-leave-requests')
def debug_all_leave_requests():
    """Debug route to check all leave requests"""
    conn = get_db_connection()
    if not conn:
        return "Database connection failed"
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM leave_application ORDER BY leave_id")
        all_requests = cursor.fetchall()
        
        return f"""
        <h1>All Leave Requests</h1>
        <pre>{all_requests}</pre>
        """
    except Exception as e:
        return f"Error: {e}"
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()
        
@app.route('/hr/analytics')
def hr_analytics():
    """Serve HR Analytics page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    # Check if user is HR
    user = session.get('user', {})
    if user.get('role_name') != 'HR':
        return redirect('/employee-dashboard')

    return render_template('HR/analyticsHR.html', user_info=user)
# HR Dashboard Route
@app.route('/hr-dashboard')
def hr_dashboard():
    """HR Dashboard - with auth check"""
    # Simple authentication check
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    # Check if user is HR
    user = session.get('user', {})
    if user.get('role_name') != 'HR':
        return redirect('/employee-dashboard')  # Redirect non-HR users to employee dashboard

    return render_template('HRDashboard.html', user_info=user)

# Debug route to check database connection
@app.route('/debug-leave-data')
def debug_leave_data():
    """Debug route to check what data is being fetched"""
    user_id = 30002  # Jane Austen's ID
    
    conn = get_db_connection()
    if not conn:
        return "Database connection failed"
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Check user exists
        cursor.execute("SELECT * FROM users_master WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        # Check leave balance
        cursor.execute("SELECT * FROM leave_balance WHERE user_id = %s", (user_id,))
        balance = cursor.fetchone()
        
        # Check leave applications
        cursor.execute("SELECT * FROM leave_application WHERE user_id = %s", (user_id,))
        applications = cursor.fetchall()
        
        return f"""
        <h1>Debug Leave Data</h1>
        <h2>User Info:</h2>
        <pre>{user}</pre>
        <h2>Leave Balance:</h2>
        <pre>{balance}</pre>
        <h2>Leave Applications ({len(applications)}):</h2>
        <pre>{applications}</pre>
        """
        
    except Exception as e:
        return f"Error: {e}"
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()
        
# In app.py - Add this route to serve the settingsHR.html page
@app.route('/profile')
def profile():
    """Profile Page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    dashboard_data = get_dashboard_data()
    return render_template('profile/profile.html',
                         user_info=dashboard_data['user_info'])

@app.route('/hr/settings')
def hr_settings():
    """Serve HR Settings/User Management page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')

    # Check if user is HR
    user = session.get('user', {})
    if user.get('role_name') != 'HR':
        return redirect('/employee-dashboard')

    return render_template('HR/settingsHR.html')

# Update the API route to use the correct blueprint method
@app.route('/api/users')
def api_users():
    """API endpoint to get all users"""
    return settingsHR_bp.get_all_users()

# @app.route('/hr-dashboard')
# def serve_hr_dashboard():
#     return send_from_directory('.', 'HRDashboard.html')

# @app.route('/employee-dashboard')  
# def serve_employee_dashboard():
#     return send_from_directory('.', 'EmployeeDashboard.html')

# @app.route('/manager-dashboard')
# def serve_manager_dashboard():
#     return send_from_directory('.', 'ManagerDashboard.html')


if __name__ == '__main__':
    print("🚀 Starting DayOffly server...")
    print("🌐 Application will be available at: http://localhost:5000")
    print("📁 Static files should be in: /static/ folder")
    app.run(debug=True, host='0.0.0.0', port=5000)