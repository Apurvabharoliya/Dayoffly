import mysql.connector

# Test updating hr_remarks directly
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='dayoffly',
    port=3306
)

cursor = conn.cursor()

# Test update
test_remarks = "Test HR remarks from script"
leave_id = 21

print(f"Testing update of leave_id {leave_id} with remarks: '{test_remarks}'")

update_query = "UPDATE leave_application SET hr_remarks = %s WHERE leave_id = %s"
cursor.execute(update_query, (test_remarks, leave_id))
conn.commit()

print(f"Update executed, affected rows: {cursor.rowcount}")

# Check result
cursor.execute('SELECT leave_id, hr_remarks FROM leave_application WHERE leave_id = %s', (leave_id,))
result = cursor.fetchone()
print(f"Result after update: ID: {result[0]}, HR Remarks: '{result[1]}'")

cursor.close()
conn.close()
