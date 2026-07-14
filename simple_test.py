#!/usr/bin/env python3

import requests
import json
import time
from datetime import date, datetime

BASE_URL = "https://smartedu-path.preview.emergentagent.com/api"

def test_basic_flow():
    print("🚀 Testing EduTrack Basic Flow...")
    
    # 1. Register teacher
    print("\n1. Registering teacher...")
    timestamp = int(time.time())
    teacher_data = {
        "name": f"Teacher {timestamp}",
        "email": f"teacher{timestamp}@test.com", 
        "password": "TestPass123!",
        "role": "teacher"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=teacher_data, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            teacher_user = response.json()
            print(f"   ✅ Teacher registered: {teacher_user['name']}")
        else:
            print(f"   ❌ Registration failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        return False
    
    # 2. Login teacher
    print("\n2. Logging in teacher...")
    login_data = {
        "email": teacher_data["email"],
        "password": teacher_data["password"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            login_result = response.json()
            token = login_result['access_token']
            print(f"   ✅ Teacher logged in: {login_result['user']['name']}")
        else:
            print(f"   ❌ Login failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Login error: {e}")
        return False
    
    # 3. Test invalid login
    print("\n3. Testing invalid login...")
    invalid_login = {
        "email": "invalid@test.com",
        "password": "wrongpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=invalid_login, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print(f"   ✅ Invalid login correctly rejected")
        else:
            print(f"   ❌ Expected 401, got {response.status_code}: {response.text}")
    except Exception as e:
        print(f"   ❌ Invalid login test error: {e}")
    
    # 4. Create student
    print("\n4. Creating student...")
    student_data = {
        "name": "John Doe",
        "rollNo": f"STU{timestamp}",
        "class": "Computer Science A",
        "email": f"john{timestamp}@student.com",
        "username": f"john{timestamp}"
    }
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    try:
        response = requests.post(f"{BASE_URL}/students", json=student_data, headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            student = response.json()
            print(f"   ✅ Student created: {student['name']} ({student['rollNo']})")
        else:
            print(f"   ❌ Student creation failed: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Student creation error: {e}")
        return False
    
    # 5. Get students
    print("\n5. Getting students...")
    try:
        response = requests.get(f"{BASE_URL}/students", headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            students = response.json()
            print(f"   ✅ Retrieved {len(students)} students")
        else:
            print(f"   ❌ Get students failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Get students error: {e}")
    
    # 6. Mark attendance
    print("\n6. Marking attendance...")
    attendance_data = {
        "student_id": student['id'],
        "subject": "Computer Science",
        "date": date.today().isoformat(),
        "status": "present",
        "method": "Manual",
        "time": datetime.now().strftime("%H:%M:%S"),
        "notes": "Test attendance"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/attendance/mark", json=attendance_data, headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            attendance = response.json()
            print(f"   ✅ Attendance marked: {attendance['student_name']} - {attendance['status']}")
        else:
            print(f"   ❌ Attendance marking failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Attendance marking error: {e}")
    
    # 7. QR Scanner test
    print("\n7. Testing QR scanner...")
    try:
        response = requests.get(f"{BASE_URL}/attendance/qr-scan/{student['rollNo']}", 
                              headers=headers, params={"subject": "Mathematics"}, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            qr_result = response.json()
            print(f"   ✅ QR scan result: {qr_result['message']}")
        else:
            print(f"   ❌ QR scan failed: {response.text}")
    except Exception as e:
        print(f"   ❌ QR scan error: {e}")
    
    # 8. Recent attendance
    print("\n8. Getting recent attendance...")
    try:
        response = requests.get(f"{BASE_URL}/attendance/recent", headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            recent = response.json()
            print(f"   ✅ Retrieved {len(recent)} recent attendance records")
        else:
            print(f"   ❌ Recent attendance failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Recent attendance error: {e}")
    
    # 9. Weekly dashboard
    print("\n9. Getting weekly dashboard...")
    try:
        response = requests.get(f"{BASE_URL}/attendance/weekly", headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            weekly = response.json()
            print(f"   ✅ Retrieved weekly data for {len(weekly)} days")
        else:
            print(f"   ❌ Weekly dashboard failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Weekly dashboard error: {e}")
    
    print("\n🎉 Basic flow test completed!")
    return True

if __name__ == "__main__":
    test_basic_flow()