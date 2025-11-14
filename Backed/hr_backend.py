# hr_backend.py - Fixed version with proper data fetching
from flask import Blueprint, request, jsonify, session
from functools import wraps
import mysql.connector
from datetime import datetime

# Create Blueprint for HR routes
hr_bp = Blueprint('hr', __name__)

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
        print(f"❌ Database connection failed: {e}")
        return None

def hr_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Simple pass-through for now - add proper auth in production
        return f(*args, **kwargs)
    return decorated_function

@hr_bp.route('/hr/dashboard-data', methods=['GET'])
@hr_required
def hr_dashboard_data():
    """Get HR dashboard data - FIXED VERSION"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            'success': False, 
            'message': 'Database connection failed',
            'leave_requests': [],
            'dashboard_stats': {}
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Total employees (active)
        cursor.execute("SELECT COUNT(*) as total FROM users_master WHERE is_active = 1")
        total_employees = cursor.fetchone()['total']

        # Leave request counts by status
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN leave_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN leave_status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN leave_status = 'declined' THEN 1 ELSE 0 END) as rejected
            FROM leave_application
        """)
        counts = cursor.fetchone()

        # Get recent leave requests for the dashboard overview
        cursor.execute("""
            SELECT 
                la.leave_id,
                u.user_name AS employee,
                la.leave_type AS type,
                CONCAT(DATE_FORMAT(la.start_date, '%Y-%m-%d'), ' to ', 
                       DATE_FORMAT(la.end_date, '%Y-%m-%d')) as dates,
                CONCAT(DATEDIFF(la.end_date, la.start_date) + 1, ' days') as duration,
                la.leave_status AS status,
                d.department_name AS department,
                u.employee_type
            FROM leave_application la
            JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            ORDER BY la.applied_on DESC
            LIMIT 10
        """)
        recent_requests = cursor.fetchall()

        # Get leave type distribution
        cursor.execute("""
            SELECT 
                la.leave_type,
                COUNT(*) as count
            FROM leave_application la
            WHERE la.leave_status = 'approved'
            GROUP BY la.leave_type
            ORDER BY count DESC
        """)
        leave_types = cursor.fetchall()

        # Get monthly trends
        cursor.execute("""
            SELECT 
                MONTH(applied_on) as month,
                SUM(CASE WHEN leave_status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN leave_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN leave_status = 'declined' THEN 1 ELSE 0 END) as rejected
            FROM leave_application
            WHERE YEAR(applied_on) = YEAR(CURDATE())
            GROUP BY MONTH(applied_on)
            ORDER BY month
        """)
        monthly_data = cursor.fetchall()

        # Initialize arrays for all 12 months
        approved = [0] * 12
        pending = [0] * 12
        rejected = [0] * 12

        for row in monthly_data:
            month_idx = row['month'] - 1
            if 0 <= month_idx < 12:
                approved[month_idx] = row['approved']
                pending[month_idx] = row['pending']
                rejected[month_idx] = row['rejected']

        # Get user info from session
        user_info = {
            'user_name': 'HR Manager',
            'designation': 'Human Resources Manager',
            'department': 'HR'
        }

        if 'user' in session:
            user_info = {
                'user_name': session['user'].get('user_name', 'HR Manager'),
                'designation': session['user'].get('designation', 'HR Manager'),
                'department': session['user'].get('department_name', 'HR')
            }

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'total_employees': total_employees,
            'leave_requests': recent_requests,
            'dashboard_stats': {
                'leave_requests': {
                    'total': counts['total'] or 0,
                    'pending': counts['pending'] or 0,
                    'approved': counts['approved'] or 0,
                    'rejected': counts['rejected'] or 0
                },
                'leave_types': leave_types,
                'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                'monthly_trends': {
                    'approved': approved,
                    'pending': pending,
                    'rejected': rejected
                }
            },
            'user_info': user_info
        })

    except Exception as e:
        print(f"❌ Error in hr_dashboard_data: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'message': f'Internal server error: {str(e)}',
            'leave_requests': [],
            'dashboard_stats': {}
        }), 500

@hr_bp.route('/hr/leave-requests', methods=['GET'])
@hr_required
def hr_leave_requests():
    """Get all leave requests for HR - FIXED VERSION"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            'success': False,
            'message': 'Database connection failed',
            'data': []
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'leave_application'")
        if not cursor.fetchone():
            return jsonify({
                'success': True,
                'data': [],
                'message': 'No leave applications table found'
            })

        # Get all leave requests with proper joins
        query = """
            SELECT 
                la.leave_id as id,
                u.user_name AS employee_name,
                u.user_id AS employee_id,
                d.department_name AS department,
                u.employee_type,
                la.leave_type,
                la.start_date,
                la.end_date,
                DATEDIFF(la.end_date, la.start_date) + 1 AS total_days,
                la.applied_on AS applied_date,
                la.leave_status AS hr_approval_status,
                la.leave_status AS status,
                la.reason,
                la.document_path,
                la.hr_remarks AS hr_approval_reason,
                approver.user_name AS approved_by,
                la.applied_on AS approval_date,
                u.contact_number,
                u.email
            FROM leave_application la
            JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN users_master approver ON u.approver_id = approver.user_id
            ORDER BY la.applied_on DESC
        """
        
        cursor.execute(query)
        leave_requests = cursor.fetchall()

        # Convert dates to string format
        for request in leave_requests:
            for date_field in ['start_date', 'end_date', 'applied_date', 'approval_date']:
                if request.get(date_field):
                    if hasattr(request[date_field], 'strftime'):
                        request[date_field] = request[date_field].strftime('%Y-%m-%d')

        cursor.close()
        conn.close()

        print(f"✅ Successfully fetched {len(leave_requests)} leave requests")

        return jsonify({
            'success': True,
            'data': leave_requests,
            'message': f'Found {len(leave_requests)} leave requests'
        })

    except Exception as e:
        print(f"❌ Error in hr_leave_requests: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error loading leave requests: {str(e)}',
            'data': []
        }), 500

@hr_bp.route('/hr/leave-request/<int:leave_id>', methods=['GET'])
@hr_required
def get_leave_request_details(leave_id):
    """Get detailed information for a specific leave request"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            'success': False,
            'message': 'Database connection failed'
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                la.leave_id as id,
                u.user_name AS employee_name,
                u.user_id AS employee_id,
                d.department_name AS department,
                u.employee_type,
                u.designation,
                u.email,
                u.contact_number,
                u.date_of_joining AS joining_date,
                la.leave_type,
                la.start_date,
                la.end_date,
                DATEDIFF(la.end_date, la.start_date) + 1 AS total_days,
                la.applied_on AS applied_date,
                la.leave_status AS hr_approval_status,
                la.leave_status AS status,
                la.reason,
                la.document_path,
                la.hr_remarks AS hr_approval_reason,
                approver.user_name AS approved_by,
                lb.remaining_leaves
            FROM leave_application la
            JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN users_master approver ON u.approver_id = approver.user_id
            LEFT JOIN leave_balance lb ON u.user_id = lb.user_id AND lb.leave_type = la.leave_type
            WHERE la.leave_id = %s
        """
        
        cursor.execute(query, (leave_id,))
        leave_request = cursor.fetchone()
        
        if not leave_request:
            return jsonify({
                'success': False,
                'message': 'Leave request not found'
            }), 404

        # Convert dates to string format
        for date_field in ['start_date', 'end_date', 'applied_date', 'joining_date']:
            if leave_request.get(date_field):
                if hasattr(leave_request[date_field], 'strftime'):
                    leave_request[date_field] = leave_request[date_field].strftime('%Y-%m-%d')

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'leave_request': leave_request
        })

    except Exception as e:
        print(f"❌ Error fetching leave request details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error loading leave request details: {str(e)}'
        }), 500

@hr_bp.route('/hr/update-status', methods=['POST'])
@hr_required
def update_leave_status():
    """Update leave request status"""
    try:
        data = request.get_json()
        request_id = data.get('request_id')
        status = data.get('status')
        approval_reason = data.get('approval_reason', '')
        approved_by = data.get('approved_by', 'HR Manager')

        if not request_id or not status:
            return jsonify({
                'success': False,
                'message': 'Missing required fields: request_id and status'
            }), 400

        # Map status to database format
        status_map = {
            'Approved': 'approved',
            'Rejected': 'declined',
            'Pending': 'pending'
        }
        db_status = status_map.get(status, status.lower())

        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500

        cursor = conn.cursor(dictionary=True)

        # Get leave request details
        cursor.execute("""
            SELECT la.*, u.user_id, u.user_name
            FROM leave_application la
            JOIN users_master u ON la.user_id = u.user_id
            WHERE la.leave_id = %s
        """, (request_id,))
        
        leave_request = cursor.fetchone()
        
        if not leave_request:
            return jsonify({
                'success': False,
                'message': 'Leave request not found'
            }), 404

        # Update leave status
        update_query = """
            UPDATE leave_application 
            SET leave_status = %s, 
                hr_remarks = %s
            WHERE leave_id = %s
        """
        cursor.execute(update_query, (db_status, approval_reason, request_id))

        # If approved, update leave balance
        if db_status == 'approved':
            user_id = leave_request['user_id']
            leave_type = leave_request['leave_type']
            days = leave_request.get('leave_days') or (
                (leave_request['end_date'] - leave_request['start_date']).days + 1
            )

            # Update leave balance
            cursor.execute("""
                UPDATE leave_balance
                SET used_leaves = used_leaves + %s,
                    remaining_leaves = total_leaves - (used_leaves + %s)
                WHERE user_id = %s AND leave_type = %s
            """, (days, days, user_id, leave_type))

        conn.commit()
        cursor.close()
        conn.close()

        print(f"✅ Leave request {request_id} updated to {db_status}")

        return jsonify({
            'success': True,
            'message': f'Leave request {status.lower()} successfully'
        })

    except Exception as e:
        print(f"❌ Error updating leave status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Internal server error: {str(e)}'
        }), 500

@hr_bp.route('/hr/pending-documents', methods=['GET'])
@hr_required
def get_pending_documents():
    """Get leave requests pending document submission"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            'success': False,
            'message': 'Database connection failed',
            'pending_documents': []
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT 
                la.leave_id as leave_id,
                u.user_name AS employee,
                la.leave_type,
                la.applied_on AS applied_date,
                la.start_date,
                la.document_path,
                DATEDIFF(CURRENT_DATE, la.applied_on) AS days_pending
            FROM leave_application la
            JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN leave_types lt ON la.leave_type = lt.leave_type
            WHERE lt.requires_document = TRUE 
            AND (la.document_path IS NULL OR la.document_path = '')
            AND la.leave_status = 'pending'
            ORDER BY la.applied_on ASC
        """
        
        cursor.execute(query)
        pending_docs = cursor.fetchall()

        # Convert dates
        for doc in pending_docs:
            if doc.get('applied_date'):
                if hasattr(doc['applied_date'], 'strftime'):
                    doc['applied_date'] = doc['applied_date'].strftime('%Y-%m-%d')
            if doc.get('start_date'):
                if hasattr(doc['start_date'], 'strftime'):
                    doc['start_date'] = doc['start_date'].strftime('%Y-%m-%d')

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'pending_documents': pending_docs
        })

    except Exception as e:
        print(f"❌ Error fetching pending documents: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error loading pending documents: {str(e)}',
            'pending_documents': []
        }), 500

@hr_bp.route('/hr/leave-policies', methods=['GET'])
@hr_required
def get_leave_policies():
    """Get leave policies"""
    conn = get_db_connection()
    if not conn:
        return jsonify({
            'success': False,
            'message': 'Database connection failed',
            'policies': []
        }), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                id,
                employee_type,
                leave_type,
                annual_allocation,
                monthly_accrual,
                requires_document,
                max_days_per_request,
                carry_over_limits
            FROM leave_policies
            ORDER BY employee_type, leave_type
        """)
        
        policies = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'policies': policies
        })

    except Exception as e:
        print(f"❌ Error fetching leave policies: {e}")
        return jsonify({
            'success': False,
            'message': f'Error loading leave policies: {str(e)}',
            'policies': []
        }), 500