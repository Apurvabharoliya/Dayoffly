# leave_requests_backend.py - Backend for Leave Requests HR Page
from flask import Blueprint, request, jsonify, session
from flask_cors import CORS, cross_origin
from functools import wraps
import mysql.connector
from datetime import datetime
import os

# Create Blueprint for Leave Requests routes
leave_requests_bp = Blueprint('leave_requests', __name__)

# Enable CORS for this blueprint
CORS(leave_requests_bp, supports_credentials=True)

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
        print(f"✗ Database connection failed: {e}")
        return None

def get_leave_requests():
    """Get all leave requests from database"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Query to get all leave requests with employee details
        query = """
        SELECT 
            la.leave_id,
            u.user_name as employee,
            la.leave_type as type,
            la.start_date,
            la.end_date,
            DATEDIFF(la.end_date, la.start_date) + 1 as duration_days,
            la.applied_on,
            la.leave_status as status,
            u.designation,
            d.department_name,
            approver.user_name as approver_name,
            la.reason,
            u.contact_number as contact_info
        FROM leave_application la
        JOIN users_master u ON la.user_id = u.user_id
        LEFT JOIN department d ON u.department_id = d.department_id
        LEFT JOIN users_master approver ON u.approver_id = approver.user_id
        ORDER BY la.applied_on DESC
        """
        
        cursor.execute(query)
        requests = cursor.fetchall()
        
        # Format the data for frontend
        formatted_requests = []
        for req in requests:
            # Format dates
            start_date = req['start_date'].strftime('%b %d, %Y') if req['start_date'] else ''
            end_date = req['end_date'].strftime('%b %d, %Y') if req['end_date'] else ''
            dates = f"{start_date} – {end_date}" if start_date and end_date else ''
            
            # Format duration
            duration = f"{req['duration_days']} day{'s' if req['duration_days'] != 1 else ''}"
            
            # Format status for frontend
            status_map = {
                'pending': 'Pending',
                'approved': 'Approved',
                'declined': 'Rejected'
            }
            status = status_map.get(req['status'].lower(), req['status'])
            
            formatted_requests.append({
                'employee': req['employee'],
                'type': req['type'],
                'dates': dates,
                'duration': duration,
                'status': status,
                'leave_id': req['leave_id'],
                'designation': req['designation'],
                'department': req['department_name'],
                'applied_on': req['applied_on'].strftime('%Y-%m-%d %H:%M') if req['applied_on'] else '',
                'approver': req['approver_name'],
                'reason': req['reason'],
                'contact_info': req['contact_info'],
                'start_date': start_date,
                'end_date': end_date
            })
        
        return formatted_requests
        
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

def get_leave_request_details(leave_id):
    """Get detailed information for a specific leave request"""
    conn = get_db_connection()
    if not conn:
        print(f"Database connection failed for leave_id: {leave_id}")
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            la.leave_id,
            u.user_name as employee,
            la.leave_type as type,
            la.start_date,
            la.end_date,
            DATEDIFF(la.end_date, la.start_date) + 1 as duration_days,
            la.applied_on,
            la.leave_status as status,
            u.designation,
            d.department_name,
            approver.user_name as approver_name,
            la.reason,
            u.contact_number as contact_info,
            u.email,
            la.attachment
        FROM leave_application la
        JOIN users_master u ON la.user_id = u.user_id
        LEFT JOIN department d ON u.department_id = d.department_id
        LEFT JOIN users_master approver ON u.approver_id = approver.user_id
        WHERE la.leave_id = %s
        """
        
        print(f"Executing query for leave_id: {leave_id}")  # Debug print
        cursor.execute(query, (leave_id,))
        request_details = cursor.fetchone()
        
        print(f"Query result: {request_details}")  # Debug print
        
        if request_details:
            # Format dates
            start_date = request_details['start_date'].strftime('%b %d, %Y') if request_details['start_date'] else ''
            end_date = request_details['end_date'].strftime('%b %d, %Y') if request_details['end_date'] else ''
            duration = f"{request_details['duration_days']} day{'s' if request_details['duration_days'] != 1 else ''}"
            
            # Format status
            status_map = {
                'pending': 'Pending',
                'approved': 'Approved',
                'declined': 'Rejected'
            }
            status = status_map.get(request_details['status'].lower(), request_details['status'])
            
            formatted_details = {
                'employee': request_details['employee'],
                'type': request_details['type'],
                'start_date': start_date,
                'end_date': end_date,
                'duration': duration,
                'status': status,
                'leave_id': request_details['leave_id'],
                'designation': request_details['designation'],
                'department': request_details['department_name'],
                'applied_on': request_details['applied_on'].strftime('%Y-%m-%d %H:%M') if request_details['applied_on'] else '',
                'approver': request_details['approver_name'],
                'reason': request_details['reason'],
                'contact_info': request_details['contact_number'],
                'email': request_details['email'],
                'attachment': request_details['attachment']
            }
            
            print(f"Formatted details: {formatted_details}")  # Debug print
            return formatted_details
        else:
            print(f"No leave request found with ID: {leave_id}")
            return None
        
    except mysql.connector.Error as e:
        print(f"Database error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

# TEMPORARILY REMOVED AUTHENTICATION - WILL BE ADDED BACK LATER
def hr_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # TEMPORARY: Bypass auth for development - REMOVE IN PRODUCTION
        print("⚠️  Bypassing auth for development")
        return f(*args, **kwargs)
    return decorated_function

@leave_requests_bp.route('/hr/leave-requests', methods=['GET'])
@hr_required
@cross_origin(supports_credentials=True)
def leave_requests():
    """Get all leave requests for HR dashboard"""
    try:
        leave_requests_data = get_leave_requests()
        
        return jsonify({
            "success": True,
            "leave_requests": leave_requests_data
        })
        
    except Exception as e:
        print(f"Error fetching leave requests: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

@leave_requests_bp.route('/hr/leave-request/<int:leave_id>', methods=['GET'])
@hr_required
@cross_origin(supports_credentials=True)
def leave_request_details(leave_id):
    """Get detailed information for a specific leave request"""
    try:
        request_details = get_leave_request_details(leave_id)
        
        if request_details:
            return jsonify({
                "success": True,
                "leave_request": request_details
            })
        else:
            return jsonify({
                "success": False,
                "message": "Leave request not found"
            }), 404
        
    except Exception as e:
        print(f"Error fetching leave request details: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

@leave_requests_bp.route('/hr/update-leave-status', methods=['POST', 'OPTIONS'])
@hr_required
@cross_origin(supports_credentials=True)
def update_leave_status():
    """Update leave request status"""
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
        
    try:
        data = request.get_json()
        leave_id = data.get('leave_id')
        status = data.get('status')
        employee_name = data.get('employee_name')
        
        if not leave_id or not status:
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        # Map frontend status to database status
        status_map = {
            'Approved': 'approved',
            'Rejected': 'declined',
            'Pending': 'pending'
        }
        db_status = status_map.get(status, status.lower())
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"success": False, "message": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Update leave status
        update_query = "UPDATE leave_application SET leave_status = %s WHERE leave_id = %s"
        cursor.execute(update_query, (db_status, leave_id))
        conn.commit()
        
        # If approved, update leave balance
        if db_status == 'approved':
            # Get leave details to update balance
            cursor.execute("""
                SELECT user_id, leave_type, DATEDIFF(end_date, start_date) + 1 as days 
                FROM leave_application 
                WHERE leave_id = %s
            """, (leave_id,))
            leave_details = cursor.fetchone()
            
            if leave_details:
                user_id, leave_type, days = leave_details
                # Update leave balance - check if record exists first
                cursor.execute("""
                    SELECT * FROM leave_balance 
                    WHERE user_id = %s AND leave_type = %s
                """, (user_id, leave_type))
                existing_balance = cursor.fetchone()
                
                if existing_balance:
                    # Update existing balance
                    cursor.execute("""
                        UPDATE leave_balance 
                        SET used_leaves = used_leaves + %s, 
                            remaining_leaves = total_leaves - (used_leaves + %s)
                        WHERE user_id = %s AND leave_type = %s
                    """, (days, days, user_id, leave_type))
                else:
                    # Create new balance record (simplified - you might want to set proper initial values)
                    cursor.execute("""
                        INSERT INTO leave_balance (user_id, leave_type, total_leaves, used_leaves, remaining_leaves)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (user_id, leave_type, 20, days, 20 - days))
                
                conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": f"Leave {status.lower()} for {employee_name}"
        })
        
    except Exception as e:
        print(f"Error updating leave status: {e}")
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500