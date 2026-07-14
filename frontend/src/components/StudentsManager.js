import React, { useState, useEffect } from 'react';
import { apiService, useAuth } from '../App';

const StudentsManager = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    rollNo: '',
    class: '',
    email: '',
    username: ''
  });

  // Load students from backend API on component mount
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR Code Data URL
  const generateQRCode = (studentData) => {
    const qrData = JSON.stringify({
      studentId: studentData.id,
      rollNo: studentData.rollNo,
      name: studentData.name,
      timestamp: Date.now()
    });
    
    // Use QR Server API for generating QR codes
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  // Download QR Code
  const downloadQRCode = async (student) => {
    try {
      const qrUrl = generateQRCode(student);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${student.rollNo}_${student.name.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      setError('Failed to download QR code. Please try again.');
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add new student using backend API
  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.name || !newStudent.rollNo || !newStudent.email) {
      setError('Please fill in all required fields (Name, Roll No, Email)');
      return;
    }

    try {
      setLoading(true);
      
      const studentData = {
        name: newStudent.name,
        rollNo: newStudent.rollNo,
        class: newStudent.class,
        email: newStudent.email,
        username: newStudent.username || newStudent.rollNo
      };
      
      const response = await apiService.post('/students', studentData);
      
      // Reload students from backend
      await loadStudents();
      
      setNewStudent({ name: '', rollNo: '', class: '', email: '', username: '' });
      setShowAddModal(false);
      setError('✅ Student added successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Failed to add student:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add student. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete student using backend API
  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const confirmDeleteStudent = async () => {
    if (studentToDelete) {
      try {
        setLoading(true);
        await apiService.delete(`/students/${studentToDelete.id}`);
        
        // Reload students from backend
        await loadStudents();
        
        setStudentToDelete(null);
        setShowDeleteModal(false);
        setError('✅ Student deleted successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setError(''), 3000);
      } catch (error) {
        console.error('Failed to delete student:', error);
        setError('Failed to delete student. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <div className="glass-card">
        <div className="card-content text-center" style={{ padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Access Denied</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Only teachers can access student management.</p>
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
            Student Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Manage student profiles and generate QR codes for attendance
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ fontSize: '1rem', padding: '0.875rem 1.5rem' }}
        >
          ➕ Add Student
        </button>
      </div>

      {error && (
        <div className={`alert ${error.includes('success') ? 'alert-success' : 'alert-error'} mb-3`}>
          <span>{error.includes('success') ? '✅' : '⚠️'}</span>
          {error}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-wrapper">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search students by name, roll number, class, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
          Total: {students.length} students
        </div>
      </div>

      {/* Students Grid */}
      {filteredStudents.length > 0 ? (
        <div className="students-grid">
          {filteredStudents.map((student, index) => (
            <div key={student.id} className="student-card animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                gap: '1rem',
                width: '100%'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ marginBottom: '0.75rem', wordBreak: 'break-word' }}>{student.name}</h3>
                  <div className="student-details">
                    <div><strong>Roll No:</strong> {student.rollNo}</div>
                    <div><strong>Class:</strong> {student.class || 'Not specified'}</div>
                    <div><strong>Email:</strong> <span style={{ wordBreak: 'break-all', fontSize: '0.875rem' }}>{student.email}</span></div>
                    <div><strong>Username:</strong> {student.username}</div>
                    {student.created_at && (
                      <div><strong>Added:</strong> {new Date(student.created_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.5rem',
                  alignItems: 'flex-end',
                  flexShrink: 0,
                  minWidth: '100px'
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        const qrUrl = generateQRCode(student);
                        window.open(qrUrl, '_blank');
                      }}
                      className="btn btn-secondary btn-sm"
                      title="View QR Code"
                      style={{ 
                        padding: '0.5rem', 
                        minWidth: '40px', 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => downloadQRCode(student)}
                      className="btn btn-success btn-sm"
                      title="Download QR Code"
                      style={{ 
                        padding: '0.5rem', 
                        minWidth: '40px', 
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ⬇️
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteStudent(student)}
                    className="btn btn-danger btn-sm"
                    title="Delete Student"
                    style={{ 
                      padding: '0.5rem 0.75rem', 
                      fontSize: '0.8rem',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card">
          <div className="card-content text-center" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {searchTerm ? '🔍' : '👥'}
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {searchTerm ? 'No Students Found' : 'No Students Yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {searchTerm 
                ? `No students match "${searchTerm}". Try a different search term.`
                : 'Add your first student to get started with EduTrack.'
              }
            </p>
            {!searchTerm && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                ➕ Add Your First Student
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Add New Student</h4>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleAddStudent} className="form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="rollNo" className="form-label">
                      Roll Number *
                    </label>
                    <input
                      type="text"
                      id="rollNo"
                      value={newStudent.rollNo}
                      onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})}
                      className="form-input"
                      placeholder="e.g., CS001, 2023001"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="class" className="form-label">
                      Class/Section
                    </label>
                    <input
                      type="text"
                      id="class"
                      value={newStudent.class}
                      onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                      className="form-input"
                      placeholder="e.g., 10-A, Grade 12"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="form-input"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={newStudent.username}
                    onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                    className="form-input"
                    placeholder="Will use roll number if empty"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    If empty, roll number will be used as username
                  </div>
                </div>
                
                {/* Move buttons inside form */}
                <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '0' }}>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                        Adding...
                      </>
                    ) : (
                      '➕ Add Student'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Delete Student</h4>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ marginBottom: '1rem' }}>Are you sure?</h3>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  You are about to delete <strong>{studentToDelete.name}</strong> (Roll No: {studentToDelete.rollNo}).
                </p>
                <p style={{ color: 'var(--red-accent)', fontSize: '0.9rem' }}>
                  This action will also remove all attendance records for this student and cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteStudent}
                className="btn btn-danger"
              >
                🗑️ Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManager;