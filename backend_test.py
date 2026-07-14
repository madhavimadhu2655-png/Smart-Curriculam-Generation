import requests
import sys
import json
from datetime import datetime, date
import time

class EduTrackAPITester:
    def __init__(self, base_url="https://smartedu-path.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.teacher_token = None
        self.student_token = None
        self.teacher_user = None
        self.student_user = None
        self.created_students = []
        self.attendance_records = []
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, message="", response_data=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED - {message}")
        else:
            print(f"❌ {name}: FAILED - {message}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "message": message,
            "response_data": response_data
        })

    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=60)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=60)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=60)
            
            return response
        except requests.exceptions.Timeout as e:
            print(f"Request timeout for {method} {endpoint}: {str(e)}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"Request failed for {method} {endpoint}: {str(e)}")
            return None

    def test_health_check(self):
        """Test API health check"""
        print("\n🔍 Testing Health Check...")
        response = self.make_request('GET', 'health')
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy':
                self.log_test("Health Check", True, "API is healthy", data)
                return True
            else:
                self.log_test("Health Check", False, f"Unhealthy status: {data}")
        else:
            status_code = response.status_code if response else "No response"
            self.log_test("Health Check", False, f"Status code: {status_code}")
        return False

    def test_teacher_registration(self):
        """Test teacher registration"""
        print("\n🔍 Testing Teacher Registration...")
        timestamp = int(time.time())
        teacher_data = {
            "name": f"Sarah Johnson {timestamp}",
            "email": f"sarah.johnson{timestamp}@edutrack.com",
            "password": "SecurePass123!",
            "role": "teacher"
        }
        
        response = self.make_request('POST', 'auth/register', teacher_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('role') == 'teacher':
                self.teacher_user = data
                # Store credentials for login
                self.teacher_user['password'] = teacher_data['password']
                self.log_test("Teacher Registration", True, f"Teacher registered: {data['name']}", data)
                return True
            else:
                self.log_test("Teacher Registration", False, f"Wrong role: {data}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("Teacher Registration", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def test_teacher_login(self):
        """Test teacher login"""
        print("\n🔍 Testing Teacher Login...")
        if not self.teacher_user:
            self.log_test("Teacher Login", False, "No teacher user to login with")
            return False
        
        login_data = {
            "email": self.teacher_user['email'],
            "password": self.teacher_user['password']
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('access_token') and data.get('user'):
                self.teacher_token = data['access_token']
                self.log_test("Teacher Login", True, f"Teacher logged in: {data['user']['name']}", data)
                return True
            else:
                self.log_test("Teacher Login", False, f"Missing token or user data: {data}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("Teacher Login", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        print("\n🔍 Testing Invalid Login...")
        
        login_data = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        
        if response and response.status_code == 401:
            data = response.json()
            if data.get('detail') == 'Invalid credentials':
                self.log_test("Invalid Login", True, "Correctly rejected invalid credentials", data)
                return True
            else:
                self.log_test("Invalid Login", False, f"Wrong error message: {data}")
        else:
            self.log_test("Invalid Login", False, f"Expected 401, got: {response.status_code if response else 'None'}")
        return False

    def test_create_students(self):
        """Test creating multiple students"""
        print("\n🔍 Testing Student Creation...")
        if not self.teacher_token:
            self.log_test("Create Students", False, "No teacher token available")
            return False
        
        students_data = [
            {
                "name": "Alex Chen",
                "rollNo": "CS2024001",
                "class": "Computer Science A",
                "email": "alex.chen@student.edu",
                "username": "alexchen"
            },
            {
                "name": "Maria Rodriguez",
                "rollNo": "CS2024002", 
                "class": "Computer Science A",
                "email": "maria.rodriguez@student.edu",
                "username": "mariarodriguez"
            },
            {
                "name": "James Wilson",
                "rollNo": "CS2024003",
                "class": "Computer Science B", 
                "email": "james.wilson@student.edu",
                "username": "jameswilson"
            }
        ]
        
        success_count = 0
        for student_data in students_data:
            response = self.make_request('POST', 'students', student_data, self.teacher_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get('id') and data.get('rollNo') == student_data['rollNo']:
                    self.created_students.append(data)
                    success_count += 1
                    print(f"  ✅ Created student: {data['name']} ({data['rollNo']})")
                else:
                    print(f"  ❌ Failed to create student: {student_data['name']} - Missing fields")
            else:
                error_msg = response.json() if response else "No response"
                status_code = response.status_code if response else "None"
                print(f"  ❌ Failed to create student: {student_data['name']} - Status: {status_code}, Error: {error_msg}")
        
        if success_count == len(students_data):
            self.log_test("Create Students", True, f"Created {success_count} students successfully")
            return True
        else:
            self.log_test("Create Students", False, f"Only created {success_count}/{len(students_data)} students")
            return False

    def test_get_students(self):
        """Test getting all students"""
        print("\n🔍 Testing Get Students...")
        if not self.teacher_token:
            self.log_test("Get Students", False, "No teacher token available")
            return False
        
        response = self.make_request('GET', 'students', token=self.teacher_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) >= len(self.created_students):
                self.log_test("Get Students", True, f"Retrieved {len(data)} students", data)
                return True
            else:
                self.log_test("Get Students", False, f"Expected list with at least {len(self.created_students)} students, got: {len(data) if isinstance(data, list) else type(data)}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("Get Students", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def test_duplicate_student_creation(self):
        """Test creating duplicate student (should fail)"""
        print("\n🔍 Testing Duplicate Student Creation...")
        if not self.teacher_token or not self.created_students:
            self.log_test("Duplicate Student Creation", False, "No teacher token or students available")
            return False
        
        # Try to create student with same roll number
        duplicate_data = {
            "name": "Duplicate Student",
            "rollNo": self.created_students[0]['rollNo'],  # Same roll number
            "class": "Test Class",
            "email": "duplicate@test.com",
            "username": "duplicate"
        }
        
        response = self.make_request('POST', 'students', duplicate_data, self.teacher_token)
        
        if response and response.status_code == 400:
            data = response.json()
            if 'Roll number already exists' in data.get('detail', ''):
                self.log_test("Duplicate Student Creation", True, "Correctly rejected duplicate roll number", data)
                return True
            else:
                self.log_test("Duplicate Student Creation", False, f"Wrong error message: {data}")
        else:
            self.log_test("Duplicate Student Creation", False, f"Expected 400, got: {response.status_code if response else 'None'}")
        return False

    def test_mark_attendance_manual(self):
        """Test manual attendance marking"""
        print("\n🔍 Testing Manual Attendance Marking...")
        if not self.teacher_token or not self.created_students:
            self.log_test("Manual Attendance", False, "No teacher token or students available")
            return False
        
        today = date.today().isoformat()
        current_time = datetime.now().strftime("%H:%M:%S")
        
        success_count = 0
        for i, student in enumerate(self.created_students[:2]):  # Test with first 2 students
            attendance_data = {
                "student_id": student['id'],
                "subject": "Computer Science",
                "date": today,
                "status": "present" if i == 0 else "absent",
                "method": "Manual",
                "time": current_time,
                "notes": f"Manual attendance for {student['name']}"
            }
            
            response = self.make_request('POST', 'attendance/mark', attendance_data, self.teacher_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get('id') and data.get('student_name') == student['name']:
                    self.attendance_records.append(data)
                    success_count += 1
                    print(f"  ✅ Marked {data['status']} for {data['student_name']}")
                else:
                    print(f"  ❌ Failed to mark attendance for {student['name']} - Missing fields")
            else:
                error_msg = response.json() if response else "No response"
                print(f"  ❌ Failed to mark attendance for {student['name']} - {error_msg}")
        
        if success_count > 0:
            self.log_test("Manual Attendance", True, f"Marked attendance for {success_count} students")
            return True
        else:
            self.log_test("Manual Attendance", False, "Failed to mark any attendance")
            return False

    def test_qr_scanner_attendance(self):
        """Test QR scanner attendance endpoint"""
        print("\n🔍 Testing QR Scanner Attendance...")
        if not self.teacher_token or not self.created_students:
            self.log_test("QR Scanner Attendance", False, "No teacher token or students available")
            return False
        
        # Test QR scan for the third student
        student = self.created_students[-1]  # Last student
        params = {"subject": "Mathematics"}
        
        response = self.make_request('GET', f'attendance/qr-scan/{student["rollNo"]}', 
                                   token=self.teacher_token, params=params)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('message') and data.get('student') and data.get('status'):
                if data['status'] == 'marked':
                    self.log_test("QR Scanner Attendance", True, f"QR scan successful: {data['message']}", data)
                    return True
                elif data['status'] == 'already_marked':
                    self.log_test("QR Scanner Attendance", True, f"QR scan handled duplicate: {data['message']}", data)
                    return True
                else:
                    self.log_test("QR Scanner Attendance", False, f"Unknown status: {data['status']}")
            else:
                self.log_test("QR Scanner Attendance", False, f"Missing required fields: {data}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("QR Scanner Attendance", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def test_recent_attendance(self):
        """Test getting recent attendance records"""
        print("\n🔍 Testing Recent Attendance...")
        if not self.teacher_token:
            self.log_test("Recent Attendance", False, "No teacher token available")
            return False
        
        response = self.make_request('GET', 'attendance/recent', token=self.teacher_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Recent Attendance", True, f"Retrieved {len(data)} recent attendance records", data)
                return True
            else:
                self.log_test("Recent Attendance", False, f"Expected list, got: {type(data)}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("Recent Attendance", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def test_weekly_attendance_dashboard(self):
        """Test weekly attendance dashboard data"""
        print("\n🔍 Testing Weekly Attendance Dashboard...")
        if not self.teacher_token:
            self.log_test("Weekly Dashboard", False, "No teacher token available")
            return False
        
        response = self.make_request('GET', 'attendance/weekly', token=self.teacher_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) == 7:  # Should return 7 days
                # Check if each day has required fields
                valid_days = all('day' in day and 'date' in day and 'present' in day and 'absent' in day 
                               for day in data)
                if valid_days:
                    self.log_test("Weekly Dashboard", True, f"Retrieved weekly data for 7 days", data)
                    return True
                else:
                    self.log_test("Weekly Dashboard", False, "Missing required fields in daily data")
            else:
                self.log_test("Weekly Dashboard", False, f"Expected list of 7 days, got: {len(data) if isinstance(data, list) else type(data)}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("Weekly Dashboard", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def test_nonexistent_student_attendance(self):
        """Test marking attendance for non-existent student"""
        print("\n🔍 Testing Non-existent Student Attendance...")
        if not self.teacher_token:
            self.log_test("Non-existent Student Attendance", False, "No teacher token available")
            return False
        
        attendance_data = {
            "student_id": "non-existent-id-12345",
            "subject": "Test Subject",
            "date": date.today().isoformat(),
            "status": "present",
            "method": "Manual",
            "time": datetime.now().strftime("%H:%M:%S")
        }
        
        response = self.make_request('POST', 'attendance/mark', attendance_data, self.teacher_token)
        
        if response and response.status_code == 404:
            data = response.json()
            if 'Student not found' in data.get('detail', ''):
                self.log_test("Non-existent Student Attendance", True, "Correctly rejected non-existent student", data)
                return True
            else:
                self.log_test("Non-existent Student Attendance", False, f"Wrong error message: {data}")
        else:
            self.log_test("Non-existent Student Attendance", False, f"Expected 404, got: {response.status_code if response else 'None'}")
        return False

    def test_unauthorized_access(self):
        """Test unauthorized access to teacher endpoints"""
        print("\n🔍 Testing Unauthorized Access...")
        
        # Test without token
        response = self.make_request('GET', 'students')
        
        if response and response.status_code == 401:
            self.log_test("Unauthorized Access", True, "Correctly rejected request without token")
            return True
        else:
            self.log_test("Unauthorized Access", False, f"Expected 401, got: {response.status_code if response else 'None'}")
        return False

    def test_delete_student(self):
        """Test deleting a student"""
        print("\n🔍 Testing Student Deletion...")
        if not self.teacher_token or not self.created_students:
            self.log_test("Delete Student", False, "No teacher token or students available")
            return False
        
        # Delete the last created student
        student_to_delete = self.created_students[-1]
        response = self.make_request('DELETE', f'students/{student_to_delete["id"]}', token=self.teacher_token)
        
        if response and response.status_code == 200:
            data = response.json()
            if data.get('message') == 'Student deleted successfully':
                self.log_test("Delete Student", True, f"Successfully deleted student: {student_to_delete['name']}", data)
                # Remove from our tracking list
                self.created_students.remove(student_to_delete)
                return True
            else:
                self.log_test("Delete Student", False, f"Wrong success message: {data}")
        else:
            error_msg = response.json() if response else "No response"
            self.log_test("Delete Student", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        return False

    def run_all_tests(self):
        """Run all EduTrack API tests"""
        print("🚀 Starting EduTrack API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test sequence for EduTrack
        tests = [
            self.test_health_check,
            self.test_teacher_registration,
            self.test_teacher_login,
            self.test_invalid_login,
            self.test_unauthorized_access,
            self.test_create_students,
            self.test_get_students,
            self.test_duplicate_student_creation,
            self.test_mark_attendance_manual,
            self.test_qr_scanner_attendance,
            self.test_recent_attendance,
            self.test_weekly_attendance_dashboard,
            self.test_nonexistent_student_attendance,
            self.test_delete_student
        ]
        
        for test in tests:
            try:
                test()
                time.sleep(1)  # Small delay between tests
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
        
        # Print summary
        print(f"\n📊 EduTrack API Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        else:
            print(f"\n🎉 All tests passed! EduTrack backend is working correctly.")
        
        return self.tests_passed == self.tests_run

def main():
    tester = EduTrackAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())