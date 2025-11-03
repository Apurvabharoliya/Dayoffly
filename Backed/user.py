import mysql.connector
from flask import session

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

def get_user_details(user_id=None):
    """
    Fetch user details from database
    Returns: dict with user information or None if not found
    """
    if user_id is None:
        # Get from session
        user_session = session.get('user', {})
        user_id = user_session.get('user_id')

    if not user_id:
        return None

    conn = get_db_connection()
    if not conn:
        return None

    try:
        cursor = conn.cursor(dictionary=True)

        # Query to get user details
        query = """
        SELECT
            u.user_id,
            u.user_name,
            u.email,
            u.designation,
            u.contact_number,
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
            u.user_role
        FROM users_master u
        LEFT JOIN department d ON u.department_id = d.department_id
        LEFT JOIN role r ON u.role_id = r.role_id
        WHERE u.user_id = %s AND u.is_active = 1
        """

        cursor.execute(query, (user_id,))
        user_data = cursor.fetchone()

        if user_data:
            # Format the user data for frontend
            formatted_user = {
                "user_id": user_data['user_id'],
                "user_name": user_data['user_name'],
                "email": user_data['email'],
                "designation": user_data['designation'] or '',
                "department_name": user_data['department_name'] or '',
                "role_name": user_data['role_name'] or user_data['user_role'] or '',
                "contact_number": user_data['contact_number'] or '',
                "personal_email": user_data['personal_email'] or '',
                "mobile_phone": user_data['mobile_phone'] or '',
                "work_phone": user_data['work_phone'] or '',
                "home_address": user_data['home_address'] or '',
                "preferred_name": user_data['preferred_name'] or '',
                "date_of_birth": user_data['date_of_birth'].strftime('%Y-%m-%d') if user_data['date_of_birth'] else None,
                "gender": user_data['gender'] or '',
                "nationality": user_data['nationality'] or '',
                "pronouns": user_data['pronouns'] or ''
            }
            print(f"✅ User details fetched for user_id {user_id}: {formatted_user}")
            return formatted_user
        else:
            return None

    except mysql.connector.Error as e:
        print(f"Database error in get_user_details: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error in get_user_details: {e}")
        return None
    finally:
        if 'cursor' in locals():
            cursor.close()
        conn.close()

def get_current_user():
    """
    Get current user details from session
    Returns: dict with user information or None if not logged in
    """
    user_session = session.get('user', {})
    if user_session:
        return get_user_details(user_session.get('user_id'))
    return None

def get_user_name(user_id=None):
    """
    Get just the user name
    Returns: string user name or None
    """
    user_details = get_user_details(user_id)
    if user_details:
        return user_details.get('user_name')
    return None
