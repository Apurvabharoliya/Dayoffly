# test_database.py - Database Connection Test Script
import mysql.connector
from datetime import datetime

def test_database_connection():
    print("🔍 Testing Database Connection...")
    
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'dayoffly',
        'port': 3306
    }
    
    try:
        # Test connection
        conn = mysql.connector.connect(**db_config)
        print("✅ Database connection successful!")
        
        cursor = conn.cursor(dictionary=True)
        
        # Test if database exists
        cursor.execute("SHOW DATABASES")
        databases = [db['Database'] for db in cursor.fetchall()]
        print(f"📊 Available databases: {databases}")
        
        if 'dayoffly' in databases:
            print("✅ 'dayoffly' database exists")
            
            # Test if tables exist
            cursor.execute("SHOW TABLES")
            tables = [table[f"Tables_in_{db_config['database']}"] for table in cursor.fetchall()]
            print(f"📋 Tables in dayoffly: {tables}")
            
            # Check each table structure and data
            for table in tables:
                cursor.execute(f"DESCRIBE {table}")
                columns = cursor.fetchall()
                print(f"\n📝 Table: {table}")
                print("Columns:")
                for col in columns:
                    print(f"  - {col['Field']} ({col['Type']})")
                
                cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                count = cursor.fetchone()['count']
                print(f"  Rows: {count}")
                
                if count > 0:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                    sample_data = cursor.fetchall()
                    print(f"  Sample data: {sample_data}")
        
        else:
            print("❌ 'dayoffly' database does not exist!")
            
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Database connection failed: {err}")
        print("Troubleshooting tips:")
        print("1. Make sure XAMPP MySQL is running")
        print("2. Check if MySQL service is started in XAMPP Control Panel")
        print("3. Verify database name 'dayoffly' exists")
        print("4. Check if username 'root' and empty password are correct")

if __name__ == "__main__":
    test_database_connection()