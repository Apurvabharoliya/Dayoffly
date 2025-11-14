import mysql.connector

def check_leave_types():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='dayoffly',
            port=3306
        )
        cursor = conn.cursor(dictionary=True)

        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'leave_types'")
        result = cursor.fetchone()
        print('leave_types table exists:', result is not None)

        if result:
            # Get count
            cursor.execute('SELECT COUNT(*) as count FROM leave_types')
            count = cursor.fetchone()
            print('Records in leave_types:', count['count'])

            # Get sample records
            cursor.execute('SELECT * FROM leave_types LIMIT 5')
            records = cursor.fetchall()
            print('Sample records:', records)

            # Check table structure
            cursor.execute('DESCRIBE leave_types')
            structure = cursor.fetchall()
            print('Table structure:')
            for col in structure:
                print(f"  {col['Field']}: {col['Type']} {col['Null']} {col['Key']} {col['Default']}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_leave_types()
