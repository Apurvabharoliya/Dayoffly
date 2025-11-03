import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def fix_user_id():
    """Fix the user_id mismatch in leave_application table"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Update the leave application to use a valid user_id from users_master
        # Using 40008 which is a valid user_id from the users_master table
        update_query = "UPDATE leave_application SET user_id = %s WHERE user_id = %s"
        cursor.execute(update_query, (40008, 30002))
        conn.commit()

        print(f"Updated leave application user_id from 30002 to 40008")

        # Verify the update
        cursor.execute("SELECT * FROM leave_application WHERE leave_id = 18")
        updated_record = cursor.fetchone()
        print(f"Updated record: {updated_record}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_user_id()
