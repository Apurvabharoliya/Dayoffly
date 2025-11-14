import mysql.connector

def fix_database_schema():
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='',
            database='dayoffly',
            port=3306
        )
        cursor = conn.cursor()

        # Add missing columns to leave_types table
        alter_queries = [
            'ALTER TABLE leave_types ADD COLUMN leave_name VARCHAR(50) DEFAULT NULL',
            'ALTER TABLE leave_types ADD COLUMN is_paid TINYINT(1) DEFAULT 0',
            'ALTER TABLE leave_types ADD COLUMN max_days INT DEFAULT 20',
            'ALTER TABLE leave_types ADD COLUMN employee_types VARCHAR(100) DEFAULT "Full-time,Part-time,Contract"',
            'ALTER TABLE leave_types ADD COLUMN requires_document TINYINT(1) DEFAULT 0'
        ]

        for query in alter_queries:
            try:
                cursor.execute(query)
                print(f'Executed: {query}')
            except mysql.connector.Error as e:
                if 'Duplicate column name' not in str(e):
                    print(f'Error executing {query}: {e}')

        # Update existing records with proper values
        update_queries = [
            "UPDATE leave_types SET leave_name = 'Casual Leave', is_paid = 0, max_days = 12, requires_document = 0 WHERE leave_type = 'Casual Leave'",
            "UPDATE leave_types SET leave_name = 'Sick Leave', is_paid = 1, max_days = 10, requires_document = 1 WHERE leave_type = 'Sick Leave'",
            "UPDATE leave_types SET leave_name = 'Vacation', is_paid = 1, max_days = 15, requires_document = 0 WHERE leave_type = 'Vacation'",
            "UPDATE leave_types SET leave_name = 'Maternity Leave', is_paid = 1, max_days = 90, requires_document = 1 WHERE leave_type = 'Maternity Leave'",
            "UPDATE leave_types SET leave_name = 'Paternity Leave', is_paid = 1, max_days = 15, requires_document = 0 WHERE leave_type = 'Paternity Leave'"
        ]

        for query in update_queries:
            try:
                cursor.execute(query)
                print(f'Executed: {query}')
            except mysql.connector.Error as e:
                print(f'Error executing {query}: {e}')

        # Add missing columns to leave_application table
        leave_app_alter_queries = [
            'ALTER TABLE leave_application ADD COLUMN leave_category VARCHAR(20) DEFAULT NULL',
            'ALTER TABLE leave_application ADD COLUMN employee_type VARCHAR(20) DEFAULT "Full-time"',
            'ALTER TABLE leave_application ADD COLUMN hr_remarks TEXT DEFAULT NULL',
            'ALTER TABLE leave_application ADD COLUMN approved_by_hr TINYINT(1) DEFAULT 0',
            'ALTER TABLE leave_application ADD COLUMN approver_id INT(5) DEFAULT NULL',
            'ALTER TABLE leave_application ADD COLUMN handover_person VARCHAR(100) DEFAULT NULL'
        ]

        for query in leave_app_alter_queries:
            try:
                cursor.execute(query)
                print(f'Executed: {query}')
            except mysql.connector.Error as e:
                if 'Duplicate column name' not in str(e):
                    print(f'Error executing {query}: {e}')

        # Add missing columns to leave_balance table
        leave_balance_alter_queries = [
            'ALTER TABLE leave_balance ADD COLUMN leave_year YEAR DEFAULT (YEAR(CURDATE()))',
            'ALTER TABLE leave_balance ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ]

        for query in leave_balance_alter_queries:
            try:
                cursor.execute(query)
                print(f'Executed: {query}')
            except mysql.connector.Error as e:
                if 'Duplicate column name' not in str(e):
                    print(f'Error executing {query}: {e}')

        conn.commit()
        cursor.close()
        conn.close()
        print('Database schema updated successfully')

    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    fix_database_schema()
