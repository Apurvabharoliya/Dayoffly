from flask import Blueprint, jsonify, session, request
import mysql.connector
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint('analytics', __name__)

# Database configuration - UPDATE THESE CREDENTIALS
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',      
    'database': 'dayoffly',
    'port': 3306
}

def get_db_connection():
    """Create database connection with better error handling"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print(f"✅ Database connection successful to {DB_CONFIG['database']}")
        return conn
    except mysql.connector.Error as e:
        print(f"❌ Database connection failed: {e}")
        print(f"🔧 Connection details: {DB_CONFIG}")
        return None

@analytics_bp.route('/hr/analytics-data')
def get_hr_analytics_data():
    """Get comprehensive HR analytics data with employee filtering"""
    
    print("📊 HR Analytics endpoint called")
    
    # Get filter parameters
    department_filter = request.args.get('department', 'all')
    employee_filter = request.args.get('employee', 'all')
    period_filter = request.args.get('period', '6months')
    view_filter = request.args.get('view', 'leaves')
    
    print(f"🔍 Filters - Department: {department_filter}, Employee: {employee_filter}, Period: {period_filter}")
    
    conn = get_db_connection()
    if not conn:
        error_msg = f"Database connection failed. Check if MySQL is running and credentials are correct."
        print(f"❌ {error_msg}")
        return jsonify({'error': error_msg}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        print("✅ Database cursor created successfully")
        
        # Get all departments for filter dropdown
        cursor.execute("SELECT department_name FROM department")
        departments = [dept['department_name'] for dept in cursor.fetchall()]
        
        # Get all employees for filter dropdown
        cursor.execute("""
            SELECT u.user_id, u.user_name, d.department_name 
            FROM users_master u 
            LEFT JOIN department d ON u.department_id = d.department_id 
            WHERE u.is_active = 1
            ORDER BY u.user_name
        """)
        all_employees = cursor.fetchall()
        
        # Build WHERE conditions based on filters
        where_conditions = []
        params = []
        
        if employee_filter != 'all':
            where_conditions.append("la.user_id = %s")
            params.append(employee_filter)
        elif department_filter != 'all':
            where_conditions.append("d.department_name = %s")
            params.append(department_filter)
        
        # Date range based on period filter
        date_condition = ""
        date_params = []
        if period_filter == '6months':
            date_range = datetime.now() - timedelta(days=180)
            date_condition = " AND la.applied_on >= %s"
            date_params.append(date_range)
        elif period_filter == '4quarters':
            date_range = datetime.now() - timedelta(days=365)
            date_condition = " AND la.applied_on >= %s"
            date_params.append(date_range)
        elif period_filter == '3years':
            date_range = datetime.now() - timedelta(days=1095)
            date_condition = " AND la.applied_on >= %s"
            date_params.append(date_range)
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Combine all parameters for the main query
        all_params = params + date_params
        
        # 1. Get total leaves based on filters
        total_leaves_query = f"""
            SELECT COUNT(*) as total_leaves 
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} {date_condition}
        """
        print(f"🔍 Total leaves query: {total_leaves_query}")
        print(f"🔍 Parameters: {all_params}")
        
        # Handle case where there are no WHERE conditions but we have date params
        if where_clause == "" and date_condition != "":
            # Remove the " AND " from date_condition and replace with "WHERE"
            date_condition = date_condition.replace(" AND ", "WHERE ", 1)
            total_leaves_query = f"""
                SELECT COUNT(*) as total_leaves 
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                {date_condition}
            """
        
        cursor.execute(total_leaves_query, all_params)
        total_leaves_result = cursor.fetchone()
        total_leaves = total_leaves_result['total_leaves'] if total_leaves_result else 0
        
        # 2. Get average duration
        avg_duration_query = f"""
            SELECT AVG(DATEDIFF(la.end_date, la.start_date) + 1) as avg_duration 
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} AND la.leave_status = 'approved' {date_condition}
        """
        
        # Fix avg duration query parameter issue
        if where_clause == "" and date_condition != "":
            date_condition_avg = date_condition.replace(" AND ", "WHERE ", 1)
            avg_duration_query = f"""
                SELECT AVG(DATEDIFF(la.end_date, la.start_date) + 1) as avg_duration 
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                {date_condition_avg} AND la.leave_status = 'approved'
            """
        
        cursor.execute(avg_duration_query, all_params)
        avg_duration_result = cursor.fetchone()
        avg_duration = round(avg_duration_result['avg_duration'], 1) if avg_duration_result and avg_duration_result['avg_duration'] else 0
        
        # 3. Get approval rate
        approval_query = f"""
            SELECT 
                COUNT(*) as total_requests,
                SUM(CASE WHEN la.leave_status = 'approved' THEN 1 ELSE 0 END) as approved_requests
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} {date_condition}
        """
        
        # Fix approval query parameter issue
        if where_clause == "" and date_condition != "":
            date_condition_approval = date_condition.replace(" AND ", "WHERE ", 1)
            approval_query = f"""
                SELECT 
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN la.leave_status = 'approved' THEN 1 ELSE 0 END) as approved_requests
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                {date_condition_approval}
            """
        
        cursor.execute(approval_query, all_params)
        approval_data = cursor.fetchone()
        if approval_data and approval_data['total_requests'] > 0:
            approval_rate = round((approval_data['approved_requests'] / approval_data['total_requests']) * 100, 1)
        else:
            approval_rate = 0
        
        # 4. Get employees on leave now
        today = datetime.now().date()
        on_leave_query = f"""
            SELECT COUNT(DISTINCT la.user_id) as on_leave_now
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} AND la.start_date <= %s AND la.end_date >= %s AND la.leave_status = 'approved'
        """
        on_leave_params = params + [today, today]  # Only use filter params, not date params for this query
        
        # Fix on leave query parameter issue
        if where_clause == "":
            on_leave_query = f"""
                SELECT COUNT(DISTINCT la.user_id) as on_leave_now
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                WHERE la.start_date <= %s AND la.end_date >= %s AND la.leave_status = 'approved'
            """
        
        cursor.execute(on_leave_query, on_leave_params)
        on_leave_result = cursor.fetchone()
        on_leave_now = on_leave_result['on_leave_now'] if on_leave_result else 0
        
        # 5. Get leave types distribution
        leave_types_query = f"""
            SELECT la.leave_type, COUNT(*) as count
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} {date_condition}
            GROUP BY la.leave_type
        """
        
        # Fix leave types query parameter issue
        if where_clause == "" and date_condition != "":
            date_condition_types = date_condition.replace(" AND ", "WHERE ", 1)
            leave_types_query = f"""
                SELECT la.leave_type, COUNT(*) as count
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                {date_condition_types}
                GROUP BY la.leave_type
            """
        
        cursor.execute(leave_types_query, all_params)
        leave_types_data = cursor.fetchall()
        leave_types_distribution = {item['leave_type']: item['count'] for item in leave_types_data}
        
        # 6. Get monthly trends
        monthly_query = f"""
            SELECT MONTH(la.applied_on) as month, COUNT(*) as count
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} {date_condition}
            GROUP BY MONTH(la.applied_on)
            ORDER BY month
        """
        
        # Fix monthly query parameter issue
        if where_clause == "" and date_condition != "":
            date_condition_monthly = date_condition.replace(" AND ", "WHERE ", 1)
            monthly_query = f"""
                SELECT MONTH(la.applied_on) as month, COUNT(*) as count
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                {date_condition_monthly}
                GROUP BY MONTH(la.applied_on)
                ORDER BY month
            """
        
        cursor.execute(monthly_query, all_params)
        monthly_data = cursor.fetchall()
        
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_leaves = [0] * 12
        for item in monthly_data:
            if 1 <= item['month'] <= 12:
                monthly_leaves[item['month'] - 1] = item['count']
        
        # 7. Get department-wise distribution (only when not filtering by employee)
        department_distribution = {}
        if employee_filter == 'all':
            dept_query = """
                SELECT d.department_name, COUNT(la.leave_id) as leave_count
                FROM leave_application la
                JOIN users_master u ON la.user_id = u.user_id
                JOIN department d ON u.department_id = d.department_id
                GROUP BY d.department_name
            """
            cursor.execute(dept_query)
            department_data = cursor.fetchall()
            department_distribution = {item['department_name']: item['leave_count'] for item in department_data}
        
        # 8. Get approval trends
        approval_trends_query = f"""
            SELECT 
                DATE_FORMAT(la.applied_on, '%Y-%m') as month,
                COUNT(*) as total_requests,
                SUM(CASE WHEN la.leave_status = 'approved' THEN 1 ELSE 0 END) as approved_requests
            FROM leave_application la
            LEFT JOIN users_master u ON la.user_id = u.user_id
            LEFT JOIN department d ON u.department_id = d.department_id
            {where_clause} {date_condition}
            GROUP BY DATE_FORMAT(la.applied_on, '%Y-%m')
            ORDER BY month
        """
        
        # Fix approval trends query parameter issue
        if where_clause == "" and date_condition != "":
            date_condition_trends = date_condition.replace(" AND ", "WHERE ", 1)
            approval_trends_query = f"""
                SELECT 
                    DATE_FORMAT(la.applied_on, '%Y-%m') as month,
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN la.leave_status = 'approved' THEN 1 ELSE 0 END) as approved_requests
                FROM leave_application la
                LEFT JOIN users_master u ON la.user_id = u.user_id
                LEFT JOIN department d ON u.department_id = d.department_id
                {date_condition_trends}
                GROUP BY DATE_FORMAT(la.applied_on, '%Y-%m')
                ORDER BY month
            """
        
        cursor.execute(approval_trends_query, all_params)
        approval_trends_data = cursor.fetchall()
        
        approval_trends_months = []
        approval_rates = []
        for item in approval_trends_data:
            approval_trends_months.append(item['month'])
            if item['total_requests'] > 0:
                rate = round((item['approved_requests'] / item['total_requests']) * 100, 1)
            else:
                rate = 0
            approval_rates.append(rate)
        
        # 9. Get employee leave summary
        employee_summary_query = """
            SELECT 
                u.user_id,
                u.user_name,
                d.department_name,
                COALESCE(lb.total_leaves, 20) as total_leaves,
                COALESCE(lb.used_leaves, 0) as used_leaves,
                COALESCE(lb.remaining_leaves, 20) as remaining_leaves,
                CASE 
                    WHEN COALESCE(lb.total_leaves, 20) > 0 THEN 
                        ROUND((COALESCE(lb.used_leaves, 0) / COALESCE(lb.total_leaves, 20)) * 100, 1)
                    ELSE 0 
                END as utilization_rate
            FROM users_master u
            LEFT JOIN department d ON u.department_id = d.department_id
            LEFT JOIN leave_balance lb ON u.user_id = lb.user_id
            WHERE u.is_active = 1
            ORDER BY u.user_name
        """
        cursor.execute(employee_summary_query)
        employee_summary = cursor.fetchall()
        
        # Format employee data
        formatted_employees = []
        for emp in employee_summary:
            formatted_employees.append({
                'employee': emp['user_name'],
                'department': emp['department_name'],
                'leavesTaken': emp['used_leaves'],
                'remainingBalance': emp['remaining_leaves'],
                'utilizationRate': emp['utilization_rate']
            })
        
        analytics_data = {
            'summary': {
                'totalLeaves': total_leaves,
                'avgDuration': avg_duration,
                'approvalRate': approval_rate,
                'onLeaveNow': on_leave_now
            },
            'charts': {
                'leaveTypes': leave_types_distribution,
                'monthlyTrends': {
                    'months': months,
                    'leaves': monthly_leaves
                },
                'departmentDistribution': department_distribution,
                'approvalTrends': {
                    'months': approval_trends_months,
                    'rates': approval_rates
                }
            },
            'employees': formatted_employees,
            'filters': {
                'departments': departments,
                'allEmployees': all_employees
            }
        }
        
        print("✅ Analytics data prepared successfully")
        return jsonify(analytics_data)
        
    except Exception as e:
        error_msg = f"Error loading HR analytics data: {e}"
        print(f"❌ {error_msg}")
        import traceback
        print(f"🔍 Full traceback: {traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()
        print("✅ Database connection closed")
