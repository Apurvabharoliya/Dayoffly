import requests
import json

def login_and_get_token():
    """Login to get JWT token"""
    login_url = "http://localhost:5000/login"
    login_data = {
        "userId": "40002",  # Emma Wilson's ID
        "password": "emma40002"  # Password from database
    }

    print(f"Trying password: {login_data['password']}")
    try:
        response = requests.post(login_url, json=login_data)
        print(f"Login Status: {response.status_code}")

        if response.status_code == 200:
            login_result = response.json()
            if login_result.get('success'):
                token = login_result.get('token')
                print("✓ Login successful, got JWT token")
                return token
            else:
                print(f"✗ Login failed: {login_result.get('message')}")
        else:
            print(f"✗ Login request failed: {response.text}")
    except Exception as e:
        print(f"✗ Login error: {e}")

    return None

# Test the leave application submission endpoint
def test_leave_application():
    # First login to get token
    token = login_and_get_token()
    if not token:
        print("Cannot proceed without authentication token")
        return

    url = "http://localhost:5000/api/leave-application"

    # Test data for leave application
    test_data = {
        "leaveType": "Casual Leave",
        "startDate": "2025-01-15",
        "endDate": "2025-01-16",
        "reason": "Family emergency",
        "halfDay": False
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    try:
        print("\nTesting leave application submission...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_data, indent=2)}")

        response = requests.post(url, json=test_data, headers=headers)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('success'):
                print("✓ Leave application submitted successfully!")
                print(f"Leave ID: {response_data.get('leave_id')}")
            else:
                print("✗ Leave application failed")
        else:
            print(f"✗ Request failed with status {response.status_code}")

    except requests.exceptions.ConnectionError:
        print("✗ Connection failed - server may not be running")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_leave_application()
