# test_db.py
import mysql.connector

def test_database():
    config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'dayoffly',
        'port': 3306
    }
    
    try:
        conn = mysql.connector.connect(**config)
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"✓ Basic query test: {result}")
        
        # Test table existence
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print("✓ Tables in database:", tables)
        
        # Test leave_application table
        cursor.execute("SELECT COUNT(*) FROM leave_application")
        count = cursor.fetchone()
        print(f"✓ Leave applications count: {count[0]}")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"✗ Database error: {e}")

if __name__ == "__main__":
    test_database()