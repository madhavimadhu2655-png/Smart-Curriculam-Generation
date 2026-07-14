import React, { useState, useEffect, useRef } from 'react';
import { useAuth, apiService } from '../App';
import jsQR from 'jsqr';

const QRScanner = () => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [subjects] = useState(['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science']);
  const [scanStatus, setScanStatus] = useState('');
  const [students, setStudents] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Load students and recent attendance from backend
  useEffect(() => {
    loadStudents();
    loadRecentAttendance();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await apiService.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadRecentAttendance = async () => {
    try {
      const response = await apiService.get('/attendance/recent?limit=10');
      setRecentScans(response.data || []);
    } catch (error) {
      console.error('Error loading recent attendance:', error);
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  };

  const startCamera = async () => {
    try {
      setScanStatus('🎥 Starting camera...');
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to load
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
        
        setIsScanning(true);
        setScanStatus('📱 Camera active - Hold QR code in front of camera');
        
        // Start QR code detection immediately
        startQRDetection();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Camera access failed. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check camera permissions.';
      }
      
      setScanStatus(`❌ ${errorMessage}`);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    setIsScanning(false);
    setScanStatus('');
  };

  const startQRDetection = () => {
    // Real QR code detection using jsQR library
    scanIntervalRef.current = setInterval(() => {
      if (isScanning && videoRef.current && canvasRef.current) {
        detectQRCode();
      }
    }, 100); // Check every 100ms for better responsiveness
  };

  const detectQRCode = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for QR detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Use jsQR to detect QR codes
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (qrCode) {
      processQRCode(qrCode.data);
    }
  };

  const processQRCode = async (qrData) => {
    try {
      // Parse QR code data
      let rollNo = null;
      
      // Try to parse as JSON first (from our generated QR codes)
      try {
        const parsed = JSON.parse(qrData);
        rollNo = parsed.rollNo || parsed.studentId;
      } catch (e) {
        // If not JSON, try direct roll number lookup
        rollNo = qrData;
      }
      
      if (!rollNo) {
        setScanStatus(`❌ Invalid QR code data: ${qrData}`);
        return;
      }
      
      // Call backend API to mark attendance
      const response = await apiService.get(`/attendance/qr-scan/${rollNo}?subject=${selectedSubject}`);
      
      if (response.data.status === 'already_marked') {
        setScanStatus(`⚠️ ${response.data.message}`);
      } else {
        setScanStatus(`✅ ${response.data.message}`);
        
        // Reload recent attendance to update the list
        await loadRecentAttendance();
        
        // Dispatch event to update dashboard
        window.dispatchEvent(new CustomEvent('attendanceUpdated'));
      }
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      
      if (error.response?.status === 404) {
        setScanStatus(`❌ Student not found: ${qrData}`);
      } else {
        setScanStatus('❌ Error processing QR code');
      }
    }
  };

  const markManualAttendance = async (student, status) => {
    try {
      const attendanceData = {
        student_id: student.id,
        subject: selectedSubject,
        date: selectedDate,
        status: status,
        method: 'Manual',
        time: new Date().toLocaleTimeString()
      };
      
      const response = await apiService.post('/attendance/mark', attendanceData);
      
      // Reload recent attendance to update the list
      await loadRecentAttendance();
      
      // Dispatch event to update dashboard
      window.dispatchEvent(new CustomEvent('attendanceUpdated'));
      
      setScanStatus(`✅ ${student.name} marked ${status.toUpperCase()} for ${selectedSubject}`);
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setScanStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Error marking manual attendance:', error);
      setScanStatus('❌ Error marking attendance');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (user?.role !== 'teacher') {
    return (
      <div className="glass-card">
        <div className="card-content text-center" style={{ padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Access Denied</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Only teachers can access the QR scanner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            QR Code Scanner
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Scan student QR codes for instant attendance marking
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

      {/* Scanner Container */}
      <div className="qr-scanner-container">
        {/* Scanner Panel */}
        <div className="scanner-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              📱 QR Code Scanner
            </h3>
            {scanStatus && (
              <div style={{ 
                padding: '0.5rem 1rem', 
                background: scanStatus.includes('✅') ? 'var(--green-accent)' : 'var(--blue-accent)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                maxWidth: '300px'
              }}>
                {scanStatus}
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="scanner-controls">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="form-select"
                disabled={isScanning}
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input"
                disabled={isScanning}
              />
            </div>
          </div>

          {/* Camera Container */}
          <div className="camera-container">
            {isScanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div className="qr-overlay">
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'var(--orange-accent)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    Point camera at QR code
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📱</div>
                <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Camera not active</p>
                <p style={{ fontSize: '0.875rem' }}>Click "Start Scanner" to begin</p>
              </div>
            )}
          </div>

          {/* Scanner Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            {!isScanning ? (
              <button
                onClick={startCamera}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                📹 Start Scanner
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                ⏹️ Stop Scanner
              </button>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Recent Scans Panel */}
        <div className="recent-scans">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              📋 Recent Scans
            </h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {recentScans.filter(scan => scan.date === selectedDate && scan.subject === selectedSubject).length} scans today
            </div>
          </div>
          
          {recentScans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No scans yet today</p>
              <p style={{ fontSize: '0.875rem' }}>Start scanning QR codes to see attendance records</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {recentScans
                .filter(scan => scan.date === selectedDate && scan.subject === selectedSubject)
                .map((scan) => (
                <div
                  key={scan.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: scan.status === 'present' ? 'var(--green-accent)' : 'var(--red-accent)',
                      flexShrink: 0
                    }}
                  ></div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.25rem' }}>
                      {scan.student_name}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Roll: {scan.student_rollNo} • {scan.status === 'present' ? 'Present' : 'Absent'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <div>{scan.time}</div>
                    <div style={{ 
                      background: scan.method === 'QR Scanner' ? 'var(--green-accent)' : 'var(--blue-accent)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      marginTop: '0.25rem'
                    }}>
                      {scan.method}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Attendance Section */}
      <div className="glass-card mt-4">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            📝 Manual Attendance
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Mark attendance manually if QR scanner is not available
          </p>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {students.map((student) => {
              const isMarked = recentScans.find(scan => 
                scan.student_rollNo === student.rollNo && 
                scan.date === selectedDate && 
                scan.subject === selectedSubject
              );
              
              return (
                <div 
                  key={student.id}
                  style={{
                    background: isMarked ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isMarked ? 'var(--green-accent)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.25rem' }}>
                      {student.name}
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Roll: {student.rollNo} • Class: {student.class}
                    </p>
                    {isMarked && (
                      <p style={{ color: 'var(--green-accent)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        ✅ Marked {isMarked.status} via {isMarked.method}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => markManualAttendance(student, 'present')}
                      className="btn btn-success btn-sm"
                      disabled={isMarked?.status === 'present'}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markManualAttendance(student, 'absent')}
                      className="btn btn-danger btn-sm"
                      disabled={isMarked?.status === 'absent'}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card mt-4">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            📚 How to Use QR Scanner
          </h3>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>1️⃣</div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Select Subject & Date</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Choose the subject and date for which you want to mark attendance.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>2️⃣</div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Start Camera</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Click "Start Scanner" to activate your camera and begin scanning.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>3️⃣</div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Scan QR Codes</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Students scan their QR codes, and attendance is marked automatically.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>4️⃣</div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Manual Backup</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Use manual attendance marking if QR scanning is not available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;