import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, useAuth } from '../App';

const LearningPaths = () => {
  const { user } = useAuth();
  const [learningPaths, setLearningPaths] = useState([
    {
      id: '1',
      title: 'JavaScript Fundamentals',
      description: 'Master the basics of JavaScript programming in 7 days',
      duration: 7,
      progress: 29,
      lessons: [
        { day: 1, title: 'Variables and Data Types', completed: true },
        { day: 2, title: 'Functions and Scope', completed: true },
        { day: 3, title: 'Arrays and Objects', completed: false },
        { day: 4, title: 'DOM Manipulation', completed: false },
        { day: 5, title: 'Event Handling', completed: false },
        { day: 6, title: 'Async Programming', completed: false },
        { day: 7, title: 'Project Implementation', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Algebra Basics',
      description: 'Learn fundamental algebra concepts in 5 days',
      duration: 5,
      progress: 20,
      lessons: [
        { day: 1, title: 'Linear Equations', completed: true },
        { day: 2, title: 'Quadratic Equations', completed: false },
        { day: 3, title: 'Polynomials', completed: false },
        { day: 4, title: 'Factoring', completed: false },
        { day: 5, title: 'Advanced Topics', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Social Learning Path',
      description: 'Develop social skills and communication',
      duration: 10,
      progress: 0,
      lessons: [
        { day: 1, title: 'Communication Basics', completed: false },
        { day: 2, title: 'Active Listening', completed: false },
        { day: 3, title: 'Body Language', completed: false },
        { day: 4, title: 'Conflict Resolution', completed: false },
        { day: 5, title: 'Team Collaboration', completed: false }
      ]
    },
    {
      id: '4',
      title: 'Java Learning Path',
      description: 'Complete Java programming course',
      duration: 14,
      progress: 0,
      lessons: [
        { day: 1, title: 'Java Basics', completed: false },
        { day: 2, title: 'OOP Concepts', completed: false },
        { day: 3, title: 'Collections Framework', completed: false },
        { day: 4, title: 'Exception Handling', completed: false },
        { day: 5, title: 'File I/O', completed: false }
      ]
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pathToDelete, setPathToDelete] = useState(null);
  const [newPath, setNewPath] = useState({
    goal: '',
    subject: '',
    duration: 7
  });

  // Generate YouTube video URL for a concept
  const generateYouTubeVideo = (concept) => {
    // In a real implementation, this would call the YouTube API
    // For demo, we'll return a search URL that opens relevant videos
    const searchQuery = encodeURIComponent(`${concept} tutorial programming`);
    return `https://www.youtube.com/results?search_query=${searchQuery}`;
  };

  // Watch video handler
  const handleWatchVideo = (lesson) => {
    const videoUrl = generateYouTubeVideo(lesson.title);
    window.open(videoUrl, '_blank');
  };

  // Create new learning path
  const handleCreatePath = async (e) => {
    e.preventDefault();
    
    if (!newPath.goal || !newPath.subject) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Generate lessons based on subject and duration
      const lessons = [];
      for (let i = 1; i <= newPath.duration; i++) {
        lessons.push({
          day: i,
          title: `${newPath.subject} - Day ${i}`,
          completed: false
        });
      }

      const pathData = {
        id: Date.now().toString(),
        title: newPath.goal,
        description: `Learn ${newPath.subject} in ${newPath.duration} days`,
        duration: newPath.duration,
        progress: 0,
        lessons: lessons
      };

      setLearningPaths(prev => [...prev, pathData]);
      setNewPath({ goal: '', subject: '', duration: 7 });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create learning path:', error);
      alert('Failed to create learning path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 70) return 'var(--green-accent)';
    if (progress >= 40) return 'var(--blue-accent)';
    if (progress >= 20) return 'var(--orange-accent)';
    return 'var(--purple-primary)';
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Learning Paths
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            AI-generated personalized learning journeys with curated content
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
          style={{ fontSize: '1rem', padding: '0.875rem 1.5rem' }}
        >
          ➕ Create Learning Path
        </button>
      </div>

      {/* Learning Paths Grid */}
      <div className="learning-paths-grid">
        {learningPaths.map((path, index) => (
          <div key={path.id} className="learning-path-card animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            {/* Path Header */}
            <div className="path-header">
              <h3 className="path-title">{path.title}</h3>
              <p className="path-description">{path.description}</p>
              <div className="path-meta">
                <span>📅 {path.duration} days</span>
                <span>🎯 {path.progress}% complete</span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="path-progress">
              <div className="progress-header">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Progress
                </span>
                <span className="progress-percentage" style={{ color: getProgressColor(path.progress) }}>
                  {path.progress}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${path.progress}%`,
                    background: `linear-gradient(90deg, ${getProgressColor(path.progress)}, var(--green-accent))`
                  }}
                ></div>
              </div>
            </div>

            {/* Lessons List */}
            <div className="path-lessons">
              {path.lessons.slice(0, 4).map((lesson) => (
                <div key={`${path.id}-${lesson.day}`} className="lesson-item">
                  <div className="lesson-info">
                    <div className={`lesson-status ${lesson.completed ? 'completed' : 'pending'}`}>
                      {lesson.completed ? '✓' : lesson.day}
                    </div>
                    <span className="lesson-title">
                      Day {lesson.day}: {lesson.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleWatchVideo(lesson)}
                    className="btn btn-watch btn-sm"
                  >
                    ▶️ Watch
                  </button>
                </div>
              ))}
              
              {path.lessons.length > 4 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem 0', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.875rem' 
                }}>
                  + {path.lessons.length - 4} more days
                </div>
              )}
            </div>

            {/* Path Actions */}
            <div style={{ 
              padding: '1rem 2rem 2rem', 
              display: 'flex', 
              gap: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <Link 
                to={`/learning-path/${path.id}`}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                📖 View Path
              </Link>
              {user?.role === 'student' && (
                <Link 
                  to={`/progress/${path.id}`}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  📊 Track Progress
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {learningPaths.length === 0 && (
        <div className="glass-card">
          <div className="card-content text-center" style={{ padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No Learning Paths Yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Create your first learning path to start your educational journey.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              ➕ Create Your First Learning Path
            </button>
          </div>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4 className="modal-title">Create Learning Path</h4>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleCreatePath} className="form">
                <div className="form-group">
                  <label htmlFor="goal" className="form-label">
                    Learning Goal
                  </label>
                  <textarea
                    id="goal"
                    value={newPath.goal}
                    onChange={(e) => setNewPath({...newPath, goal: e.target.value})}
                    className="form-textarea"
                    placeholder="e.g., I want to learn React basics for web development"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={newPath.subject}
                    onChange={(e) => setNewPath({...newPath, subject: e.target.value})}
                    className="form-input"
                    placeholder="e.g., JavaScript, Python, React, Data Science"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="duration" className="form-label">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    value={newPath.duration}
                    onChange={(e) => setNewPath({...newPath, duration: parseInt(e.target.value)})}
                    className="form-input"
                    min="1"
                    max="30"
                    required
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePath}
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '1rem', height: '1rem' }}></div>
                    Generating...
                  </>
                ) : (
                  '🚀 Generate Path'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPaths;