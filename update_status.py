import mysql.connector

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def update_statuses():
    """Update leave statuses for better analytics testing"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Update leave_id 18 to approved for leave types chart
        cursor.execute('UPDATE leave_application SET leave_status = "approved" WHERE leave_id = 18')

        conn.commit()
        print('Updated leave statuses for better analytics testing')

        # Verify the changes
        cursor.execute('SELECT leave_id, leave_status FROM leave_application ORDER BY leave_id')
        results = cursor.fetchall()
        print('Current leave statuses:')
        for row in results:
            print(f'ID {row[0]}: {row[1]}')

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_statuses()
