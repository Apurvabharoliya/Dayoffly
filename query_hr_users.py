import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def get_hr_users():
    """Query HR users from database"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # Query HR users
        query = """
        SELECT user_id, user_name, email, user_role
        FROM users_master
        WHERE is_active = 1 AND user_role = 'HR'
        """

        cursor.execute(query)
        hr_users = cursor.fetchall()

        print('HR Users:')
        print('-' * 50)

        if not hr_users:
            print('No HR users found.')
        else:
            for user in hr_users:
                print(f"ID: {user['user_id']}")
                print(f"Name: {user['user_name']}")
                print(f"Email: {user['email']}")
                print(f"Role: {user['user_role']}")
                print('-' * 30)

        cursor.close()
        conn.close()

    except mysql.connector.Error as e:
        print(f"Database error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_hr_users()
