# notification_service.py - SMS Notification Service for HR Leave Requests
import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import mysql.connector
from datetime import datetime

# Twilio Configuration - Set these environment variables to enable real SMS
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '+918866378552')  # Default to the HR number you provided

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'dayoffly',
    'port': 3306
}

def get_db_connection():
    """Create database connection"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as e:
        print(f"✗ Database connection failed: {e}")
        return None

def send_sms_notification(phone_number, message):
    """Send SMS notification using Twilio"""
    try:
        # Check if Twilio credentials are configured
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or TWILIO_ACCOUNT_SID.startswith('test_'):
            print("⚠️  Twilio credentials not configured. SMS notification will be logged instead.")
            print(f"📱 Would send SMS to {phone_number}: {message}")
            return True

        # Initialize Twilio client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # Send SMS
        message_response = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )

        print(f"✓ SMS sent successfully to {phone_number}. SID: {message_response.sid}")
        return True

    except TwilioException as e:
        print(f"✗ Twilio error sending SMS to {phone_number}: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error sending SMS to {phone_number}: {e}")
        return False

def notify_hr_leave_request(employee_name, leave_type, start_date, end_date, reason):
    """Send leave request notification to the provided HR number"""
    try:
        # Use the provided HR number directly
        hr_phone_number = "+918866378552"

        # Format dates
        start = start_date.strftime('%d/%m/%Y') if isinstance(start_date, datetime) else str(start_date)
        end = end_date.strftime('%d/%m/%Y') if isinstance(end_date, datetime) else str(end_date)

        # Create SMS message
        message = f"DayOffly Alert: New leave request from {employee_name}\nType: {leave_type}\nDates: {start} - {end}\nReason: {reason}"

        # Send SMS to the HR number
        print(f"📤 Sending notification to HR at {hr_phone_number}")
        if send_sms_notification(hr_phone_number, message):
            print("✓ Notification sent successfully to HR")
            return True
        else:
            print(f"✗ Failed to send SMS to HR ({hr_phone_number})")
            return False

    except Exception as e:
        print(f"✗ Error in HR notification: {e}")
        return False

def test_sms_notification():
    """Test function to verify SMS setup"""
    test_phone = "+918866378552"  # Test with the provided number
    test_message = "DayOffly Test: SMS notification system is working!"

    print("🧪 Testing SMS notification...")
    return send_sms_notification(test_phone, test_message)

if __name__ == "__main__":
    # Test the notification system
    print("Testing HR notification system...")
    test_sms_notification()
