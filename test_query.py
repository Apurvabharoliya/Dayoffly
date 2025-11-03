import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def test_query():
    """Test the exact query used in leave_requests_backend.py"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # First check if tables exist and have data
        cursor.execute("SHOW TABLES LIKE 'leave_application'")
        la_exists = cursor.fetchone()
        print(f"leave_application table exists: {la_exists is not None}")

        cursor.execute("SHOW TABLES LIKE 'users_master'")
        um_exists = cursor.fetchone()
        print(f"users_master table exists: {um_exists is not None}")

        if la_exists:
            cursor.execute("SELECT COUNT(*) as count FROM leave_application")
            la_count = cursor.fetchone()
            print(f"leave_application records: {la_count['count']}")

        if um_exists:
            cursor.execute("SELECT COUNT(*) as count FROM users_master")
            um_count = cursor.fetchone()
            print(f"users_master records: {um_count['count']}")

        # Check user_id values in leave_application
        cursor.execute("SELECT user_id, leave_id FROM leave_application")
        user_ids = cursor.fetchall()
        print(f"User IDs in leave_application: {[row['user_id'] for row in user_ids]}")

        # Check user_id values in users_master
        cursor.execute("SELECT user_id, user_name FROM users_master")
        users = cursor.fetchall()
        print(f"User IDs in users_master: {[row['user_id'] for row in users]}")

        # Check if user_ids match
        la_user_ids = set(row['user_id'] for row in user_ids)
        um_user_ids = set(row['user_id'] for row in users)
        print(f"User IDs in leave_application: {la_user_ids}")
        print(f"User IDs in users_master: {um_user_ids}")
        print(f"Matching user_ids: {la_user_ids.intersection(um_user_ids)}")

        # Exact query from leave_requests_backend.py
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

        print("Executing query...")
        cursor.execute(query)
        results = cursor.fetchall()
        print(f"Found {len(results)} results")

        for row in results:
            print(f"ID: {row['leave_id']}, Employee: {row['employee']}, Status: {row['status']}")

        # Check specific users
        cursor.execute("SELECT user_id, user_name FROM users_master WHERE user_id IN (30002, 40002)")
        specific_users = cursor.fetchall()
        print(f"\nSpecific users check:")
        for user in specific_users:
            print(f"ID: {user['user_id']}, Name: {user['user_name']}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_query()
