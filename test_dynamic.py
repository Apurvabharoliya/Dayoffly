import requests
import json
import mysql.connector

# Test the API endpoint directly
url = 'http://localhost:5000/hr/update-leave-status'
headers = {'Content-Type': 'application/json'}

test_data = {
    'leave_id': 18,
    'status': 'Rejected',
    'employee_name': 'Test Employee',
    'hr_remarks': 'Dynamic HR remarks from API call - not static'
}

print('Testing API endpoint directly...')
print(f'URL: {url}')
print(f'Data: {json.dumps(test_data, indent=2)}')

try:
    response = requests.post(url, json=test_data, headers=headers)
    print(f'Response status: {response.status_code}')
    print(f'Response: {response.json()}')
except Exception as e:
    print(f'Error: {e}')

# Check the database
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='',
    database='dayoffly',
    port=3306
)

cursor = conn.cursor(dictionary=True)
cursor.execute('SELECT leave_id, leave_status, hr_remarks FROM leave_application WHERE leave_id = 18')
result = cursor.fetchone()

print('\nDatabase check after API call:')
if result:
    hr_remarks = result['hr_remarks']
    if hr_remarks is None:
        hr_remarks_display = 'NULL'
    else:
        hr_remarks_display = f'"{hr_remarks}"'
    print(f'ID: {result["leave_id"]}, Status: {result["leave_status"]}, HR Remarks: {hr_remarks_display}')
else:
    print('No record found')

cursor.close()
conn.close()
