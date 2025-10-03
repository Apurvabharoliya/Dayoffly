from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import mysql.connector
import os
from datetime import datetime, date
import json
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

app = Flask(__name__)
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

def get_dashboard_data(user_id=30002):
    """Get dashboard data from database"""
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
        
        # Get leave balance - FIXED QUERY
        cursor.execute("""
            SELECT total_leaves, used_leaves, remaining_leaves 
            FROM leave_balance 
            WHERE user_id = %s
        """, (user_id,))
        leave_data = cursor.fetchone()
        
        if leave_data:
            total_allowed = leave_data['total_leaves']
            total_used = leave_data['used_leaves']
            total_remaining = leave_data['remaining_leaves']
        else:
            total_allowed = 20
            total_used = 15
            total_remaining = 5
        
        # Holidays data
        holidays = [
            {"name": "Republic Day", "date": "2024-01-26"},
            {"name": "Holi", "date": "2024-03-25"},
            {"name": "Independence Day", "date": "2024-08-15"},
            {"name": "Diwali", "date": "2024-11-12"}
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

def get_leave_status_data(user_id=30002):
    """Get leave status data for the employee"""
    conn = get_db_connection()
    if not conn:
        return get_mock_leave_status_data()
    
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
        
        # Get leave balance - FIXED QUERY (using your actual table structure)
        cursor.execute("""
            SELECT total_leaves, used_leaves, remaining_leaves 
            FROM leave_balance 
            WHERE user_id = %s
        """, (user_id,))
        leave_balance_data = cursor.fetchone()
        
        print(f"✓ Leave balance query result: {leave_balance_data}")  # Debug print
        
        if leave_balance_data:
            total_leave_balance = leave_balance_data['remaining_leaves']
        else:
            # If no record found, calculate based on default values
            total_leave_balance = 6  # Default value
        
        # Get leave applications for this employee - FIXED QUERY
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
                approver.user_name as approver_name,
                approver.designation as approver_designation
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN users_master approver ON u.approver_id = approver.user_id
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
                "approverName": application['approver_name'] or 'Pending Assignment',
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
        return get_mock_leave_status_data()
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

# Routes - REMOVED DUPLICATE /profile ROUTE

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
    return render_template('HRDashboard.html')

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
    return render_template('leaveapplication.html',
                         user_info=dashboard_data['user_info'])

@app.route('/calendar')
def calendar():
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')
    
    dashboard_data = get_dashboard_data()
    return render_template('calendar.html',
                         user_info=dashboard_data['user_info'])

@app.route('/reports-analytics')
def reports_analytics():
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')
    
    dashboard_data = get_dashboard_data()
    return render_template('report&analytics.html',
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
    
    return render_template('HR/employeeHR.html')
    

@app.route('/leave-status')
def leave_status():
    """Leave Status Page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect('/login-page')
    
    dashboard_data = get_dashboard_data()
    leave_status_data = get_leave_status_data()
    
    # Convert data to JSON for JavaScript
    leave_status_json = json.dumps(leave_status_data)
    
    return render_template('leaveStatus.html',
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
    
    return render_template('HR/leaveRequestHR.html')
    
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
    
    return render_template('HR/analyticsHR.html')
    
    return render_template('HR/analyticsHR.html')
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
    
    return render_template('HRDashboard.html')

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

if __name__ == '__main__':
    print("🚀 Starting DayOffly server...")
    print("🌐 Application will be available at: http://localhost:5000")
    print("📁 Static files should be in: /static/ folder")
    app.run(debug=True, host='0.0.0.0', port=5000)