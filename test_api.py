import requests
import json

# Test the API endpoint directly
url = 'http://localhost:5000/hr/update-leave-status'
headers = {'Content-Type': 'application/json'}

test_data = {
    'leave_id': 20,
    'status': 'Approved',
    'employee_name': 'Test Employee',
    'hr_remarks': 'Test remarks from API call'
}

print("Testing API endpoint directly...")
print(f"URL: {url}")
print(f"Data: {json.dumps(test_data, indent=2)}")

try:
    response = requests.post(url, json=test_data, headers=headers)
    print(f"Response status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
