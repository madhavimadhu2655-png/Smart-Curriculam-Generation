import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, apiService } from '../App';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    subjects: 5, // Static for now
    todaysAttendance: 0,
    learningPaths: 0,
    weeklyData: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState(null);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'];

  useEffect(() => {
    loadDashboardData();
    
    // Listen for attendance updates from QR scanner
    const handleAttendanceUpdate = () => {
      loadDashboardData();
    };
    
    window.addEventListener('attendanceUpdated', handleAttendanceUpdate);
    
    return () => {
      window.removeEventListener('attendanceUpdated', handleAttendanceUpdate);
    };
  }, []);

  const getCurrentDate = () => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load students from backend
      const studentsResponse = await apiService.get('/students');
      const students = studentsResponse.data || [];
      
      // Load weekly attendance data from backend
      const weeklyResponse = await apiService.get('/attendance/weekly');
      const weeklyData = weeklyResponse.data || [];
      
      // Load recent activity
      const recentResponse = await apiService.get('/attendance/recent?limit=10');
      const recentActivity = recentResponse.data || [];
      
      // Calculate today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todaysAttendance = recentActivity.filter(activity => activity.date === today).length;
      
      // Load learning paths from localStorage (still using localStorage for learning paths)
      const learningPathsData = JSON.parse(localStorage.getItem('edutrack_learning_paths') || '[]');
      
      setDashboardData({
        totalStudents: students.length,
        subjects: subjects.length,
        todaysAttendance,
        learningPaths: learningPathsData.length,
        weeklyData,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyData = (attendanceData, studentsData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = [];
    
    // Get dates for the current week
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    
    days.forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count attendance for this date
      let presentCount = 0;
      let absentCount = 0;
      
      Object.keys(attendanceData).forEach(key => {
        if (key.includes(dateStr)) {
          const record = attendanceData[key];
          if (record.status === 'present') {
            presentCount++;
          } else if (record.status === 'absent') {
            absentCount++;
          }
        }
      });
      
      weeklyData.push({
        day,
        date: dateStr,
        present: presentCount,
        absent: absentCount
      });
    });
    
    return weeklyData;
  };

  const generateRecentActivity = (attendanceData) => {
    const activities = [];
    
    // Convert attendance data to activity format
    Object.keys(attendanceData).forEach(key => {
      const record = attendanceData[key];
      activities.push({
        student: record.student.name,
        subject: record.subject,
        status: record.status,
        time: record.date,
        method: record.method || 'Manual'
      });
    });
    
    // Sort by most recent and take top 10
    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);
  };

  // Chart component for weekly attendance with hover effects and real-time updates
  const WeeklyChart = ({ data }) => {
    const [hoveredDay, setHoveredDay] = useState(null);
    const maxValue = Math.max(...data.map(d => d.present + d.absent), 1); // Ensure minimum 1 to avoid division by zero
    
    const calculatePercentage = (present, total) => {
      if (total === 0) return 0;
      return Math.round((present / total) * 100);
    };
    
    return (
      <div style={{ height: '300px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'end', gap: '1rem', padding: '1rem 0', height: '260px' }}>
          {data.map((day, index) => {
            const presentHeight = maxValue > 0 ? Math.max((day.present / maxValue) * 200, 2) : 0;
            const absentHeight = maxValue > 0 ? Math.max((day.absent / maxValue) * 200, 2) : 0;
            const totalStudents = day.present + day.absent;
            const attendancePercentage = calculatePercentage(day.present, totalStudents);
            
            return (
              <div 
                key={day.day} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  flex: 1,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  height: '220px', 
                  justifyContent: 'end',
                  position: 'relative'
                }}>
                  {/* Hover tooltip */}
                  {hoveredDay?.day === day.day && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      zIndex: 10,
                      marginBottom: '0.5rem',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div><strong>{day.day}</strong> ({new Date(day.date).toLocaleDateString()})</div>
                      <div>Present: <span style={{ color: 'var(--green-accent)' }}>{day.present}</span></div>
                      <div>Absent: <span style={{ color: 'var(--red-accent)' }}>{day.absent}</span></div>
                      <div>Total: {totalStudents}</div>
                      {totalStudents > 0 && (
                        <div>Attendance: <strong>{attendancePercentage}%</strong></div>
                      )}
                    </div>
                  )}
                  
                  {/* Present bar */}
                  {day.present > 0 && (
                    <div 
                      style={{ 
                        width: '40px', 
                        height: `${presentHeight}px`, 
                        background: hoveredDay?.day === day.day ? '#00a085' : '#00b894',
                        borderRadius: '4px 4px 0 0',
                        marginBottom: '2px',
                        transition: 'all 0.3s ease',
                        boxShadow: hoveredDay?.day === day.day ? '0 4px 12px rgba(0, 184, 148, 0.4)' : 'none'
                      }}
                      title={`Present: ${day.present}`}
                    ></div>
                  )}
                  
                  {/* Absent bar */}
                  {day.absent > 0 && (
                    <div 
                      style={{ 
                        width: '40px', 
                        height: `${absentHeight}px`, 
                        background: hoveredDay?.day === day.day ? '#d63031' : '#e17055',
                        borderRadius: '0 0 4px 4px',
                        transition: 'all 0.3s ease',
                        boxShadow: hoveredDay?.day === day.day ? '0 4px 12px rgba(225, 112, 85, 0.4)' : 'none'
                      }}
                      title={`Absent: ${day.absent}`}
                    ></div>
                  )}
                  
                  {/* Empty state */}
                  {day.present === 0 && day.absent === 0 && (
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '8px', 
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        transition: 'all 0.3s ease'
                      }}
                      title="No attendance data"
                    ></div>
                  )}
                </div>
                
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: hoveredDay?.day === day.day ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: hoveredDay?.day === day.day ? '600' : '400',
                  transition: 'all 0.3s ease'
                }}>
                  {day.day}
                </span>
                
                {hoveredDay?.day === day.day && totalStudents > 0 && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--blue-accent)',
                    fontWeight: '600'
                  }}>
                    {attendancePercentage}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Dynamic Legend */}
        <div style={{ 
          position: 'absolute', 
          right: '1rem', 
          top: '1rem',
          background: 'rgba(0,0,0,0.8)',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          backdropFilter: 'blur(10px)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#00b894', borderRadius: '2px' }}></div>
            <span>Present: {data.reduce((sum, day) => sum + day.present, 0)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', background: '#e17055', borderRadius: '2px' }}></div>
            <span>Absent: {data.reduce((sum, day) => sum + day.absent, 0)}</span>
          </div>
          {hoveredDay && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ fontWeight: '600', color: 'var(--blue-accent)' }}>{hoveredDay.day}</div>
              <div>Total: {hoveredDay.present + hoveredDay.absent}</div>
              {(hoveredDay.present + hoveredDay.absent) > 0 && (
                <div>Rate: {calculatePercentage(hoveredDay.present, hoveredDay.present + hoveredDay.absent)}%</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const userName = user?.name || user?.email?.split('@')[0] || 'Demo Teacher';

  return (
    <div className="animate-fade-in">
      {/* Welcome Section */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Welcome back, {userName}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Here's what's happening in your classroom today.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
            Today's Date
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '500' }}>
            {getCurrentDate()}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card animate-slide-in">
          <div className="stat-icon students">
            👥
          </div>
          <div className="stat-content">
            <h3>{dashboardData.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        
        <div className="stat-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon subjects">
            📚
          </div>
          <div className="stat-content">
            <h3>{dashboardData.subjects}</h3>
            <p>Subjects</p>
          </div>
        </div>
        
        <div className="stat-card animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon attendance">
            📋
          </div>
          <div className="stat-content">
            <h3>{dashboardData.todaysAttendance}</h3>
            <p>Today's Attendance</p>
          </div>
        </div>
        
        <div className="stat-card animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon paths">
            🎯
          </div>
          <div className="stat-content">
            <h3>{dashboardData.learningPaths}</h3>
            <p>Learning Paths</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Weekly Attendance Overview */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Weekly Attendance Overview</h3>
            <button 
              onClick={loadDashboardData}
              className="btn btn-secondary btn-sm"
              title="Refresh Data"
            >
              🔄
            </button>
          </div>
          {dashboardData.weeklyData.length > 0 ? (
            <WeeklyChart data={dashboardData.weeklyData} />
          ) : (
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <p>No attendance data yet</p>
              <p style={{ fontSize: '0.875rem' }}>Start marking attendance to see the weekly overview</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-content">
            <div className="activity-feed">
              {dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-status ${activity.status}`}></div>
                    <div className="activity-details">
                      <h4>{activity.student_name}</h4>
                      <p>{activity.subject} • {activity.status === 'present' ? 'Present' : 'Absent'}</p>
                    </div>
                    <div className="activity-time">
                      <div>{new Date(activity.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.7rem', opacity: '0.7' }}>⚪ {activity.method}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <p>No recent activity</p>
                  <p style={{ fontSize: '0.875rem' }}>Student activity will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user?.role === 'teacher' && (
        <div className="glass-card mt-4">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-subtitle">Manage your classroom efficiently</p>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link to="/students" className="btn btn-primary">
                👥 Manage Students
              </Link>
              <Link to="/qr-scanner" className="btn btn-secondary">
                📱 QR Scanner
              </Link>
              <Link to="/learning-paths" className="btn btn-secondary">
                🎯 Learning Paths
              </Link>
              <Link to="/reports" className="btn btn-secondary">
                📈 Generate Reports
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Student Quick Access */}
      {user?.role === 'student' && (
        <div className="glass-card mt-4">
          <div className="card-header">
            <h3 className="card-title">Your Learning Journey</h3>
            <p className="card-subtitle">Continue your education</p>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <Link to="/learning-paths" className="btn btn-primary">
                🎯 My Learning Paths
              </Link>
              <Link to="/progress" className="btn btn-secondary">
                📊 View Progress
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;