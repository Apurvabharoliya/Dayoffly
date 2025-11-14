# app.py - Fixed and Optimized Main Application File
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_from_directory
import mysql.connector
import os
from datetime import datetime, date, timedelta
import json
import jwt
from flask_cors import CORS

# All the Imports for blueprints
from login_backend import login_bp
from profilebackend import profile_bp 
from hr_backend import hr_bp
from leave_requests_backend import leave_requests_bp
from analytics_backend import analytics_bp 
from employeeHR import employee_bp
from settingsHR_backend import settingsHR_bp
from reports_analytics_backendEmployee import reports_analytics_bp

print("="*70)
print("🚀 DayOffly Flask Application Starting")
print("="*70)

app = Flask(__name__, template_folder='..', static_folder='..')
app.secret_key = 'your-secret-key-here-change-in-production'

# CORS Configuration
CORS(app, 
     supports_credentials=True, 
     origins=[
         "http://localhost:5000", 
         "http://127.0.0.1:5000", 
         "http://127.0.0.1:5500", 
         "http://localhost:5500",
         "http://127.0.0.1:3000", 
         "http://localhost:3000"
     ],
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
    """Create database connection with error handling"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"❌ Database connection failed: {e}")
        return None

def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        JWT_SECRET_KEY = 'your-jwt-secret-key-change-in-production'
        JWT_ALGORITHM = 'HS256'
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("⚠️ JWT token expired")
        return None
    except jwt.InvalidTokenError:
        print("⚠️ Invalid JWT token")
        return None

# ===== DASHBOARD DATA FUNCTIONS =====

def get_dashboard_data(user_id=None):
    """Get dashboard data from database - FIXED VERSION"""
    if user_id is None:
        if 'user' in session and session['user']:
            user_id = session['user']['user_id']
        else:
            return get_mock_data()

    conn = get_db_connection()
    if not conn:
        print("⚠️ Failed to connect to database, using mock data")
        return get_mock_data()

    try:
        cursor = conn.cursor(dictionary=True)

        # Get user info with proper error handling
        cursor.execute("""
            SELECT u.user_id, u.user_name, u.email, u.designation, u.employee_type,
                   d.department_name, r.role_name
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN role r ON u.role_id = r.role_id
            WHERE u.user_id = %s
        """, (user_id,))
        user_info = cursor.fetchone()

        if not user_info:
            print(f"⚠️ User {user_id} not found, using default data")
            user_info = {
                'user_name': 'Employee User', 
                'designation': 'Web Developer', 
                'employee_type': 'Full-time',
                'department_name': 'IT',
                'role_name': 'Employee'
            }
        
        # FIXED: Ensure user_info has all required fields
        user_info = user_info or {}
        user_info['user_id'] = user_info.get('user_id', user_id)
        user_info['user_name'] = user_info.get('user_name', 'Employee User')
        user_info['designation'] = user_info.get('designation', 'Employee')
        user_info['department_name'] = user_info.get('department_name', 'General')
        
        # Get leave balance
        cursor.execute("""
            SELECT
                leave_type,
                total_leaves,
                used_leaves,
                remaining_leaves,
                is_paid
            FROM leave_balance
            WHERE user_id = %s AND leave_year = YEAR(CURDATE())
        """, (user_id,))
        leave_balance_data = cursor.fetchall()

        # Calculate totals
        total_allowed = 0
        total_used = 0
        total_remaining = 0
        paid_leaves = 0
        casual_leaves = 0
        
        for balance in leave_balance_data:
            total_allowed += balance['total_leaves'] or 0
            total_used += balance['used_leaves'] or 0
            total_remaining += balance['remaining_leaves'] or 0
            if balance['is_paid']:
                paid_leaves += balance['remaining_leaves'] or 0
            else:
                casual_leaves += balance['remaining_leaves'] or 0

        if not leave_balance_data:
            print(f"⚠️ No leave balance found for user {user_id}")
            total_allowed = 20
            total_used = 0
            total_remaining = 20
            paid_leaves = 12
            casual_leaves = 8
        
        # Get holidays
        cursor.execute("""
            SELECT holiday_name, holiday_date
            FROM holidays
            WHERE holiday_date >= CURDATE()
            ORDER BY holiday_date
            LIMIT 10
        """)
        holidays_data = cursor.fetchall()

        holidays = []
        for holiday in holidays_data:
            holidays.append({
                "name": holiday['holiday_name'],
                "date": holiday['holiday_date'].strftime('%Y-%m-%d') if holiday['holiday_date'] else ''
            })

        today = date.today()
        upcoming_holidays_count = len(holidays)
        
        # Chart data - Dynamic from database
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        leaves_taken = [0] * 12
        days_present = [0] * 12
        
        try:
            cursor.execute("""
                SELECT 
                    MONTH(start_date) as month, 
                    COUNT(*) as leaves_count
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
                if 0 <= month_index < 12:
                    leaves_taken[month_index] = record['leaves_count']
            
            # Calculate days present
            working_days_per_month = 22
            for i in range(12):
                days_present[i] = max(0, working_days_per_month - leaves_taken[i])
                
            print(f"✅ Dynamic chart data loaded for user {user_id}")
            
        except Exception as e:
            print(f"⚠️ Using fallback chart data: {e}")
            leaves_taken = [2, 3, 1, 4, 2, 3, 1, 2, 3, 2, 1, 0]
            days_present = [20, 19, 21, 18, 20, 19, 21, 20, 19, 20, 21, 22]
        
        dashboard_data = {
            "user_info": user_info,
            "stats": {
                "totalAllowed": total_allowed,
                "totalUsed": total_used,
                "totalRemaining": total_remaining,
                "upcomingHolidays": upcoming_holidays_count,
                "paidLeaves": paid_leaves,
                "casualLeaves": casual_leaves,
                "employeeType": user_info.get('employee_type', 'Full-time')
            },
            "chartData": {
                "months": months,
                "leavesTaken": leaves_taken,
                "daysPresent": days_present
            },
            "holidays": holidays
        }
        
        print(f"✅ Dashboard data loaded successfully for user {user_id}")
        return dashboard_data
        
    except Exception as e:
        print(f"❌ Error loading dashboard data: {e}")
        import traceback
        traceback.print_exc()
        return get_mock_data()
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

def get_mock_data():
    """Return mock data if database fails"""
    return {
        "user_info": {
            "user_name": "Jane Austen", 
            "designation": "Web Developer", 
            "employee_type": "Full-time",
            "department_name": "IT",
            "role_name": "Employee"
        },
        "stats": {
            "totalAllowed": 20, 
            "totalUsed": 15, 
            "totalRemaining": 5, 
            "upcomingHolidays": 4,
            "paidLeaves": 3,
            "casualLeaves": 2,
            "employeeType": "Full-time"
        },
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
    """Get leave status data for the employee - FIXED VERSION"""
    if user_id is None:
        if 'user' in session and session['user']:
            user_id = session['user']['user_id']
        else:
            return {"error": "Authentication required", "employeeData": {}, "leaveRequests": []}

    conn = get_db_connection()
    if not conn:
        return {"error": "Database connection failed", "employeeData": {}, "leaveRequests": []}

    try:
        cursor = conn.cursor(dictionary=True)

        # FIXED: Get employee basic info with better error handling
        cursor.execute("""
            SELECT u.user_id, u.user_name, u.designation, u.employee_type,
                   d.department_name, u.email, u.contact_number
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            WHERE u.user_id = %s
        """, (user_id,))
        employee_info = cursor.fetchone()

        if not employee_info:
            print(f"⚠️ Employee {user_id} not found")
            # FIXED: Return proper employee data even if not found
            employee_info = {
                'user_name': 'Employee User',
                'designation': 'Employee',
                'department_name': 'General Department',
                'user_id': user_id,
                'employee_type': 'Full-time'
            }
        else:
            # FIXED: Ensure all required fields are present
            employee_info['user_name'] = employee_info.get('user_name', 'Employee User')
            employee_info['designation'] = employee_info.get('designation', 'Employee')
            employee_info['department_name'] = employee_info.get('department_name', 'General Department')
        
        # Get leave balance
        cursor.execute("""
            SELECT
                SUM(total_leaves) as total_leaves,
                SUM(used_leaves) as used_leaves,
                SUM(remaining_leaves) as remaining_leaves,
                SUM(CASE WHEN is_paid = 1 THEN remaining_leaves ELSE 0 END) as paid_leaves,
                SUM(CASE WHEN is_paid = 0 THEN remaining_leaves ELSE 0 END) as casual_leaves
            FROM leave_balance
            WHERE user_id = %s AND leave_year = YEAR(CURDATE())
        """, (user_id,))
        leave_balance_data = cursor.fetchone()

        if leave_balance_data and leave_balance_data['remaining_leaves'] is not None:
            total_leave_balance = leave_balance_data['remaining_leaves']
            paid_leave_balance = leave_balance_data['paid_leaves'] or 0
            casual_leave_balance = leave_balance_data['casual_leaves'] or 0
        else:
            total_leave_balance = 20
            paid_leave_balance = 12
            casual_leave_balance = 8
        
        # Get leave applications
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
                la.document_path,
                u.email as employee_email,
                u.contact_number as employee_contact,
                approver.user_name as approver_name,
                approver.designation as approver_designation,
                approver.email as approver_email,
                approver.contact_number as approver_contact
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN users_master approver ON u.approver_id = approver.user_id
            WHERE la.user_id = %s
            ORDER BY la.applied_on DESC
        """, (user_id,))
        
        leave_applications = cursor.fetchall()
        
        print(f"✅ Found {len(leave_applications)} leave applications for user {user_id}")
        
        # Convert database results to match JavaScript structure
        formatted_requests = []
        for application in leave_applications:
            # Calculate balance
            if leave_balance_data:
                balance_before = leave_balance_data['total_leaves'] or 0
                balance_after = leave_balance_data['remaining_leaves'] or 0
            else:
                balance_before = 20
                balance_after = 20
            
            # Format documents
            documents = []
            if application.get('attachment'):
                documents.append(application['attachment'])
            if application.get('document_path'):
                documents.append(application['document_path'])
            
            # Create logs
            logs = [
                {
                    "time": application['applied_on'].strftime('%Y-%m-%d %H:%M') if application.get('applied_on') else 'N/A',
                    "entry": "Applied by employee"
                }
            ]
            
            status = application.get('leave_status', 'pending')
            if status in ['approved', 'declined']:
                action = "Approved" if status == 'approved' else "Declined"
                logs.append({
                    "time": application['applied_on'].strftime('%Y-%m-%d %H:%M') if application.get('applied_on') else 'N/A',
                    "entry": f"{action} by {application.get('approver_name') or 'Manager'}"
                })
            
            formatted_request = {
                "requestId": f"RID{application['leave_id']}",
                "empName": employee_info['user_name'],  # FIXED: Use employee_info instead of hardcoded name
                "empId": f"EMP{employee_info['user_id']}",
                "department": employee_info.get('department_name', 'N/A'),
                "designation": employee_info.get('designation', 'N/A'),
                "leaveType": application['leave_type'],
                "startDate": application['start_date'].strftime('%Y-%m-%d') if application.get('start_date') else 'N/A',
                "endDate": application['end_date'].strftime('%Y-%m-%d') if application.get('end_date') else 'N/A',
                "totalDays": application['total_days'],
                "appliedDate": application['applied_on'].strftime('%Y-%m-%d') if application.get('applied_on') else 'N/A',
                "status": status,
                "balanceBefore": balance_before,
                "balanceAfter": max(0, balance_after),
                "approverName": application.get('approver_name') or 'HR Manager',
                "approverDesignation": application.get('approver_designation') or 'Manager',
                "decisionDate": application['applied_on'].strftime('%Y-%m-%d') if application.get('applied_on') else 'N/A',
                "remarks": application.get('reason') or 'Waiting for approval',
                "documents": documents,
                "logs": logs,
                "documentPath": application.get('document_path')
            }
            formatted_requests.append(formatted_request)
        
        leave_status_data = {
            "employeeData": {
                "empName": employee_info['user_name'],  # FIXED: Use actual employee name
                "empId": f"EMP{employee_info['user_id']}",
                "department": employee_info.get('department_name', 'N/A'),
                "designation": employee_info.get('designation', 'N/A'),
                "employeeType": employee_info.get('employee_type', 'Full-time'),
                "totalLeaveBalance": total_leave_balance,
                "paidLeaveBalance": paid_leave_balance,
                "casualLeaveBalance": casual_leave_balance
            },
            "leaveRequests": formatted_requests
        }
        
        print(f"✅ Leave status data loaded: {len(formatted_requests)} requests")
        return leave_status_data
        
    except Exception as e:
        print(f"❌ Error loading leave status data: {e}")
        import traceback
        traceback.print_exc()
        return {"error": "Failed to load leave status data", "employeeData": {}, "leaveRequests": []}
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

def get_leave_types(user_id=None):
    """Get available leave types from database"""
    conn = get_db_connection()
    if not conn:
        return {"leaveTypes": ["Casual Leave", "Sick Leave", "Vacation", "Maternity Leave", "Paternity Leave"]}

    try:
        cursor = conn.cursor(dictionary=True)

        # Get user's employee type
        user_employee_type = "Full-time"
        if user_id:
            cursor.execute("SELECT employee_type FROM users_master WHERE user_id = %s", (user_id,))
            user_result = cursor.fetchone()
            if user_result and user_result.get('employee_type'):
                user_employee_type = user_result['employee_type']

        # Get all leave types
        cursor.execute("""
            SELECT leave_type, rules, carry_forward_allowed, is_paid, max_days, 
                   employee_types, requires_document
            FROM leave_types
            ORDER BY leave_type
        """)

        leave_types = cursor.fetchall()

        # Format the data for frontend
        formatted_types = []
        for leave_type in leave_types:
            # Check if available for user's employee type
            employee_types = leave_type.get('employee_types', '')
            if employee_types and user_employee_type not in employee_types:
                continue

            max_days = leave_type.get('max_days', 20)
            if user_employee_type == 'Intern' and leave_type.get('is_paid'):
                max_days = 8

            formatted_types.append({
                'name': leave_type['leave_type'],
                'rules': leave_type.get('rules') or 'Standard leave rules apply',
                'carryForwardAllowed': bool(leave_type.get('carry_forward_allowed')),
                'isPaid': bool(leave_type.get('is_paid')),
                'maxDays': max_days,
                'requiresDocument': bool(leave_type.get('requires_document')),
                'availableForEmployeeType': user_employee_type
            })

        return {"leaveTypes": formatted_types}

    except Exception as e:
        print(f"❌ Error loading leave types: {e}")
        return {"leaveTypes": ["Casual Leave", "Sick Leave", "Vacation", "Maternity Leave", "Paternity Leave"]}
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

# ===== NEW API ENDPOINTS FOR LEAVE APPLICATION =====

@app.route('/api/leave-balance/<int:user_id>', methods=['GET'])
def api_leave_balance(user_id):
    """API endpoint to get leave balance for a specific user"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT leave_type, total_leaves, used_leaves, remaining_leaves, is_paid, leave_year
            FROM leave_balance 
            WHERE user_id = %s AND leave_year = YEAR(CURDATE())
            ORDER BY leave_type
        """, (user_id,))
        
        balance = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'balance': balance
        })
        
    except Exception as e:
        print(f"Error fetching leave balance: {e}")
        # Return fallback data
        fallback_balance = [
            {'leave_type': 'Sick Leave', 'total_leaves': 7.0, 'used_leaves': 2.0, 'remaining_leaves': 5.0, 'is_paid': 0},
            {'leave_type': 'Vacation', 'total_leaves': 5.0, 'used_leaves': 1.0, 'remaining_leaves': 4.0, 'is_paid': 0},
            {'leave_type': 'Casual Leave', 'total_leaves': 3.0, 'used_leaves': 0.0, 'remaining_leaves': 3.0, 'is_paid': 0}
        ]
        return jsonify({
            'success': True,
            'balance': fallback_balance
        })

@app.route('/api/user-info/<int:user_id>', methods=['GET'])
def api_user_info(user_id):
    """API endpoint to get user information"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT user_id, user_name, email, department_id, role_id, designation,
                   contact_number, user_role, employee_type
            FROM users_master 
            WHERE user_id = %s
        """, (user_id,))
        
        user_info = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user_info:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user_info': user_info
        })
        
    except Exception as e:
        print(f"Error fetching user info: {e}")
        # Return fallback user info
        fallback_user = {
            'user_id': user_id,
            'user_name': 'John Smith',
            'email': 'john.smith@company.com',
            'department_id': 1,
            'role_id': 1,
            'designation': 'Manager',
            'contact_number': '555-1001',
            'user_role': 'Employee',
            'employee_type': 'Full-time'
        }
        return jsonify({
            'success': True,
            'user_info': fallback_user
        })

@app.route('/api/user-role/<int:user_id>', methods=['GET'])
def api_user_role(user_id):
    """API endpoint to get user role information"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT um.user_id, um.user_role, um.department_id, d.department_name
            FROM users_master um
            LEFT JOIN department d ON um.department_id = d.department_id
            WHERE um.user_id = %s
        """, (user_id,))
        
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user_data:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Check if user is HR
        is_hr = user_data['user_role'] == 'HR' or user_data.get('department_name') == 'Human Resources'
        
        return jsonify({
            'success': True,
            'is_hr': is_hr,
            'user_role': user_data['user_role'],
            'department': user_data.get('department_name', 'Unknown')
        })
        
    except Exception as e:
        print(f"Error fetching user role: {e}")
        return jsonify({
            'success': True,
            'is_hr': False,
            'user_role': 'Employee',
            'department': 'Unknown'
        })

@app.route('/api/leave-history/<int:user_id>', methods=['GET'])
def api_leave_history(user_id):
    """API endpoint to get leave history for a user"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT leave_id, leave_type, start_date, end_date, leave_days, reason, 
                   leave_status, applied_on, hr_remarks
            FROM leave_application 
            WHERE user_id = %s 
            ORDER BY applied_on DESC
            LIMIT 20
        """, (user_id,))
        
        history = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert dates to string format for JSON serialization
        for record in history:
            if record['start_date']:
                record['start_date'] = record['start_date'].isoformat()
            if record['end_date']:
                record['end_date'] = record['end_date'].isoformat()
            if record['applied_on']:
                record['applied_on'] = record['applied_on'].isoformat()
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        print(f"Error fetching leave history: {e}")
        return jsonify({
            'success': True,
            'history': []
        })

@app.route('/api/leave-types', methods=['GET'])
def api_leave_types():
    """API endpoint to get available leave types"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)

        # Get all leave types
        cursor.execute("""
            SELECT leave_type, leave_name, is_paid, max_days, employee_types, 
                   requires_document, rules, carry_forward_allowed 
            FROM leave_types 
            ORDER BY leave_name
        """)
        
        leave_types = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'leaveTypes': leave_types
        })
        
    except Exception as e:
        print(f"Error fetching leave types: {e}")
        # Return default leave types
        default_leave_types = [
            {'leave_type': 'PAID', 'leave_name': 'Paid Leave', 'requires_document': 0},
            {'leave_type': 'SICK', 'leave_name': 'Sick Leave', 'requires_document': 1},
            {'leave_type': 'CASUAL', 'leave_name': 'Casual Leave', 'requires_document': 0},
            {'leave_type': 'Vacation', 'leave_name': 'Vacation Leave', 'requires_document': 0},
            {'leave_type': 'Maternity Leave', 'leave_name': 'Maternity Leave', 'requires_document': 1},
            {'leave_type': 'Paternity Leave', 'leave_name': 'Paternity Leave', 'requires_document': 0}
        ]
        return jsonify({
            'success': True,
            'leaveTypes': default_leave_types
        })

# ===== IMPROVED HR LEAVE REQUESTS ENDPOINT =====
@app.route('/api/hr/leave-requests', methods=['GET'])
def api_hr_leave_requests():
    """API endpoint for HR to get all leave requests - IMPROVED VERSION"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)

        # Improved query with all required fields
        cursor.execute("""
            SELECT 
                la.leave_id,
                la.user_id, 
                um.user_name, 
                um.employee_type,
                d.department_name, 
                la.leave_type, 
                la.leave_category,
                la.start_date, 
                la.end_date, 
                la.leave_days, 
                la.reason,
                la.contact_info, 
                la.document_path, 
                la.leave_status,
                la.applied_on, 
                la.hr_remarks, 
                la.approver_id,
                la.handover_person
            FROM leave_application la
            JOIN users_master um ON la.user_id = um.user_id
            LEFT JOIN department d ON um.department_id = d.department_id
            ORDER BY la.applied_on DESC
        """)
        
        leave_requests = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert dates to string format
        for request in leave_requests:
            for date_field in ['start_date', 'end_date', 'applied_on']:
                if request.get(date_field) and hasattr(request[date_field], 'strftime'):
                    request[date_field] = request[date_field].isoformat()
        
        print(f"✅ Returning {len(leave_requests)} leave requests for HR")
        
        return jsonify({
            'success': True,
            'data': leave_requests
        })
        
    except Exception as e:
        print(f"❌ Error fetching HR leave requests: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

# ===== IMPROVED LEAVE APPLICATION SUBMISSION ENDPOINT =====
@app.route('/api/leave-application', methods=['POST'])
def api_submit_leave_application():
    """API endpoint to submit a leave application - IMPROVED VERSION"""
    try:
        # Check authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Authentication required'}), 401

        token = auth_header[7:]
        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401

        user_id = payload['user_id']
        data = request.get_json()
        print(f"📝 Submitting leave application for user {user_id}: {data}")

        # Validate required fields
        required_fields = ['leaveType', 'startDate', 'endDate', 'reason']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)

        # Get user info
        cursor.execute("""
            SELECT employee_type, contact_number
            FROM users_master
            WHERE user_id = %s
        """, (user_id,))
        user_info = cursor.fetchone()
        if not user_info:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404

        employee_type = user_info['employee_type'] or 'Full-time'
        contact_info = data.get('contactInfo', user_info['contact_number'] or '')

        # Calculate leave days
        from datetime import datetime
        start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        end_date = datetime.strptime(data['endDate'], '%Y-%m-%d').date()
        leave_days = (end_date - start_date).days + 1

        # Handle half day option
        half_day = data.get('halfDay', False)
        half_day_option = data.get('halfDayOption', 'first_half')

        if half_day:
            leave_days = 0.5
            # For half day, set end date same as start date
            end_date = start_date

        # Determine leave category based on leave type
        leave_type = data['leaveType']
        if 'Casual' in leave_type:
            leave_category = 'casual'
        elif 'Sick' in leave_type:
            leave_category = 'sick'
        else:
            leave_category = 'paid'

        # Handle attachment
        attachment = None
        if data.get('attachment'):
            attachment = data['attachment']  # Base64 string

        # Handle handover person
        handover_person = data.get('handover', '')

        # Insert leave application
        query = """
            INSERT INTO leave_application
            (user_id, leave_type, leave_category, start_date, end_date, leave_days,
             reason, contact_info, attachment, employee_type, leave_status, applied_on,
             handover_person)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', NOW(), %s)
        """

        values = (
            user_id,
            leave_type,
            leave_category,
            data['startDate'],
            data['endDate'],
            leave_days,
            data['reason'],
            contact_info,
            attachment,
            employee_type,
            handover_person
        )

        cursor.execute(query, values)
        conn.commit()

        leave_id = cursor.lastrowid
        cursor.close()
        conn.close()

        print(f"✅ Leave application submitted successfully: ID {leave_id}")

        return jsonify({
            'success': True,
            'message': 'Leave application submitted successfully!',
            'leave_id': leave_id
        })

    except Exception as e:
        print(f"❌ Error submitting leave application: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/api/hr/update-status', methods=['POST'])
def api_hr_update_status():
    """API endpoint for HR to update leave request status"""
    try:
        data = request.get_json()
        
        required_fields = ['request_id', 'status', 'approved_by']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Missing required field: {field}'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)

        # Get the leave application details first
        cursor.execute("""
            SELECT user_id, leave_type, leave_days 
            FROM leave_application 
            WHERE leave_id = %s
        """, (data['request_id'],))
        
        application = cursor.fetchone()
        if not application:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Leave application not found'}), 404
        
        app_user_id, leave_type, leave_days = application
        
        # Update leave application status
        update_query = """
            UPDATE leave_application 
            SET leave_status = %s, 
                hr_remarks = %s,
                approved_by_hr = %s,
                approver_id = %s
            WHERE leave_id = %s
        """
        
        approved_by_hr = 1 if data['status'] == 'approved' else 0
        
        cursor.execute(update_query, (
            data['status'],
            data.get('approval_reason', ''),
            approved_by_hr,
            data['approved_by'],
            data['request_id']
        ))
        
        # If rejected, revert the leave balance deduction
        if data['status'] == 'declined':
            revert_balance_query = """
                UPDATE leave_balance 
                SET used_leaves = used_leaves - %s, 
                    remaining_leaves = remaining_leaves + %s,
                    updated_at = NOW()
                WHERE user_id = %s AND leave_type = %s AND leave_year = YEAR(CURDATE())
            """
            cursor.execute(revert_balance_query, (leave_days, leave_days, app_user_id, leave_type))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"Leave status updated successfully. Request ID: {data['request_id']}, Status: {data['status']}")
        
        return jsonify({
            'success': True,
            'message': f'Leave application {data["status"]} successfully'
        })
        
    except Exception as e:
        print(f"Error updating leave status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def api_health():
    """Health check endpoint for API"""
    try:
        conn = get_db_connection()
        if conn:
            conn.close()
            db_status = 'connected'
        else:
            db_status = 'disconnected'
        
        return jsonify({
            'success': True,
            'status': 'running',
            'database': db_status,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'error',
            'message': str(e)
        }), 500

# ===== STATIC FILE ROUTES =====

@app.route('/loginPage/<path:filename>')
def login_page_static(filename):
    """Serve static files from loginPage directory"""
    return send_from_directory('../loginPage', filename)

@app.route('/HRDashboard/<path:filename>')
def hr_dashboard_static(filename):
    """Serve static files from HRDashboard directory"""
    return send_from_directory('../HRDashboard', filename)

@app.route('/EmployeeDashboard/<path:filename>')
def employee_dashboard_static(filename):
    """Serve static files from EmployeeDashboard directory"""
    return send_from_directory('../EmployeeDashboard', filename)

@app.route('/leaveapplication/<path:filename>')
def leaveapplication_static(filename):
    """Serve static files from leaveapplication directory"""
    return send_from_directory('../leaveapplication', filename)

@app.route('/Calendar/<path:filename>')
def calendar_static(filename):
    """Serve static files from Calendar directory"""
    return send_from_directory('../Calendar', filename)

@app.route('/Report&analytics/<path:filename>')
def report_analytics_static(filename):
    """Serve static files from Report&analytics directory"""
    return send_from_directory('../Report&analytics', filename)

@app.route('/LeaveStatus/<path:filename>')
def leave_status_static(filename):
    """Serve static files from LeaveStatus directory"""
    return send_from_directory('../LeaveStatus', filename)

@app.route('/profile/<path:filename>')
def profile_static(filename):
    """Serve static files from profile directory"""
    return send_from_directory('../profile', filename)

@app.route('/images/<path:filename>')
def images_static(filename):
    """Serve static files from images directory"""
    return send_from_directory('images', filename)

# ===== API ROUTES =====

@app.route('/api/dashboard-data')
def api_dashboard_data():
    """API endpoint for employee dashboard data"""
    # Check for JWT token in Authorization header
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]
        payload = verify_jwt_token(token)

        if payload:
            user_id = payload['user_id']
            dashboard_data = get_dashboard_data(user_id)
            return jsonify(dashboard_data)
        else:
            return jsonify({'error': 'Invalid or expired token'}), 401
    else:
        # Fallback to session-based authentication
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401

        dashboard_data = get_dashboard_data()
        return jsonify(dashboard_data)

@app.route('/api/leave-status-data')
def api_leave_status_data():
    """API endpoint for employee leave status data - FIXED VERSION"""
    # Check for JWT token
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]
        payload = verify_jwt_token(token)

        if payload:
            user_id = payload['user_id']
            leave_status_data = get_leave_status_data(user_id)
            return jsonify(leave_status_data)
        else:
            # Return mock data for demo
            return jsonify(get_mock_leave_status_data())
    else:
        # Fallback to session
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify(get_mock_leave_status_data())

        leave_status_data = get_leave_status_data()
        return jsonify(leave_status_data)

def get_mock_leave_status_data():
    """Mock leave status data"""
    return {
        "employeeData": {
            "empName": "Jane Austen",
            "empId": "EMP30002",
            "department": "IT",
            "designation": "Web Developer",
            "employeeType": "Full-time",
            "totalLeaveBalance": 6,
            "paidLeaveBalance": 4,
            "casualLeaveBalance": 2
        },
        "leaveRequests": []
    }

@app.route('/api/calendar-events')
def api_calendar_events():
    """API endpoint to get calendar events (holidays and leave applications)"""
    # Check for JWT token
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]
        payload = verify_jwt_token(token)

        if payload:
            user_id = payload['user_id']
        else:
            return jsonify({'error': 'Invalid or expired token'}), 401
    else:
        # Fallback to session
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401
        user_id = session['user']['user_id']

    conn = get_db_connection()
    if not conn:
        return jsonify({'events': []}), 200

    try:
        cursor = conn.cursor(dictionary=True)

        # Get holidays
        cursor.execute("""
            SELECT holiday_name, holiday_date, holiday_type
            FROM holidays
            WHERE YEAR(holiday_date) = YEAR(CURDATE())
            ORDER BY holiday_date
        """)
        holidays = cursor.fetchall()

        # Get user's leave applications
        cursor.execute("""
            SELECT leave_type, start_date, end_date, leave_status
            FROM leave_application
            WHERE user_id = %s AND YEAR(start_date) = YEAR(CURDATE())
            ORDER BY start_date
        """, (user_id,))
        leave_applications = cursor.fetchall()

        events = []

        # Add holidays to events
        for holiday in holidays:
            events.append({
                'title': holiday['holiday_name'],
                'start': holiday['holiday_date'].strftime('%Y-%m-%d') if holiday['holiday_date'] else '',
                'type': 'holiday',
                'className': 'holiday-event'
            })

        # Add leave applications to events
        for leave in leave_applications:
            status_class = f"leave-{leave['leave_status']}"
            events.append({
                'title': f"{leave['leave_type']} ({leave['leave_status'].title()})",
                'start': leave['start_date'].strftime('%Y-%m-%d') if leave['start_date'] else '',
                'end': leave['end_date'].strftime('%Y-%m-%d') if leave['end_date'] else '',
                'type': 'leave',
                'status': leave['leave_status'],
                'className': status_class
            })

        cursor.close()
        conn.close()

        return jsonify({'events': events}), 200

    except Exception as e:
        print(f"❌ Error loading calendar events: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'events': []}), 200

@app.route('/api/upload-document', methods=['POST'])
def api_upload_document():
    """API endpoint to handle document uploads"""
    # Check for JWT token
    auth_header = request.headers.get('Authorization')

    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]
        payload = verify_jwt_token(token)

        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
    else:
        # Fallback to session
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401

    if 'document' not in request.files:
        return jsonify({'error': 'No document provided'}), 400

    file = request.files['document']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Validate file type
    allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
    file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

    if file_extension not in allowed_extensions:
        return jsonify({'error': 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX'}), 400

    try:
        # Create uploads directory if it doesn't exist
        upload_folder = os.path.join(os.getcwd(), '..', 'uploads', 'leave_documents')
        os.makedirs(upload_folder, exist_ok=True)

        # Generate unique filename
        from werkzeug.utils import secure_filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(file.filename)
        unique_filename = f"{timestamp}_{filename}"

        # Save file
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)

        # Return relative path for database storage
        relative_path = f"uploads/leave_documents/{unique_filename}"

        print(f"✅ Document uploaded successfully: {relative_path}")

        return jsonify({
            'success': True,
            'message': 'Document uploaded successfully',
            'document_path': relative_path,
            'filename': filename
        }), 200

    except Exception as e:
        print(f"❌ Error uploading document: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to upload document'}), 500

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    upload_folder = os.path.join(os.getcwd(), '..', 'uploads')
    return send_from_directory(upload_folder, filename)

# ===== PAGE ROUTES =====

@app.route('/')
def index():
    """Redirect to login page"""
    return redirect(url_for('login_bp.login_page'))

@app.route('/employee-dashboard')
def employee_dashboard():
    """Employee dashboard page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    if session['user']['role'] != 'Employee':
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('EmployeeDashboard/employeeDashboard.html')

@app.route('/hr-dashboard')
def hr_dashboard():
    """HR dashboard page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    if session['user']['role'] != 'HR':
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('HRDashboard/HRdashboard.html')

@app.route('/leave-application')
def leave_application():
    """Leave application page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('leaveapplication/leaveapplication.html')

@app.route('/leave-status')
def leave_status():
    """Leave status page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('LeaveStatus/leaveStatus.html')

@app.route('/calendar')
def calendar():
    """Calendar page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('Calendar/calendar.html')

@app.route('/profile')
def profile():
    """Profile page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('profile/profile.html')

@app.route('/reports-analytics')
def reports_analytics():
    """Reports and analytics page"""
    if 'logged_in' not in session or not session['logged_in']:
        return redirect(url_for('login_bp.login_page'))
    
    return render_template('Report&analytics/reportAnalytics.html')

# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(403)
def forbidden(error):
    """Handle 403 errors"""
    return jsonify({'error': 'Access forbidden'}), 403

# ===== HEALTH CHECK =====

@app.route('/health')
def health_check():
    """Health check endpoint"""
    conn = get_db_connection()
    if conn:
        conn.close()
        db_status = 'connected'
    else:
        db_status = 'disconnected'
    
    return jsonify({
        'status': 'running',
        'database': db_status,
        'timestamp': datetime.now().isoformat()
    }), 200

# ===== APPLICATION STARTUP =====

if __name__ == '__main__':
    print("="*70)
    print("✅ Flask application initialized successfully")
    print("="*70)
    print("🌐 Server starting on http://127.0.0.1:5000")
    
    app.run(debug=True, host='127.0.0.1', port=5000)