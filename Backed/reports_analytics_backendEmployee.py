from flask import Blueprint, jsonify, session
import mysql.connector
from datetime import datetime
from functools import wraps

# Create Blueprint
reports_analytics_bp = Blueprint('reports_analytics', __name__)

# Database configuration (same as app.py)
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

def login_required(f):
    """Decorator to check if user is logged in"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session or not session['logged_in']:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@reports_analytics_bp.route('/api/current-user')
@login_required
def get_current_user():
    """Get current logged in user data"""
    try:
        user_data = session.get('user', {})
        return jsonify({
            'user_id': user_data.get('user_id'),
            'user_name': user_data.get('user_name'),
            'email': user_data.get('email'),
            'designation': user_data.get('designation'),
            'department_name': user_data.get('department_name'),
            'role_name': user_data.get('role_name')
        })
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        return jsonify({'error': 'Failed to get user data'}), 500

@reports_analytics_bp.route('/api/user-analytics/<int:user_id>')
@login_required
def get_user_analytics(user_id):
    """Get personalized analytics data for a specific user"""
    try:
        # Verify the requested user matches logged-in user (security check)
        current_user_id = session.get('user', {}).get('user_id')
        if current_user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Get user basic info
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
            return jsonify({'error': 'User not found'}), 404
        
        # Get leave statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN leave_status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
                SUM(CASE WHEN leave_status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
                SUM(CASE WHEN leave_status IN ('rejected', 'declined') THEN 1 ELSE 0 END) as rejected_requests,
                SUM(DATEDIFF(end_date, start_date) + 1) as total_days_used
            FROM leave_application 
            WHERE user_id = %s
        """, (user_id,))
        stats = cursor.fetchone()
        
        # Get leave balance
        cursor.execute("""
            SELECT SUM(remaining_leaves) as total_remaining,
                   SUM(total_leaves) as total_allowed,
                   SUM(used_leaves) as total_used
            FROM leave_balance 
            WHERE user_id = %s
        """, (user_id,))
        balance = cursor.fetchone()
        
        # Get leave type distribution
        cursor.execute("""
            SELECT leave_type, COUNT(*) as count
            FROM leave_application 
            WHERE user_id = %s
            GROUP BY leave_type
            ORDER BY count DESC
        """, (user_id,))
        leave_types = cursor.fetchall()
        
        # Get monthly trends for current year
        current_year = datetime.now().year
        cursor.execute("""
            SELECT MONTH(start_date) as month, COUNT(*) as count
            FROM leave_application 
            WHERE user_id = %s AND YEAR(start_date) = %s
            GROUP BY MONTH(start_date)
            ORDER BY month
        """, (user_id, current_year))
        monthly_data = cursor.fetchall()
        
        # Get leave status distribution
        cursor.execute("""
            SELECT leave_status, COUNT(*) as count
            FROM leave_application 
            WHERE user_id = %s
            GROUP BY leave_status
        """, (user_id,))
        status_data = cursor.fetchall()
        
        # Get leave duration patterns
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN DATEDIFF(end_date, start_date) = 0 THEN '1 day'
                    WHEN DATEDIFF(end_date, start_date) = 1 THEN '2 days'
                    WHEN DATEDIff(end_date, start_date) = 2 THEN '3 days'
                    WHEN DATEDIFF(end_date, start_date) BETWEEN 3 AND 4 THEN '4-5 days'
                    ELSE '5+ days'
                END as duration_category,
                COUNT(*) as count
            FROM leave_application 
            WHERE user_id = %s AND leave_status = 'approved'
            GROUP BY duration_category
            ORDER BY 
                CASE duration_category
                    WHEN '1 day' THEN 1
                    WHEN '2 days' THEN 2
                    WHEN '3 days' THEN 3
                    WHEN '4-5 days' THEN 4
                    ELSE 5
                END
        """, (user_id,))
        duration_data = cursor.fetchall()
        
        # Get recent leave history
        cursor.execute("""
            SELECT 
                la.start_date, 
                la.end_date, 
                la.leave_type, 
                DATEDIFF(la.end_date, la.start_date) + 1 as duration,
                la.leave_status, 
                la.reason,
                um.user_name as approved_by
            FROM leave_application la
            LEFT JOIN users_master um ON la.user_id = um.user_id
            WHERE la.user_id = %s
            ORDER BY la.start_date DESC
            LIMIT 10
        """, (user_id,))
        leave_history = cursor.fetchall()
        
        # Calculate approval rate
        total_requests = stats['total_requests'] if stats and stats['total_requests'] else 0
        approved_requests = stats['approved_requests'] if stats else 0
        approval_rate = round((approved_requests / total_requests * 100), 1) if total_requests > 0 else 0
        
        # Get most used leave type
        most_used_type = leave_types[0]['leave_type'] if leave_types else 'N/A'
        most_used_percentage = round((leave_types[0]['count'] / total_requests * 100), 1) if leave_types and total_requests > 0 else 0
        
        # Format monthly data for chart
        monthly_counts = [0] * 12
        for month_data in monthly_data:
            month_index = month_data['month'] - 1
            if 0 <= month_index < 12:
                monthly_counts[month_index] = month_data['count']
        
        # Format status data for chart
        status_counts = {'approved': 0, 'pending': 0, 'rejected': 0, 'declined': 0}
        for status_item in status_data:
            status_counts[status_item['leave_status']] = status_item['count']
        
        # Format duration data for chart
        duration_categories = ['1 day', '2 days', '3 days', '4-5 days', '5+ days']
        duration_counts = [0] * 5
        for duration_item in duration_data:
            category = duration_item['duration_category']
            if category in duration_categories:
                index = duration_categories.index(category)
                duration_counts[index] = duration_item['count']
        
        # Format leave history for frontend
        formatted_history = []
        for history_item in leave_history:
            formatted_history.append({
                'start_date': history_item['start_date'].strftime('%Y-%m-%d') if history_item['start_date'] else '',
                'end_date': history_item['end_date'].strftime('%Y-%m-%d') if history_item['end_date'] else '',
                'leave_type': history_item['leave_type'],
                'duration': f"{history_item['duration']} days",
                'leave_status': history_item['leave_status'],
                'reason': history_item['reason'] or 'Not specified',
                'approved_by': history_item['approved_by'] or 'Pending'
            })
        
        # Generate patterns based on data
        patterns = generate_leave_patterns(leave_types, monthly_data, duration_data, user_id)
        
        # Format the response data
        analytics_data = {
            'userInfo': user_info,
            'stats': {
                'totalRequests': total_requests,
                'approvedRequests': approved_requests,
                'pendingRequests': stats['pending_requests'] if stats else 0,
                'rejectedRequests': stats['rejected_requests'] if stats else 0,
                'approvalRate': approval_rate,
                'daysUsed': stats['total_days_used'] if stats else 0,
                'daysRemaining': balance['total_remaining'] if balance else 0,
                'totalAllowed': balance['total_allowed'] if balance else 0,
                'mostUsedType': most_used_type,
                'mostUsedPercentage': f"{most_used_percentage}% of my requests"
            },
            'charts': {
                'leaveType': {
                    'labels': [lt['leave_type'] for lt in leave_types],
                    'datasets': [{
                        'data': [lt['count'] for lt in leave_types],
                        'backgroundColor': ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'][:len(leave_types)]
                    }]
                },
                'monthlyTrend': {
                    'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    'datasets': [{
                        'label': 'My Leave Requests',
                        'data': monthly_counts,
                        'borderColor': '#3b82f6',
                        'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                        'fill': True,
                        'tension': 0.3
                    }]
                },
                'status': {
                    'labels': ['Approved', 'Pending', 'Rejected'],
                    'datasets': [{
                        'data': [
                            status_counts['approved'],
                            status_counts['pending'],
                            status_counts['rejected'] + status_counts['declined']
                        ],
                        'backgroundColor': ['#10b981', '#f59e0b', '#ef4444']
                    }]
                },
                'duration': {
                    'labels': duration_categories,
                    'datasets': [{
                        'label': 'My Leave Durations',
                        'data': duration_counts,
                        'backgroundColor': '#8b5cf6'
                    }]
                }
            },
            'leaveHistory': formatted_history,
            'patterns': patterns
        }
        
        cursor.close()
        conn.close()
        
        print(f"✓ Analytics data loaded for user {user_id}")
        return jsonify(analytics_data)
        
    except Exception as e:
        print(f"✗ Error in get_user_analytics: {e}")
        return jsonify({'error': 'Failed to load analytics data'}), 500

def generate_leave_patterns(leave_types, monthly_data, duration_data, user_id):
    """Generate meaningful leave patterns based on user data"""
    patterns = []
    
    # Pattern 1: Most used leave type
    if leave_types:
        most_used = leave_types[0]
        patterns.append({
            'title': most_used['leave_type'],
            'description': 'Your Most Used Leave Type',
            'details': f"{most_used['count']} requests in total",
            'type': 'peak',
            'badge': 'Most Used'
        })
    
    # Pattern 2: Peak month
    if monthly_data:
        peak_month_data = max(monthly_data, key=lambda x: x['count'])
        month_names = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
        peak_month_name = month_names[peak_month_data['month'] - 1]
        patterns.append({
            'title': peak_month_name,
            'description': 'Your Peak Leave Month',
            'details': f"{peak_month_data['count']} leave requests",
            'type': 'high',
            'badge': 'Peak'
        })
    
    # Pattern 3: Common duration
    if duration_data:
        common_duration = max(duration_data, key=lambda x: x['count'])
        patterns.append({
            'title': common_duration['duration_category'],
            'description': 'Your Typical Leave Duration',
            'details': f"{common_duration['count']} leaves with this duration",
            'type': 'medium',
            'badge': 'Pattern'
        })
    
    # Add default pattern if no specific patterns found
    if not patterns:
        patterns.append({
            'title': 'Getting Started',
            'description': 'Build Your Leave History',
            'details': 'Apply for leaves to see your patterns here',
            'type': 'medium',
            'badge': 'Info'
        })
    
    return patterns

@reports_analytics_bp.route('/api/export-analytics/<int:user_id>')
@login_required
def export_analytics_report(user_id):
    """Export analytics data as PDF/Excel (placeholder)"""
    try:
        # Verify the requested user matches logged-in user
        current_user_id = session.get('user', {}).get('user_id')
        if current_user_id != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # In a real implementation, this would generate and return a file
        # For now, return success message
        return jsonify({
            'message': 'Report exported successfully',
            'download_url': f'/api/downloads/analytics-report-{user_id}.pdf'
        })
        
    except Exception as e:
        print(f"Error in export_analytics_report: {e}")
        return jsonify({'error': 'Failed to export report'}), 500

# Health check endpoint
@reports_analytics_bp.route('/api/analytics/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': 'reports_analytics'})