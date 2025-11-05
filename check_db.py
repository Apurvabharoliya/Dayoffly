import mysql.connector

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='dayoffly',
    port=3306
)

cursor = conn.cursor(dictionary=True)
cursor.execute('SELECT leave_id, leave_status, hr_remarks FROM leave_application ORDER BY leave_id DESC LIMIT 5')
results = cursor.fetchall()

print("Current leave_application records:")
for row in results:
    print(f'ID: {row["leave_id"]}, Status: {row["leave_status"]}, HR Remarks: "{row["hr_remarks"]}"')

cursor.close()
conn.close()
