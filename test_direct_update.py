import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='dayoffly',
    port=3306
)
cursor = conn.cursor()

cursor.execute('UPDATE leave_application SET hr_remarks = "Test direct update" WHERE leave_id = 18')
conn.commit()

cursor.execute('SELECT leave_id, leave_status, hr_remarks FROM leave_application WHERE leave_id = 18')
result = cursor.fetchone()
print('Direct update result:', result)

cursor.close()
conn.close()
