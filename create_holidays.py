import mysql.connector

# Connect to database
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='dayoffly'
)

cursor = conn.cursor()

# Create holidays table
cursor.execute('''
    CREATE TABLE holidays (
        holiday_id INT AUTO_INCREMENT PRIMARY KEY,
        holiday_name VARCHAR(100) NOT NULL,
        holiday_date DATE NOT NULL
    )
''')

# Insert sample holidays
holidays = [
    ("Republic Day", "2024-01-26"),
    ("Holi", "2024-03-25"),
    ("Independence Day", "2024-08-15"),
    ("Diwali", "2024-11-12")
]

cursor.executemany('INSERT INTO holidays (holiday_name, holiday_date) VALUES (%s, %s)', holidays)

conn.commit()
cursor.close()
conn.close()

print('Holidays table created and populated successfully')
