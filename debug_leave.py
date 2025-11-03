import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def check_leave_applications():
    """Check leave applications in database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Check total leave applications
        cursor.execute("SELECT COUNT(*) as total FROM leave_application")
        total = cursor.fetchone()
        print(f"Total leave applications: {total['total']}")

        # Check recent leave applications
        cursor.execute("SELECT * FROM leave_application ORDER BY leave_id DESC LIMIT 5")
        recent = cursor.fetchall()
        print("\nRecent leave applications:")
        for app in recent:
            print(f"ID: {app['leave_id']}, User: {app['user_id']}, Type: {app['leave_type']}, Status: {app['leave_status']}, Applied: {app['applied_on']}")

        # Check leave applications by status
        cursor.execute("SELECT leave_status, COUNT(*) as count FROM leave_application GROUP BY leave_status")
        status_counts = cursor.fetchall()
        print("\nLeave applications by status:")
        for status in status_counts:
            print(f"{status['leave_status']}: {status['count']}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_leave_applications()
